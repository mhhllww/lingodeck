# Agent Prompt: LingoDeck — Authentication System (Backend + Frontend)

## Context

You are implementing a **full-stack authentication system** for **LingoDeck** — a vocabulary learning app built as a monorepo:

```
lingodeck/
├── backend/   (Go)
└── frontend/  (Next.js)
```

There is currently **no auth at all**. Your job is to implement it end-to-end: database migration, Go backend (register/login/logout/refresh/OAuth), and Next.js frontend (forms, protected routes, session management).

---

## Tech Stack

### Backend
| Layer | Technology |
|-------|------------|
| Language | **Go** |
| Router | **`net/http`** with `http.NewServeMux()` — Go 1.22+ pattern matching (`GET /api/cards/{id}`) |
| Database | **PostgreSQL** via `pgx/v5/pgxpool` |
| Migrations | **`golang-migrate`** |
| Architecture | handler → service → repository (3 layers) |
| Existing middleware | `Logging`, `Recovery`, `CORS`, `ContentType` — in `handler/middleware.go` |
| Docs | **swaggo** (Swagger) |

### Frontend
| Layer | Technology |
|-------|------------|
| Framework | **Next.js 14+** (App Router, `src/app/`) |
| Language | **TypeScript** (strict mode) |
| UI | **shadcn/ui** + **Tailwind CSS v4** + **lucide-react** |
| State | **Zustand** |
| Data Fetching | **TanStack Query v5** |
| Validation | **Zod** |
| API Client | Native `fetch` wrapped in functions (`src/lib/api/`) |
| Animations | **Framer Motion** |

---

## Auth Specification

### Strategy
- **Credentials** (email + password) — primary
- **Google OAuth 2.0** — secondary
- **JWT** — access token (short-lived) + refresh token (long-lived)
- **Storage:** both tokens in **httpOnly cookies** (not localStorage)

### Token Lifecycle
```
Access token:  15 minutes
Refresh token: 30 days
```

On every protected request:
1. Client sends access token via httpOnly cookie
2. If `401` → client silently calls `POST /api/auth/refresh` with refresh token cookie
3. Server issues new access token
4. Original request is retried

---

## Phase 1: Database Migration (Backend)

### Task
Create a new migration file using `golang-migrate`. Follow the naming convention of existing migrations in the project.

### Migration: `users` table

```sql
-- up
CREATE TABLE users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email       TEXT NOT NULL UNIQUE,
    password_hash TEXT,                        -- NULL for OAuth-only users
    name        TEXT NOT NULL DEFAULT '',
    avatar_url  TEXT,
    provider    TEXT NOT NULL DEFAULT 'credentials', -- 'credentials' | 'google'
    provider_id TEXT,                          -- Google sub for OAuth users
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_users_provider ON users(provider, provider_id)
    WHERE provider_id IS NOT NULL;
```

Also add a `user_id` foreign key to existing tables (`decks`, `cards`, `words`) — **nullable for now** so existing data is not broken:

```sql
ALTER TABLE decks ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE cards ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE SET NULL;
```

---

## Phase 2: Backend Implementation

### File Structure (add to existing backend)

```
backend/
├── handler/
│   ├── auth.go              # Auth HTTP handlers
│   └── middleware.go        # ADD: AuthMiddleware here (alongside existing middleware)
├── service/
│   └── auth.go              # Business logic: register, login, refresh, OAuth
├── repository/
│   └── postgres/
│       └── user.go          # User DB queries
├── domain/
│   └── user.go              # User entity + interfaces
└── config/
    └── config.go            # ADD: JWT secret, OAuth credentials to existing config
```

### Domain (`domain/user.go`)

