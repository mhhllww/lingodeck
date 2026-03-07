package handler

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/mhlw/lingodeck/internal/domain"
	"github.com/mhlw/lingodeck/internal/service"
)

type AuthHandler struct {
	svc          domain.AuthService
	secureCookie bool
}

func NewAuthHandler(svc domain.AuthService, secureCookie bool) *AuthHandler {
	return &AuthHandler{svc: svc, secureCookie: secureCookie}
}

type userResponse struct {
	ID        string  `json:"id"`
	Email     string  `json:"email"`
	Name      string  `json:"name"`
	AvatarURL *string `json:"avatarUrl"`
}

func toUserResponse(u *domain.User) userResponse {
	return userResponse{
		ID:        u.ID.String(),
		Email:     u.Email,
		Name:      u.Name,
		AvatarURL: u.AvatarURL,
	}
}

func authErrorToStatus(err error) (int, string) {
	switch {
	case errors.Is(err, service.ErrEmailNotVerified):
		return http.StatusForbidden, "EMAIL_NOT_VERIFIED"
	case errors.Is(err, service.ErrInvalidToken), errors.Is(err, service.ErrTokenAlreadyUsed):
		return http.StatusBadRequest, "INVALID_TOKEN"
	case errors.Is(err, service.ErrUserNotFound):
		return http.StatusNotFound, "NOT_FOUND"
	case errors.Is(err, service.ErrEmailTaken):
		return http.StatusConflict, "EMAIL_TAKEN"
	case errors.Is(err, service.ErrInvalidCredentials):
		return http.StatusUnauthorized, "INVALID_CREDENTIALS"
	default:
		return http.StatusInternalServerError, "INTERNAL_ERROR"
	}
}

// Register godoc
// @Summary Register a new user
// @Tags auth
// @Param body body domain.RegisterRequest true "Register payload"
// @Success 200 {object} map[string]string
// @Failure 400 {object} errorBody
// @Failure 409 {object} errorBody
// @Router /api/auth/register [post]
func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req domain.RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "BAD_REQUEST", "invalid request body")
		return
	}
	if req.Email == "" || req.Password == "" || req.Name == "" {
		respondError(w, http.StatusBadRequest, "BAD_REQUEST", "email, password and name are required")
		return
	}

	err := h.svc.Register(r.Context(), req)
	if err != nil {
		if errors.Is(err, service.ErrEmailNotVerified) {
			// Expected: user created, verification email sent
			respondJSON(w, http.StatusOK, map[string]string{"message": "registered"})
			return
		}
		status, code := authErrorToStatus(err)
		respondError(w, status, code, err.Error())
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{"message": "registered"})
}

// Login godoc
// @Summary Login with email and password
// @Tags auth
// @Param body body domain.LoginRequest true "Login payload"
// @Success 200 {object} map[string]userResponse
// @Failure 400 {object} errorBody
// @Failure 401 {object} errorBody
// @Failure 403 {object} errorBody
// @Router /api/auth/login [post]
func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req domain.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "BAD_REQUEST", "invalid request body")
		return
	}
	if req.Email == "" || req.Password == "" {
		respondError(w, http.StatusBadRequest, "BAD_REQUEST", "email and password are required")
		return
	}

	result, err := h.svc.Login(r.Context(), req)
	if err != nil {
		status, code := authErrorToStatus(err)
		respondError(w, status, code, err.Error())
		return
	}

	setAuthCookies(w, result.Tokens, h.secureCookie)
	respondJSON(w, http.StatusOK, map[string]any{"user": toUserResponse(result.User)})
}

// Logout godoc
// @Summary Logout and clear auth cookies
// @Tags auth
// @Success 204
// @Router /api/auth/logout [post]
func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	if cookie, err := r.Cookie("refresh_token"); err == nil {
		_ = h.svc.Logout(r.Context(), cookie.Value)
	}
	clearAuthCookies(w, h.secureCookie)
	w.WriteHeader(http.StatusNoContent)
}

// Refresh godoc
// @Summary Rotate tokens using refresh cookie
// @Tags auth
// @Success 204
// @Failure 401 {object} errorBody
// @Router /api/auth/refresh [post]
func (h *AuthHandler) Refresh(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("refresh_token")
	if err != nil {
		respondError(w, http.StatusUnauthorized, "UNAUTHORIZED", "refresh token missing")
		return
	}

	tokens, err := h.svc.Refresh(r.Context(), cookie.Value)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "UNAUTHORIZED", "invalid or expired refresh token")
		return
	}

	setAuthCookies(w, tokens, h.secureCookie)
	w.WriteHeader(http.StatusNoContent)
}

// Me godoc
// @Summary Get current authenticated user
// @Tags auth
// @Success 200 {object} map[string]userResponse
// @Failure 401 {object} errorBody
// @Router /api/auth/me [get]
func (h *AuthHandler) Me(w http.ResponseWriter, r *http.Request) {
	userID, ok := getUserID(r)
	if !ok {
		respondError(w, http.StatusUnauthorized, "UNAUTHORIZED", "unauthorized")
		return
	}

	user, err := h.svc.Me(r.Context(), userID)
	if err != nil || user == nil {
		respondError(w, http.StatusUnauthorized, "UNAUTHORIZED", "user not found")
		return
	}

	respondJSON(w, http.StatusOK, map[string]any{"user": toUserResponse(user)})
}

