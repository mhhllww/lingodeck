package service

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"

	"github.com/mhlw/lingodeck/internal/domain"
)

const (
	accessTokenTTL       = 15 * time.Minute
	refreshTokenTTL      = 30 * 24 * time.Hour
	verificationTokenTTL = 24 * time.Hour
	resetTokenTTL        = time.Hour
)

var (
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrEmailTaken         = errors.New("email already registered")
	ErrInvalidToken       = errors.New("invalid or expired token")
	ErrEmailNotVerified   = errors.New("email not verified")
	ErrTokenAlreadyUsed   = errors.New("token already used")
	ErrUserNotFound       = errors.New("user not found")
)

type authClaims struct {
	UserID string `json:"uid"`
	Email  string `json:"email,omitempty"`
	jwt.RegisteredClaims
}

type AuthServiceImpl struct {
	repo        domain.UserRepository
	tokenRepo   domain.TokenRepository
	emailSvc    domain.EmailService
	jwtSecret   []byte
	oauthConfig *oauth2.Config
	proxyClient *http.Client
}

func NewAuthService(
	repo domain.UserRepository,
	tokenRepo domain.TokenRepository,
	emailSvc domain.EmailService,
	jwtSecret, googleClientID, googleClientSecret, googleRedirectURL string,
) *AuthServiceImpl {
	oauthCfg := &oauth2.Config{
		ClientID:     googleClientID,
		ClientSecret: googleClientSecret,
		RedirectURL:  googleRedirectURL,
		Scopes:       []string{"openid", "email", "profile"},
		Endpoint:     google.Endpoint,
	}
	proxyURL, _ := url.Parse(os.Getenv("HTTPS_PROXY"))
	proxyClient := &http.Client{
		Transport: &http.Transport{Proxy: http.ProxyURL(proxyURL)},
	}
	return &AuthServiceImpl{
		repo:        repo,
		tokenRepo:   tokenRepo,
		emailSvc:    emailSvc,
		jwtSecret:   []byte(jwtSecret),
		oauthConfig: oauthCfg,
		proxyClient: proxyClient,
	}
}

func (s *AuthServiceImpl) Register(ctx context.Context, req domain.RegisterRequest) error {
	existing, err := s.repo.GetByEmail(ctx, req.Email)
	if err != nil {
		return err
	}
	if existing != nil {
		return ErrEmailTaken
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), 12)
	if err != nil {
		return err
	}
	hashStr := string(hash)

	user := &domain.User{
		Email:         req.Email,
		PasswordHash:  &hashStr,
		Name:          req.Name,
		Provider:      "credentials",
		EmailVerified: false,
	}
	if err := s.repo.Create(ctx, user); err != nil {
		return err
	}

	raw, tokenHash, err := generateToken()
	if err != nil {
		return err
	}
	if err := s.tokenRepo.CreateEmailVerificationToken(ctx, user.ID, tokenHash, time.Now().Add(verificationTokenTTL)); err != nil {
		return err
	}

	go s.emailSvc.SendVerificationEmail(context.Background(), user.Email, user.Name, raw)

	return ErrEmailNotVerified
}

func (s *AuthServiceImpl) Login(ctx context.Context, req domain.LoginRequest) (*domain.AuthResult, error) {
	user, err := s.repo.GetByEmail(ctx, req.Email)
	if err != nil {
		return nil, err
	}
	if user == nil || user.PasswordHash == nil {
		return nil, ErrInvalidCredentials
	}
	if err := bcrypt.CompareHashAndPassword([]byte(*user.PasswordHash), []byte(req.Password)); err != nil {
		return nil, ErrInvalidCredentials
	}
	if !user.EmailVerified {
		return nil, ErrEmailNotVerified
	}

	tokens, err := s.issueTokens(ctx, user)
	if err != nil {
		return nil, err
	}
	return &domain.AuthResult{User: user, Tokens: tokens}, nil
}