```go
type User struct {
    ID           uuid.UUID
    Email        string
    PasswordHash *string
    Name         string
    AvatarURL    *string
    Provider     string
    ProviderID   *string
    CreatedAt    time.Time
    UpdatedAt    time.Time
}

type UserRepository interface {
    Create(ctx context.Context, user *User) error
    GetByEmail(ctx context.Context, email string) (*User, error)
    GetByID(ctx context.Context, id uuid.UUID) (*User, error)
    GetByProviderID(ctx context.Context, provider, providerID string) (*User, error)
    Update(ctx context.Context, user *User) error
}

type AuthService interface {
    Register(ctx context.Context, req RegisterRequest) (*TokenPair, error)
    Login(ctx context.Context, req LoginRequest) (*TokenPair, error)
    Refresh(ctx context.Context, refreshToken string) (*TokenPair, error)
    Logout(ctx context.Context, refreshToken string) error
    GoogleCallback(ctx context.Context, code string) (*TokenPair, error)
    Me(ctx context.Context, userID uuid.UUID) (*User, error)
}

type TokenPair struct {
    AccessToken  string
    RefreshToken string
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
```

### Endpoints

Register all routes in the **existing** `http.NewServeMux()` router. Follow the pattern of existing routes.

```
POST   /api/auth/register        → Register with email + password
POST   /api/auth/login           → Login with email + password
POST   /api/auth/logout          → Clear auth cookies
POST   /api/auth/refresh         → Rotate tokens using refresh cookie
GET    /api/auth/me              → Get current user (protected)
GET    /api/auth/google          → Redirect to Google OAuth
GET    /api/auth/google/callback → Handle Google OAuth callback
```

### Handler (`handler/auth.go`)

Each handler must:
- Decode JSON body with `json.NewDecoder(r.Body).Decode(&req)`
- Validate input (non-empty fields)
- Call the service layer
- On success: set httpOnly cookies + return JSON
- On error: return appropriate HTTP status codes

**Cookie setup (reuse this helper):**

```go
func setAuthCookies(w http.ResponseWriter, tokens *domain.TokenPair) {
    http.SetCookie(w, &http.Cookie{
        Name:     "access_token",
        Value:    tokens.AccessToken,
        HttpOnly: true,
        Secure:   true,         // false in local dev — read from config
        SameSite: http.SameSiteLaxMode,
        Path:     "/",
        MaxAge:   15 * 60,      // 15 minutes
    })
    http.SetCookie(w, &http.Cookie{
        Name:     "refresh_token",
        Value:    tokens.RefreshToken,
        HttpOnly: true,
        Secure:   true,
        SameSite: http.SameSiteLaxMode,
        Path:     "/api/auth/refresh",
        MaxAge:   30 * 24 * 60 * 60, // 30 days
    })
}

func clearAuthCookies(w http.ResponseWriter) {
    // Set same cookies with MaxAge: -1
}
```

**JSON response format (be consistent):**

```json
// Success
{ "user": { "id": "...", "email": "...", "name": "...", "avatarUrl": "..." } }

// Error
{ "error": "invalid credentials" }
```

### Service (`service/auth.go`)

**Credentials flow:**
- `Register`: validate email format, hash password with `bcrypt` (cost 12), create user, issue tokens
- `Login`: get user by email, compare password hash with `bcrypt.CompareHashAndPassword`, issue tokens

**JWT:**
- Use `github.com/golang-jwt/jwt/v5`
- Access token claims: `{ sub: userID, email, exp }`
- Refresh token claims: `{ sub: userID, exp }` — store refresh token hash in DB or Redis (use DB for now — add `refresh_tokens` table in the same migration)
- Sign with `HS256` using secret from config

**`refresh_tokens` table (add to migration):**
```sql
CREATE TABLE refresh_tokens (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Google OAuth:**
- Use `golang.org/x/oauth2` + `golang.org/x/oauth2/google`
- On callback: exchange code → get access token → fetch user info from `https://www.googleapis.com/oauth2/v2/userinfo`
- If user with this `provider_id` exists → login, else → create user (no password) → login

### Middleware (`handler/middleware.go`)

Add `AuthMiddleware` alongside existing middleware functions. Do **not** change the existing ones.