// GoogleAuth godoc
// @Summary Redirect to Google OAuth
// @Tags auth
// @Success 302
// @Router /api/auth/google [get]
func (h *AuthHandler) GoogleAuth(w http.ResponseWriter, r *http.Request) {
	impl, ok := h.svc.(*service.AuthServiceImpl)
	if !ok {
		respondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "oauth not configured")
		return
	}
	http.Redirect(w, r, impl.GoogleAuthURL("state"), http.StatusFound)
}

// GoogleCallback godoc
// @Summary Handle Google OAuth callback
// @Tags auth
// @Param code query string true "OAuth code"
// @Success 302
// @Router /api/auth/google/callback [get]
func (h *AuthHandler) GoogleCallback(w http.ResponseWriter, r *http.Request) {
	code := r.URL.Query().Get("code")
	if code == "" {
		respondError(w, http.StatusBadRequest, "BAD_REQUEST", "missing code")
		return
	}

	result, err := h.svc.GoogleCallback(r.Context(), code)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "oauth callback failed")
		return
	}

	setAuthCookies(w, result.Tokens, h.secureCookie)
	http.Redirect(w, r, "/", http.StatusFound)
}

// VerifyEmail godoc
// @Summary Verify email with token
// @Tags auth
// @Param body body map[string]string true "token"
// @Success 200 {object} map[string]userResponse
// @Failure 400 {object} errorBody
// @Router /api/auth/verify-email [post]
func (h *AuthHandler) VerifyEmail(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Token string `json:"token"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.Token == "" {
		respondError(w, http.StatusBadRequest, "BAD_REQUEST", "token is required")
		return
	}

	result, err := h.svc.VerifyEmail(r.Context(), body.Token)
	if err != nil {
		status, code := authErrorToStatus(err)
		respondError(w, status, code, err.Error())
		return
	}

	setAuthCookies(w, result.Tokens, h.secureCookie)
	respondJSON(w, http.StatusOK, map[string]any{"user": toUserResponse(result.User)})
}

// ForgotPassword godoc
// @Summary Send password reset email
// @Tags auth
// @Param body body map[string]string true "email"
// @Success 200 {object} map[string]string
// @Router /api/auth/forgot-password [post]
func (h *AuthHandler) ForgotPassword(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Email string `json:"email"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.Email == "" {
		respondError(w, http.StatusBadRequest, "BAD_REQUEST", "email is required")
		return
	}

	// Always return the same response regardless of whether email exists
	_ = h.svc.ForgotPassword(r.Context(), body.Email)
	respondJSON(w, http.StatusOK, map[string]string{
		"message": "If this email is registered, you will receive a reset link",
	})
}

// ResetPassword godoc
// @Summary Reset password with token
// @Tags auth
// @Param body body map[string]string true "token + password"
// @Success 200 {object} map[string]string
// @Failure 400 {object} errorBody
// @Router /api/auth/reset-password [post]
func (h *AuthHandler) ResetPassword(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Token    string `json:"token"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.Token == "" || body.Password == "" {
		respondError(w, http.StatusBadRequest, "BAD_REQUEST", "token and password are required")
		return
	}

	if err := h.svc.ResetPassword(r.Context(), body.Token, body.Password); err != nil {
		status, code := authErrorToStatus(err)
		respondError(w, status, code, err.Error())
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{"message": "Password updated successfully"})
}

// ResendVerification godoc
// @Summary Resend verification email
// @Tags auth
// @Param body body map[string]string true "email"
// @Success 200 {object} map[string]string
// @Failure 400 {object} errorBody
// @Router /api/auth/resend-verification [post]
func (h *AuthHandler) ResendVerification(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Email string `json:"email"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.Email == "" {
		respondError(w, http.StatusBadRequest, "BAD_REQUEST", "email is required")
		return
	}

	if err := h.svc.ResendVerification(r.Context(), body.Email); err != nil {
		if err.Error() == "email already verified" {
			respondError(w, http.StatusBadRequest, "ALREADY_VERIFIED", "email already verified")
			return
		}
		respondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "failed to resend verification")
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{"message": "Verification email sent"})
}

// --- cookie helpers ---

func setAuthCookies(w http.ResponseWriter, tokens *domain.TokenPair, secure bool) {
	http.SetCookie(w, &http.Cookie{
		Name:     "access_token",
		Value:    tokens.AccessToken,
		HttpOnly: true,
		Secure:   secure,
		SameSite: http.SameSiteLaxMode,
		Path:     "/",
		MaxAge:   15 * 60,
	})
	http.SetCookie(w, &http.Cookie{
		Name:     "refresh_token",
		Value:    tokens.RefreshToken,
		HttpOnly: true,
		Secure:   secure,
		SameSite: http.SameSiteLaxMode,
		Path:     "/api/auth/refresh",
		MaxAge:   30 * 24 * 60 * 60,
	})
}

func clearAuthCookies(w http.ResponseWriter, secure bool) {
	http.SetCookie(w, &http.Cookie{
		Name:     "access_token",
		HttpOnly: true,
		Secure:   secure,
		SameSite: http.SameSiteLaxMode,
		Path:     "/",
		MaxAge:   -1,
	})
	http.SetCookie(w, &http.Cookie{
		Name:     "refresh_token",
		HttpOnly: true,
		Secure:   secure,
		SameSite: http.SameSiteLaxMode,
		Path:     "/api/auth/refresh",
		MaxAge:   -1,
	})
}
