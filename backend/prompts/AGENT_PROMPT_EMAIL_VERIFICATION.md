# Agent Prompt: LingoDeck — Email Verification & Password Reset

## Context

Auth system (register/login/logout/refresh/Google OAuth) is fully implemented. Now adding:

1. **Email verification** — user must verify email before accessing the app
2. **Password reset** — forgot password flow via email link

Email provider: **Resend** (`github.com/resend/resend-go/v2`)

Google OAuth users are considered **automatically verified** — do not send them verification emails.

---

## Phase 1: Database Migration

Add to a new migration file:

```sql
-- up

-- Email verification tokens
CREATE TABLE email_verification_tokens (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Password reset tokens
CREATE TABLE password_reset_tokens (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at    TIMESTAMPTZ,          -- NULL = not used yet
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add email_verified column to users
ALTER TABLE users ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT FALSE;

-- down
ALTER TABLE users DROP COLUMN email_verified;
DROP TABLE password_reset_tokens;
DROP TABLE email_verification_tokens;
```

---

## Phase 2: Backend

### New files / changes

```
backend/
├── handler/
│   └── auth.go              # ADD: 4 new handlers
├── service/
│   ├── auth.go              # MODIFY: register flow + add new methods
│   └── email.go             # NEW: email sending via Resend
├── repository/
│   └── postgres/
│       └── user.go          # ADD: token CRUD methods
├── domain/
│   └── user.go              # ADD: new interfaces + types
└── config/
    └── config.go            # ADD: Resend + app URL config
```

---

### Config

Add to existing config:

```go
ResendAPIKey   string // env: RESEND_API_KEY
EmailFrom      string // env: EMAIL_FROM (e.g. "LingoDeck <noreply@lingodeck.ru>")
AppURL         string // env: APP_URL (e.g. "https://lingodeck.ru")
```

Add to `.env.example`:
```
RESEND_API_KEY=re_...
EMAIL_FROM=LingoDeck <noreply@lingodeck.ru>
APP_URL=http://localhost:3000
```

---

### Domain (`domain/user.go`)

Add to existing file:

```go
type EmailService interface {
    SendVerificationEmail(ctx context.Context, toEmail, toName, token string) error
    SendPasswordResetEmail(ctx context.Context, toEmail, toName, token string) error
}

type TokenRepository interface {
    CreateEmailVerificationToken(ctx context.Context, userID uuid.UUID, tokenHash string, expiresAt time.Time) error
    GetEmailVerificationToken(ctx context.Context, tokenHash string) (*EmailVerificationToken, error)
    DeleteEmailVerificationToken(ctx context.Context, tokenHash string) error

    CreatePasswordResetToken(ctx context.Context, userID uuid.UUID, tokenHash string, expiresAt time.Time) error
    GetPasswordResetToken(ctx context.Context, tokenHash string) (*PasswordResetToken, error)
    MarkPasswordResetTokenUsed(ctx context.Context, tokenHash string) error
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
```

Also add `EmailVerified bool` field to existing `User` struct.

---

### Email Service (`service/email.go`)

```go
package service

import (
    "github.com/resend/resend-go/v2"
)

type emailService struct {
    client   *resend.Client
    fromAddr string
    appURL   string
}

func NewEmailService(apiKey, fromAddr, appURL string) domain.EmailService {
    return &emailService{
        client:   resend.NewClient(apiKey),
        fromAddr: fromAddr,
        appURL:   appURL,
    }
}
```

**SendVerificationEmail:**
- Link format: `{appURL}/verify-email?token={rawToken}`
- Subject: `"Verify your LingoDeck email"`
- Plain HTML email, minimal styling — just a heading, short text, and a big link/button

**SendPasswordResetEmail:**
- Link format: `{appURL}/reset-password?token={rawToken}`
- Subject: `"Reset your LingoDeck password"`
- Same minimal HTML
- Add note: "This link expires in 1 hour. If you didn't request this, ignore the email."