```go
func (h *Handler) AuthMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        cookie, err := r.Cookie("access_token")
        if err != nil {
            http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
            return
        }
        claims, err := h.authService.ValidateAccessToken(cookie.Value)
        if err != nil {
            http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
            return
        }
        ctx := context.WithValue(r.Context(), contextKeyUserID, claims.UserID)
        next.ServeHTTP(w, r.WithContext(ctx))
    })
}

// Helper to get userID from context in handlers
func getUserID(r *http.Request) (uuid.UUID, bool) {
    id, ok := r.Context().Value(contextKeyUserID).(uuid.UUID)
    return id, ok
}
```

Wrap protected routes with this middleware in the router setup.

### Config

Add to the existing config struct/loading:
```go
JWTSecret         string // env: JWT_SECRET
JWTSecurecookie   bool   // env: JWT_SECURE_COOKIE (false in dev)
GoogleClientID    string // env: GOOGLE_CLIENT_ID
GoogleClientSecret string // env: GOOGLE_CLIENT_SECRET
GoogleRedirectURL  string // env: GOOGLE_REDIRECT_URL
```

Add to `.env.example`:
```
JWT_SECRET=your-secret-here-min-32-chars
JWT_SECURE_COOKIE=false
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URL=http://localhost:3000/api/auth/google/callback
```

### Swagger

Add `@swagger` annotations to all new handlers following the existing pattern in the codebase.

---

## Phase 3: Frontend Implementation

### File Structure (add to existing frontend)

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx          # Login page
│   │   └── register/
│   │       └── page.tsx          # Register page
│   └── layout.tsx                # ADD: wrap with AuthProvider
├── components/
│   └── auth/
│       ├── LoginForm.tsx         # Email/password login form
│       ├── RegisterForm.tsx      # Registration form
│       ├── GoogleButton.tsx      # "Continue with Google" button
│       └── AuthGuard.tsx         # Protects client components
├── hooks/
│   └── useAuth.ts                # Auth hook (wraps Zustand store)
├── lib/
│   └── api/
│       └── auth.ts               # Auth API calls
├── store/
│   └── useAuthStore.ts           # Zustand auth store
└── types/
    └── auth.ts                   # Auth-related types