func (s *AuthServiceImpl) VerifyEmail(ctx context.Context, rawToken string) (*domain.AuthResult, error) {
	tokenHash := hashToken(rawToken)
	t, err := s.tokenRepo.GetEmailVerificationToken(ctx, tokenHash)
	if err != nil {
		return nil, err
	}
	if t == nil || t.ExpiresAt.Before(time.Now()) {
		return nil, ErrInvalidToken
	}

	if err := s.repo.MarkEmailVerified(ctx, t.UserID); err != nil {
		return nil, err
	}
	if err := s.tokenRepo.DeleteEmailVerificationToken(ctx, tokenHash); err != nil {
		return nil, err
	}

	user, err := s.repo.GetByID(ctx, t.UserID)
	if err != nil || user == nil {
		return nil, ErrUserNotFound
	}

	tokens, err := s.issueTokens(ctx, user)
	if err != nil {
		return nil, err
	}
	return &domain.AuthResult{User: user, Tokens: tokens}, nil
}

func (s *AuthServiceImpl) ForgotPassword(ctx context.Context, email string) error {
	user, err := s.repo.GetByEmail(ctx, email)
	if err != nil {
		return err
	}
	if user == nil {
		return nil // never leak whether email exists
	}

	// Delete previous unused tokens
	_ = s.tokenRepo.DeletePasswordResetTokensByUserID(ctx, user.ID)

	raw, tokenHash, err := generateToken()
	if err != nil {
		return err
	}
	if err := s.tokenRepo.CreatePasswordResetToken(ctx, user.ID, tokenHash, time.Now().Add(resetTokenTTL)); err != nil {
		return err
	}

	go s.emailSvc.SendPasswordResetEmail(context.Background(), user.Email, user.Name, raw)
	return nil
}

func (s *AuthServiceImpl) ResetPassword(ctx context.Context, rawToken, newPassword string) error {
	tokenHash := hashToken(rawToken)
	t, err := s.tokenRepo.GetPasswordResetToken(ctx, tokenHash)
	if err != nil {
		return err
	}
	if t == nil || t.ExpiresAt.Before(time.Now()) {
		return ErrInvalidToken
	}
	if t.UsedAt != nil {
		return ErrTokenAlreadyUsed
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(newPassword), 12)
	if err != nil {
		return err
	}
	if err := s.repo.UpdatePassword(ctx, t.UserID, string(hash)); err != nil {
		return err
	}
	return s.tokenRepo.MarkPasswordResetTokenUsed(ctx, tokenHash)
}

func (s *AuthServiceImpl) ResendVerification(ctx context.Context, email string) error {
	user, err := s.repo.GetByEmail(ctx, email)
	if err != nil {
		return err
	}
	if user == nil {
		return nil // don't leak
	}
	if user.EmailVerified {
		return errors.New("email already verified")
	}

	_ = s.tokenRepo.DeleteEmailVerificationTokensByUserID(ctx, user.ID)

	raw, tokenHash, err := generateToken()
	if err != nil {
		return err
	}
	if err := s.tokenRepo.CreateEmailVerificationToken(ctx, user.ID, tokenHash, time.Now().Add(verificationTokenTTL)); err != nil {
		return err
	}

	go s.emailSvc.SendVerificationEmail(context.Background(), user.Email, user.Name, raw)
	return nil
}

func (s *AuthServiceImpl) Refresh(ctx context.Context, refreshToken string) (*domain.TokenPair, error) {
	claims, err := s.parseToken(refreshToken)
	if err != nil {
		return nil, ErrInvalidToken
	}

	hash := hashToken(refreshToken)
	rt, err := s.repo.GetRefreshToken(ctx, hash)
	if err != nil {
		return nil, err
	}
	if rt == nil || rt.ExpiresAt.Before(time.Now()) {
		return nil, ErrInvalidToken
	}

	userID, err := uuid.Parse(claims.UserID)
	if err != nil {
		return nil, ErrInvalidToken
	}
	user, err := s.repo.GetByID(ctx, userID)
	if err != nil || user == nil {
		return nil, ErrInvalidToken
	}

	if err := s.repo.DeleteRefreshToken(ctx, hash); err != nil {
		return nil, err
	}
	return s.issueTokens(ctx, user)
}

func (s *AuthServiceImpl) Logout(ctx context.Context, refreshToken string) error {
	return s.repo.DeleteRefreshToken(ctx, hashToken(refreshToken))
}

