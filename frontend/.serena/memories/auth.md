# Auth System (feat/auth branch)

## Architecture
- JWT (HS256) in httpOnly cookies: access_token (15min), refresh_token (30 days)
- Refresh token hash stored in `refresh_tokens` table (SHA-256 of JWT)
- Google OAuth 2.0 via golang.org/x/oauth2

## Backend files added
- `backend/migrations/000004_auth.up.sql` — users, refresh_tokens tables; user_id FK on decks/cards
- `backend/internal/domain/user.go` — User, RefreshToken, UserRepository, AuthService interfaces
- `backend/internal/repository/postgres/user_repo.go`
- `backend/internal/service/auth.go` — AuthServiceImpl (Register, Login, Refresh, Logout, GoogleCallback, ValidateAccessToken, GoogleAuthURL)
- `backend/internal/handler/auth.go` — AuthHandler (Register, Login, Logout, Refresh, Me, GoogleAuth, GoogleCallback, setAuthCookies, clearAuthCookies)
- `backend/internal/handler/middleware.go` — added AuthMiddleware (method on AuthHandler), getUserID(), contextKey type; fixed CORS to add Access-Control-Allow-Credentials: true
- `backend/internal/config/config.go` — added JWTSecret, JWTSecureCookie, GoogleClientID, GoogleClientSecret, GoogleRedirectURL
- `backend/internal/server/server.go` — added authSvc + secureCookie params, registered auth routes, /api/auth/me wrapped in AuthMiddleware
- `backend/.env.example` — added JWT/Google env vars

## New Go dependencies (added to go.mod, need `go mod tidy`)
- github.com/golang-jwt/jwt/v5 v5.2.1
- github.com/google/uuid v1.6.0
- golang.org/x/oauth2 v0.21.0

## Frontend files added
- `src/types/auth.ts` — User, LoginPayload, RegisterPayload
- `src/lib/api/auth.ts` — loginApi, registerApi, logoutApi, refreshApi, getMeApi (relative URLs via Next.js proxy)
- `src/lib/api/fetchWithAuth.ts` — fetch wrapper with 401 → refresh → retry → redirect to /login
- `src/store/useAuthStore.ts` — Zustand store (user, isLoading, setUser, setLoading, logout)
- `src/hooks/useAuth.ts` — useAuth() hook
- `src/components/auth/AuthProvider.tsx` — calls getMeApi() on mount to restore session
- `src/components/auth/LoginForm.tsx` — react-hook-form + zod
- `src/components/auth/RegisterForm.tsx` — react-hook-form + zod
- `src/components/auth/GoogleButton.tsx` — redirects to /api/auth/google
- `src/components/layout/ShellLayout.tsx` — conditionally shows Header/Sidebar (hides on /login, /register)
- `src/app/(auth)/layout.tsx` — centered card layout for auth pages
- `src/app/(auth)/login/page.tsx`
- `src/app/(auth)/register/page.tsx`
- `middleware.ts` (frontend root) — protects /cards, /decks, /dictionary; redirects logged-in users away from /login, /register

## Frontend files modified
- `src/app/layout.tsx` — uses ShellLayout + AuthProvider (wraps everything)
- `src/lib/api/cards.ts` — fetch → fetchWithAuth

## Key patterns
- Error format: `{ "error": { "code": "...", "message": "..." } }` (existing respondError helper)
- All API calls use relative URLs (Next.js proxy `/api/*` → `http://localhost:8080/api/*`)
- No localStorage for auth — cookies only
- ShellLayout pattern: client component with usePathname() to conditionally show app shell