**Token generation pattern (use in both emails):**

```go
// Generate a cryptographically secure random token
func generateToken() (raw string, hash string, err error) {
    b := make([]byte, 32)
    if _, err = rand.Read(b); err != nil {
        return
    }
    raw = base64.URLEncoding.EncodeToString(b)
    h := sha256.Sum256([]byte(raw))
    hash = hex.EncodeToString(h[:])
    return
}
```

Store only the **hash** in DB. Send the **raw** token in the email link. On verification, hash the incoming token and compare against DB.

---

### Auth Service (`service/auth.go`)

**Modify `Register`:**

```go
// After creating the user:
// 1. Generate verification token
raw, hash, _ := generateToken()
expiresAt := time.Now().Add(24 * time.Hour)
s.tokenRepo.CreateEmailVerificationToken(ctx, user.ID, hash, expiresAt)

// 2. Send verification email (non-blocking — use goroutine)
go s.emailService.SendVerificationEmail(ctx, user.Email, user.Name, raw)

// 3. Do NOT issue JWT tokens yet — return a specific response indicating "check your email"
return nil, ErrEmailNotVerified  // define this sentinel error
```

**Add new service methods:**

```go
// VerifyEmail: hash the incoming token, look it up, mark user.email_verified = true, delete token, issue JWT pair
func (s *authService) VerifyEmail(ctx context.Context, rawToken string) (*TokenPair, error)

// ForgotPassword: find user by email, generate reset token, send email
// If email not found → return nil error (don't leak whether email exists)
func (s *authService) ForgotPassword(ctx context.Context, email string) error

// ResetPassword: hash token, look it up, check not used + not expired,
// hash new password with bcrypt, update user, mark token as used
func (s *authService) ResetPassword(ctx context.Context, rawToken, newPassword string) error

// ResendVerification: find user by email, check not already verified,
// delete old tokens for this user, generate new one, send email
func (s *authService) ResendVerification(ctx context.Context, email string) error
```

**Modify login check:**

```go
// In Login(), after password check:
if !user.EmailVerified {
    return nil, ErrEmailNotVerified
}
```

**Sentinel errors to define:**

```go
var (
    ErrEmailNotVerified   = errors.New("email not verified")
    ErrInvalidToken       = errors.New("invalid or expired token")
    ErrTokenAlreadyUsed   = errors.New("token already used")
    ErrUserNotFound       = errors.New("user not found")
    ErrEmailAlreadyExists = errors.New("email already exists")
)
```

---

### New Endpoints (`handler/auth.go`)

Add to existing router:

```
POST  /api/auth/verify-email      → body: { token: string }
POST  /api/auth/forgot-password   → body: { email: string }
POST  /api/auth/reset-password    → body: { token: string, password: string }
POST  /api/auth/resend-verification → body: { email: string }
```

**Handler responses:**

`POST /api/auth/verify-email`:
- Success (200): set auth cookies + `{ "user": {...} }` — user is now logged in
- Error (400): `{ "error": "invalid or expired token" }`

`POST /api/auth/forgot-password`:
- Always 200 regardless of whether email exists: `{ "message": "If this email is registered, you will receive a reset link" }`

`POST /api/auth/reset-password`:
- Success (200): `{ "message": "Password updated successfully" }`
- Error (400): `{ "error": "invalid or expired token" }` or `{ "error": "token already used" }`

`POST /api/auth/resend-verification`:
- Success (200): `{ "message": "Verification email sent" }`
- Error (400): `{ "error": "email already verified" }`

**Map sentinel errors to HTTP status in a helper:**

```go
func authErrorToStatus(err error) int {
    switch {
    case errors.Is(err, service.ErrEmailNotVerified):
        return http.StatusForbidden  // 403
    case errors.Is(err, service.ErrInvalidToken),
         errors.Is(err, service.ErrTokenAlreadyUsed):
        return http.StatusBadRequest
    case errors.Is(err, service.ErrUserNotFound):
        return http.StatusNotFound
    case errors.Is(err, service.ErrEmailAlreadyExists):
        return http.StatusConflict  // 409
    default:
        return http.StatusInternalServerError
    }
}
```