func (s *AuthServiceImpl) GoogleCallback(ctx context.Context, code string) (*domain.AuthResult, error) {
	ctx = context.WithValue(ctx, oauth2.HTTPClient, s.proxyClient)
	oauthToken, err := s.oauthConfig.Exchange(ctx, code)
	if err != nil {
		return nil, fmt.Errorf("oauth exchange: %w", err)
	}

	client := s.oauthConfig.Client(ctx, oauthToken)
	resp, err := client.Get("https://www.googleapis.com/oauth2/v2/userinfo")
	if err != nil {
		return nil, fmt.Errorf("userinfo fetch: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var info struct {
		ID        string `json:"id"`
		Email     string `json:"email"`
		Name      string `json:"name"`
		AvatarURL string `json:"picture"`
	}
	if err := json.Unmarshal(body, &info); err != nil {
		return nil, err
	}

	user, err := s.repo.GetByProviderID(ctx, "google", info.ID)
	if err != nil {
		return nil, err
	}
	if user == nil {
		user, err = s.repo.GetByEmail(ctx, info.Email)
		if err != nil {
			return nil, err
		}
		if user != nil {
			user.Provider = "google"
			user.ProviderID = &info.ID
			if user.AvatarURL == nil && info.AvatarURL != "" {
				user.AvatarURL = &info.AvatarURL
			}
			if err := s.repo.Update(ctx, user); err != nil {
				return nil, err
			}
		}
	}
	if user == nil {
		newUser := &domain.User{
			Email:         info.Email,
			Name:          info.Name,
			Provider:      "google",
			ProviderID:    &info.ID,
			EmailVerified: true, // Google users are auto-verified
		}
		if info.AvatarURL != "" {
			newUser.AvatarURL = &info.AvatarURL
		}
		if err := s.repo.Create(ctx, newUser); err != nil {
			return nil, err
		}
		user = newUser
	}

	tokens, err := s.issueTokens(ctx, user)
	if err != nil {
		return nil, err
	}
	return &domain.AuthResult{User: user, Tokens: tokens}, nil
}

func (s *AuthServiceImpl) Me(ctx context.Context, userID uuid.UUID) (*domain.User, error) {
	return s.repo.GetByID(ctx, userID)
}

func (s *AuthServiceImpl) ValidateAccessToken(token string) (*domain.TokenClaims, error) {
	claims, err := s.parseToken(token)
	if err != nil {
		return nil, ErrInvalidToken
	}
	userID, err := uuid.Parse(claims.UserID)
	if err != nil {
		return nil, ErrInvalidToken
	}
	return &domain.TokenClaims{UserID: userID, Email: claims.Email}, nil
}

func (s *AuthServiceImpl) GoogleAuthURL(state string) string {
	return s.oauthConfig.AuthCodeURL(state, oauth2.AccessTypeOffline)
}

// --- helpers ---

func (s *AuthServiceImpl) issueTokens(ctx context.Context, user *domain.User) (*domain.TokenPair, error) {
	accessToken, err := s.signToken(user.ID.String(), user.Email, accessTokenTTL)
	if err != nil {
		return nil, err
	}
	refreshToken, err := s.signToken(user.ID.String(), "", refreshTokenTTL)
	if err != nil {
		return nil, err
	}
	if err := s.repo.StoreRefreshToken(ctx, user.ID, hashToken(refreshToken), time.Now().Add(refreshTokenTTL)); err != nil {
		return nil, err
	}
	return &domain.TokenPair{AccessToken: accessToken, RefreshToken: refreshToken}, nil
}

func (s *AuthServiceImpl) signToken(userID, email string, ttl time.Duration) (string, error) {
	claims := authClaims{
		UserID: userID,
		Email:  email,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   userID,
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(ttl)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	return jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString(s.jwtSecret)
}

func (s *AuthServiceImpl) parseToken(tokenStr string) (*authClaims, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &authClaims{}, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return s.jwtSecret, nil
	})
	if err != nil || !token.Valid {
		return nil, ErrInvalidToken
	}
	claims, ok := token.Claims.(*authClaims)
	if !ok {
		return nil, ErrInvalidToken
	}
	return claims, nil
}

func hashToken(token string) string {
	sum := sha256.Sum256([]byte(token))
	return hex.EncodeToString(sum[:])
}

func generateToken() (raw, hash string, err error) {
	b := make([]byte, 32)
	if _, err = rand.Read(b); err != nil {
		return
	}
	raw = base64.URLEncoding.EncodeToString(b)
	h := sha256.Sum256([]byte(raw))
	hash = hex.EncodeToString(h[:])
	return
}
