package domain

import (
	"context"
	"time"

	"github.com/google/uuid"
)

type User struct {
	ID            uuid.UUID
	Email         string
	PasswordHash  *string
	Name          string
	AvatarURL     *string
	Provider      string
	ProviderID    *string
	EmailVerified bool
	CreatedAt     time.Time
	UpdatedAt     time.Time
}

type EmailVerificationToken struct {
	ID        uuid.UUID
	UserID    uuid.UUID
	TokenHash string
	ExpiresAt time.Time
	CreatedAt time.Time
}

type PasswordResetToken struct {
	ID        uuid.UUID
	UserID    uuid.UUID
	TokenHash string
	ExpiresAt time.Time
	UsedAt    *time.Time
	CreatedAt time.Time
}

type RefreshToken struct {
	ID        uuid.UUID
	UserID    uuid.UUID
	TokenHash string
	ExpiresAt time.Time
	CreatedAt time.Time
}

type UserRepository interface {
	Create(ctx context.Context, user *User) error
	GetByEmail(ctx context.Context, email string) (*User, error)
	GetByID(ctx context.Context, id uuid.UUID) (*User, error)
	GetByProviderID(ctx context.Context, provider, providerID string) (*User, error)
	Update(ctx context.Context, user *User) error
	MarkEmailVerified(ctx context.Context, userID uuid.UUID) error
	UpdatePassword(ctx context.Context, userID uuid.UUID, passwordHash string) error
	StoreRefreshToken(ctx context.Context, userID uuid.UUID, tokenHash string, expiresAt time.Time) error
	GetRefreshToken(ctx context.Context, tokenHash string) (*RefreshToken, error)
	DeleteRefreshToken(ctx context.Context, tokenHash string) error
}

type TokenRepository interface {
	CreateEmailVerificationToken(ctx context.Context, userID uuid.UUID, tokenHash string, expiresAt time.Time) error
	GetEmailVerificationToken(ctx context.Context, tokenHash string) (*EmailVerificationToken, error)
	DeleteEmailVerificationToken(ctx context.Context, tokenHash string) error
	DeleteEmailVerificationTokensByUserID(ctx context.Context, userID uuid.UUID) error

	CreatePasswordResetToken(ctx context.Context, userID uuid.UUID, tokenHash string, expiresAt time.Time) error
	GetPasswordResetToken(ctx context.Context, tokenHash string) (*PasswordResetToken, error)
	MarkPasswordResetTokenUsed(ctx context.Context, tokenHash string) error
	DeletePasswordResetTokensByUserID(ctx context.Context, userID uuid.UUID) error
}

type EmailService interface {
	SendVerificationEmail(ctx context.Context, toEmail, toName, token string) error
	SendPasswordResetEmail(ctx context.Context, toEmail, toName, token string) error
}

type AuthService interface {
	Register(ctx context.Context, req RegisterRequest) error
	Login(ctx context.Context, req LoginRequest) (*AuthResult, error)
	Refresh(ctx context.Context, refreshToken string) (*TokenPair, error)
	Logout(ctx context.Context, refreshToken string) error
	GoogleCallback(ctx context.Context, code string) (*AuthResult, error)
	Me(ctx context.Context, userID uuid.UUID) (*User, error)
	ValidateAccessToken(token string) (*TokenClaims, error)
	VerifyEmail(ctx context.Context, rawToken string) (*AuthResult, error)
	ForgotPassword(ctx context.Context, email string) error
	ResetPassword(ctx context.Context, rawToken, newPassword string) error
	ResendVerification(ctx context.Context, email string) error
}

type TokenPair struct {
	AccessToken  string
	RefreshToken string
}

type AuthResult struct {
	User  *User
	Tokens *TokenPair
}

type TokenClaims struct {
	UserID uuid.UUID
	Email  string
}

type RegisterRequest struct {
	Email    string
	Password string
	Name     string
}

type LoginRequest struct {
	Email    string
	Password string
}
