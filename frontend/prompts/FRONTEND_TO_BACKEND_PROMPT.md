# Agent Prompt: LingoDeck Frontend — Generate Backend Sync Prompt

## Your Task

You are a frontend agent working on the **LingoDeck** codebase. Your goal is **not** to write code — your goal is to **analyze the frontend and produce a detailed prompt** for a backend agent so they can implement missing backend functionality and align it with the frontend.

---

## Context

LingoDeck is a vocabulary learning app. The frontend is built with:
- Next.js 14+ (App Router), TypeScript (strict), shadcn/ui, Tailwind CSS
- Zustand for state, React Query for data fetching
- MSW (Mock Service Worker) currently mocking all backend calls via `localStorage`

The backend has a Swagger spec (`doc.json`) with existing endpoints. The real backend is **not yet connected** — everything goes through MSW mocks. The goal is to replace MSW with real API calls with zero component changes.

---

## What You Must Do

### Step 1 — Analyze the frontend

Read the following files to understand what the frontend currently does and what it expects from the backend:

- `src/mocks/handlers.ts` — all mocked endpoints (shape of requests/responses)
- `src/mocks/data.ts` — seed data structure
- `src/lib/api/cards.ts` — cards API client
- `src/store/useCardStore.ts` — Zustand store (Card and Deck interfaces)
- `src/types/card.ts` — TypeScript types for Card, Deck, StudySession
- `src/hooks/useCards.ts` — CRUD hooks, what endpoints are called
- `src/hooks/useStudySession.ts` — session logic, what card fields are used
- `src/components/study/SessionResults.tsx` — what session result data is expected
- `src/app/decks/page.tsx` — what Deck fields are rendered
- `src/app/decks/[id]/page.tsx` — what single deck + cards response looks like

### Step 2 — Analyze the Swagger spec

The existing Swagger spec defines these endpoints and models:

**Endpoints:**
- `GET /api/decks` → array of `domain.Deck`
- `POST /api/decks` → create deck
- `GET /api/decks/{id}` → single deck with `card_count`
- `PUT /api/decks/{id}` → update deck
- `DELETE /api/decks/{id}` → delete deck
- `GET /api/decks/{deckId}/cards` → list cards in deck
- `POST /api/decks/{deckId}/cards` → add card to deck
- `PUT /api/cards/{id}` → update card
- `DELETE /api/cards/{id}` → delete card
- `GET /api/dictionary/search?q=` → search words
- `GET /api/dictionary/words/{id}` → get word by ID
- `POST /api/translate` → translate text
- `GET /api/translate/history` → translation history

**domain.Card fields:** `id`, `deck_id`, `front`, `back`, `example`, `difficulty`, `created_at`, `updated_at`

**domain.Deck fields:** `id`, `name`, `description`, `card_count`, `created_at`, `updated_at`

**domain.Word fields:** `id`, `word`, `transcription`, `part_of_speech`, `definitions[]`, `examples[]`, `created_at`

**domain.Translation fields:** `id`, `source_text`, `target_text`, `source_lang`, `target_lang`, `created_at`

### Step 3 — Identify all gaps

Compare what the frontend needs vs what the Swagger spec provides. Look for:

1. **Missing endpoints** — frontend calls an endpoint that doesn't exist in swagger
2. **Missing fields** — frontend uses a field that doesn't exist in the swagger model (e.g. frontend `VocabularyCard` has `word`, `translation`, `transcription`, `partOfSpeech`, `synonyms`, `antonyms`, `tags`, `deckId`, `timesCorrect`, `timesIncorrect`, `lastStudiedAt` — but `domain.Card` only has `front`, `back`, `example`, `difficulty`, `deck_id`)
3. **Type mismatches** — frontend uses `string` IDs, backend uses `integer` IDs
4. **Missing endpoints for study session** — there is no `/api/sessions` or study progress endpoint in swagger
5. **Tags/decks relationship** — frontend associates cards with decks via tags, swagger uses `deck_id` directly
6. **Naming conventions** — frontend uses camelCase, backend uses snake_case

### Step 4 — Produce the backend agent prompt

Write a complete, precise prompt for a **backend agent** (Go developer) that includes:

1. **Project context** — what LingoDeck is, what the backend stack appears to be (Go, based on swagger structure)

2. **Existing swagger as source of truth** — list all existing endpoints and models, tell the agent not to break them

3. **Field mapping** — explicit mapping between frontend TypeScript types and backend domain models:
   ```
   Frontend VocabularyCard     →  Backend domain.Card
   word (string)               →  front (string)
   translation (string)        →  back (string)
   transcription (string)      →  transcription (ADD THIS FIELD)
   partOfSpeech (string[])     →  part_of_speech (ADD THIS FIELD)
   synonyms (string[])         →  synonyms (ADD THIS FIELD)
   antonyms (string[])         →  antonyms (ADD THIS FIELD)
   tags (string[])             →  tags (ADD THIS FIELD)
   deckId (string)             →  deck_id (integer — NOTE TYPE MISMATCH)
   timesCorrect (number)       →  times_correct (ADD THIS FIELD)
   timesIncorrect (number)     →  times_incorrect (ADD THIS FIELD)
   lastStudiedAt (string)      →  last_studied_at (ADD THIS FIELD)
   ```
   Extend this mapping based on what you actually find in the frontend code.

4. **Missing endpoints to add** — for each gap found, specify:
   - HTTP method + path
   - Request body shape (with field names and types)
   - Response body shape
   - What frontend action triggers this call

5. **Study session persistence** — the frontend currently tracks `timesCorrect`, `timesIncorrect`, `lastStudiedAt` in Zustand only (ephemeral). The backend needs an endpoint to save session results. Propose the endpoint shape based on what `useStudySession.ts` and `SessionResults.tsx` produce.

6. **CORS** — remind the backend agent to enable CORS for `localhost:3000` (Next.js dev server)

7. **Migration note** — remind the backend agent to update the Swagger spec (`doc.json`) after all changes so the frontend agent can update MSW handlers accordingly

8. **What NOT to change** — list existing endpoints that are already aligned and should not be touched

---

## Output Format

Produce a single Markdown document titled:
`# Backend Agent Prompt: LingoDeck API — Frontend Sync`

The document must be self-contained — the backend agent will receive only this document and the `doc.json` swagger file. Do not assume they have access to the frontend codebase.

Save the output to: `BACKEND_AGENT_PROMPT.md` in the project root.
