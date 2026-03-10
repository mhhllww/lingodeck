# LingoDeck

AI-powered English learning platform with flashcards, dictionary, and translation.

## Features

- **AI Dictionary** — search English words and get transcription, definitions, examples, and synonyms powered by Groq LLM
- **Translation** — English ↔ Russian translation via DeepL API with history
- **Flashcards** — create, edit, and organize cards into decks
- **Study Mode** — spaced repetition with flip cards and progress tracking
- **Authentication** — email/password registration, Google OAuth, email verification, password reset
- **Text-to-Speech** — pronunciation for English words

## Tech Stack

| Layer    | Technology                                       |
|----------|--------------------------------------------------|
| Backend  | Go 1.23, PostgreSQL, JWT, Swagger                |
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| AI/APIs  | Groq (LLM dictionary), DeepL (translation)       |
| Email    | Resend                                           |
| CI/CD    | GitHub Actions                                   |

## Getting Started

### Prerequisites

- Go 1.23+
- Node.js 20+
- PostgreSQL
- API keys: [Groq](https://console.groq.com/), [DeepL](https://www.deepl.com/pro-api), [Resend](https://resend.com/) (optional for email)

### Backend

```bash
cd backend
cp .env.example .env   # fill in your credentials
make migrate-up        # apply database migrations
make run               # start the API server on :8080
```

### Frontend

```bash
cd frontend
npm ci
npm run dev            # start dev server on :3000
```

The frontend proxies `/api/*` requests to the backend at `localhost:8080`.

## Configuration

Backend environment variables (see `backend/.env.example`):

| Variable               | Description                          |
|------------------------|--------------------------------------|
| `PORT`                 | Server port (default: 8080)          |
| `DATABASE_URL`         | PostgreSQL connection string         |
| `GROQ_API_KEY`         | Groq API key for dictionary AI       |
| `DEEPL_API_KEY`        | DeepL API key for translation        |
| `JWT_SECRET`           | JWT signing secret (min 32 chars)    |
| `GOOGLE_CLIENT_ID`     | Google OAuth client ID               |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret           |
| `GOOGLE_REDIRECT_URL`  | Google OAuth redirect URL            |
| `RESEND_API_KEY`       | Resend API key for emails            |
| `EMAIL_FROM`           | Sender address for emails            |
| `APP_URL`              | Application URL for email links      |

## API Documentation

Swagger UI is available at `/swagger/` when the backend is running.

Regenerate docs:

```bash
cd backend
make swagger
```

## Project Structure

```
├── backend/
│   ├── cmd/api/          # Entry point
│   ├── internal/
│   │   ├── domain/       # Domain models
│   │   ├── handler/      # HTTP handlers
│   │   ├── service/      # Business logic
│   │   ├── repository/   # Database access
│   │   ├── server/       # Router and middleware
│   │   └── config/       # Configuration
│   └── migrations/       # SQL migrations
└── frontend/
    └── src/
        ├── app/          # Next.js pages
        ├── components/   # React components
        ├── hooks/        # Custom hooks
        ├── store/        # Zustand stores
        ├── lib/          # API clients and utilities
        └── types/        # TypeScript types
```