```

### Types (`src/types/auth.ts`)

```typescript
export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  name: string;
}
```

### API Client (`src/lib/api/auth.ts`)

Follow the existing pattern in `src/lib/api/cards.ts`. Use native `fetch` with `credentials: 'include'` on every request (required for httpOnly cookies to be sent cross-origin).

```typescript
const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export async function loginApi(payload: LoginPayload): Promise<User> { ... }
export async function registerApi(payload: RegisterPayload): Promise<User> { ... }
export async function logoutApi(): Promise<void> { ... }
export async function refreshApi(): Promise<void> { ... }   // called silently
export async function getMeApi(): Promise<User> { ... }
```

All functions throw on non-2xx responses with the error message from `{ "error": "..." }` response body.

### Zustand Store (`src/store/useAuthStore.ts`)

```typescript
interface AuthStore {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}
```

Do **not** persist auth state to localStorage. Session is determined by the httpOnly cookie — on app load, always call `/api/auth/me` to restore session.

### Auth Hook (`src/hooks/useAuth.ts`)

```typescript
export function useAuth() {
  const { user, isLoading, setUser, setLoading, logout: clearStore } = useAuthStore();

  const login = async (payload: LoginPayload) => { ... }
  const register = async (payload: RegisterPayload) => { ... }
  const logout = async () => { ... }

  return { user, isLoading, isAuthenticated: !!user, login, register, logout };
}
```

### Session Initialization

In `src/app/layout.tsx`, add a **client component** `AuthProvider` that on mount calls `getMeApi()` to restore the session:

```typescript
'use client';
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    setLoading(true);
    getMeApi()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  return <>{children}</>;
}
```

### Token Refresh (Interceptor)

Create `src/lib/api/fetchWithAuth.ts` — a wrapper around `fetch` that handles 401:

```typescript
export async function fetchWithAuth(input: RequestInfo, init?: RequestInit): Promise<Response> {
  let response = await fetch(input, { ...init, credentials: 'include' });

  if (response.status === 401) {
    // Try to refresh
    const refreshed = await refreshApi().catch(() => null);
    if (refreshed !== null) {
      // Retry original request
      response = await fetch(input, { ...init, credentials: 'include' });
    } else {
      // Refresh failed → clear user state, redirect to /login
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
  }

  return response;
}
```

Replace raw `fetch` calls in existing API clients (`cards.ts` etc.) with `fetchWithAuth`.

### Forms

**LoginForm and RegisterForm** must:
- Use `react-hook-form` + `zodResolver` for validation
- Follow shadcn/ui form patterns (`<Form>`, `<FormField>`, `<FormItem>`, `<FormMessage>`)
- Show inline validation errors
- Show loading state on submit button (spinner icon from lucide-react)
- Show a toast (`sonner` or shadcn toast) on success/error

**Zod schemas:**
```typescript
const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const registerSchema = loginSchema.extend({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});
```

### Google OAuth Button (`GoogleButton.tsx`)

```typescript
export function GoogleButton() {
  return (
    <Button
      variant="outline"
      className="w-full gap-2"
      onClick={() => window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/google`}
    >
      <GoogleIcon className="h-4 w-4" />
      Continue with Google
    </Button>
  );
}
```

Use a simple inline SVG for the Google icon (don't add a new dependency).

### Route Protection

**Server-side** (middleware.ts at project root, Next.js Middleware):

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_ROUTES = ['/cards', '/decks', '/dictionary'];
const AUTH_ROUTES = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const hasAccessToken = request.cookies.has('access_token');
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_ROUTES.some(r => pathname.startsWith(r));
  const isAuthRoute = AUTH_ROUTES.some(r => pathname.startsWith(r));

  if (isProtected && !hasAccessToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isAuthRoute && hasAccessToken) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

**Note:** Next.js Middleware cannot verify JWT (no Node.js crypto in Edge runtime). The presence of the `access_token` cookie is enough for redirect logic — the actual validation happens on the API server.

### UI / UX

- Auth pages (`/login`, `/register`) use a **centered card layout** — consistent with the existing shadcn/ui + dark theme of the app
- No sidebar on auth pages (use a separate layout `src/app/(auth)/layout.tsx`)
- Show a divider `───── or ─────` between the credentials form and the Google button
- After successful login/register → redirect to `/` (or the page the user was trying to access via `?redirect=` query param)
- After logout → redirect to `/login`

---

## Implementation Order

1. **Migration** — create the migration file, run it
2. **Backend domain + repository** — `User` entity, `UserRepository` interface, `user.go` postgres implementation
3. **Backend service** — credentials auth (register + login + refresh + logout)
4. **Backend handlers + routing** — wire up all endpoints, add `AuthMiddleware`
5. **Backend Google OAuth** — add after credentials flow is working
6. **Frontend types + API client** — `auth.ts`, `fetchWithAuth.ts`
7. **Frontend Zustand store + hook** — `useAuthStore.ts`, `useAuth.ts`
8. **Frontend AuthProvider** — session restoration in layout
9. **Frontend forms** — `LoginForm`, `RegisterForm` with validation
10. **Frontend pages** — `/login`, `/register` pages with layout
11. **Frontend route protection** — `middleware.ts`
12. **Wire existing API calls** — replace `fetch` with `fetchWithAuth` in `cards.ts` and other API files

---

## Key Constraints

- **Do not break existing functionality.** The `user_id` columns added to `decks`/`cards` are nullable — existing data and existing endpoints must continue to work unchanged.
- **Do not change existing middleware** (`Logging`, `Recovery`, `CORS`, `ContentType`). Only add new `AuthMiddleware`.
- **Follow existing code patterns** — if existing handlers use a certain error response format, use the same format in auth handlers.
- **No new UI libraries** — use only what's already in the project (shadcn/ui, Tailwind, Framer Motion, lucide-react, Zod, react-hook-form).
- **Credentials: 'include'** on every fetch call — required for httpOnly cookies to work cross-origin between Next.js (port 3000) and Go (port 8080) in local dev.
- **CORS on backend** — the existing CORS middleware must allow credentials (`Access-Control-Allow-Credentials: true`) and specify the exact frontend origin, not `*`. Verify this is already the case; if not, fix it.