---

## Phase 3: Frontend

### New pages / files

```
src/
├── app/
│   └── (auth)/
│       ├── verify-email/
│       │   └── page.tsx         # Reads ?token= from URL, auto-calls API
│       ├── check-email/
│       │   └── page.tsx         # "Check your inbox" screen after register
│       ├── forgot-password/
│       │   └── page.tsx         # Enter email form
│       └── reset-password/
│           └── page.tsx         # New password form, reads ?token= from URL
├── lib/
│   └── api/
│       └── auth.ts              # ADD: 4 new API functions
```

---

### API Client additions (`src/lib/api/auth.ts`)

```typescript
export async function verifyEmailApi(token: string): Promise<User>
export async function forgotPasswordApi(email: string): Promise<void>
export async function resetPasswordApi(token: string, password: string): Promise<void>
export async function resendVerificationApi(email: string): Promise<void>
```

---

### Pages

**`/check-email` page:**

Shown immediately after successful registration. No token logic here — just a static screen.

```
📬  Check your inbox

We sent a verification link to
danil@example.com

The link expires in 24 hours.

[Resend email]     ← calls resendVerificationApi, show cooldown (60s) after click
```

- Get the email from query param `?email=...` (passed during redirect after register)
- "Resend email" button: disable for 60 seconds after click, show countdown

**`/verify-email` page:**

On mount, read `?token=` from URL and immediately call `verifyEmailApi(token)`.

States:
- **Loading:** spinner + "Verifying your email..."
- **Success:** checkmark + "Email verified! Redirecting..." → redirect to `/` after 2s
- **Error:** "This link is invalid or has expired." + button "Request a new link" → goes to `/check-email`

No user input needed on this page — it's fully automatic.

**`/forgot-password` page:**

Simple form: one email input + submit button.

- Zod schema: `z.object({ email: z.string().email() })`
- On success (regardless of whether email exists): show inline message "If this email is registered, you will receive a reset link" — do NOT redirect, just replace the form with the message
- Link back to `/login`

**`/reset-password` page:**

Read `?token=` from URL. Show a form with two fields: new password + confirm password.

- Zod schema: password min 8 chars, passwords must match
- On success: show "Password updated!" + redirect to `/login` after 2s
- On error (invalid/expired token): show error message + link to `/forgot-password`

---

### Register flow change (`LoginForm` / register logic)

After successful `registerApi()` call — instead of logging in and redirecting to `/`:

```typescript
// In useAuth or RegisterForm after successful register:
router.push(`/check-email?email=${encodeURIComponent(payload.email)}`);
```

On the backend, `POST /api/auth/register` now returns **200 with no cookies** (just a success message) since the user isn't logged in yet:

```json
{ "message": "registered" }
```

Update `registerApi()` return type accordingly — it no longer returns a `User`.

---

### Login flow change

If login returns **403** (email not verified):
- Show inline error under the form: "Please verify your email first."
- Show a small link: "Resend verification email" → navigates to `/check-email?email=...`

---

### Middleware update (`middleware.ts`)

Add new auth routes to the `AUTH_ROUTES` list so logged-in users are redirected away from them:

```typescript
const AUTH_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email', '/check-email'];
```

---

## Constraints

- **Do not change** any existing handler, service method, or frontend component that is already working — only add to them where specified (register, login)
- **Google OAuth users** skip all email verification logic entirely — set `email_verified = true` when creating them in `GoogleCallback`
- **Security:** never confirm or deny whether an email exists in `ForgotPassword` — always return the same generic message
- **Token hygiene:** expired tokens should not block new ones — when calling `ResendVerification`, delete all existing unused tokens for that user before creating a new one. Same for `ForgotPassword`.
- **No new frontend libraries** — use existing shadcn/ui, react-hook-form, Zod, lucide-react
