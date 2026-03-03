# Backend Agent Prompt: LingoDeck API — Frontend Sync

## Project Context

**LingoDeck** is a vocabulary learning app (English words with translations). Users create decks, add cards to them, and study via swipe-based sessions.

- Backend: Go (inferred from swagger structure — `domain.*` models, `handler.*` types)
- Frontend: Next.js 14, TypeScript, Zustand, MSW mocks (localStorage), no auth
- The backend is **not yet connected** to the frontend. All frontend calls currently go to MSW mocks.
- Goal: make the real backend fully match what the frontend expects, so MSW can be replaced with real API calls **without changing any React components**.

**No authentication is required.** The app is single-user. Do not add JWT, sessions, or `owner_id` to any models.

---

## Existing Swagger — Do NOT Break These

The following endpoints and models already exist. Do not change their paths, HTTP methods, or response shapes (you may extend models with new fields).

### Existing endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/decks` | List all decks |
| `POST` | `/api/decks` | Create deck |
| `GET` | `/api/decks/{id}` | Get deck by ID (includes `card_count`) |
| `PUT` | `/api/decks/{id}` | Update deck |
| `DELETE` | `/api/decks/{id}` | Delete deck |
| `GET` | `/api/decks/{deckId}/cards` | List cards in a deck |
| `POST` | `/api/decks/{deckId}/cards` | Add card to deck |
| `PUT` | `/api/cards/{id}` | Update card |
| `DELETE` | `/api/cards/{id}` | Delete card |
| `GET` | `/api/dictionary/search?q=` | Search dictionary |
| `GET` | `/api/dictionary/words/{id}` | Get word by ID |
| `POST` | `/api/translate` | Translate text |
| `GET` | `/api/translate/history` | Translation history |

---

## Required Model Changes

### 1. `domain.Card` — extend with missing fields

Current fields: `id` (int), `deck_id` (int), `front` (string), `back` (string), `example` (string), `difficulty` (int), `created_at` (string), `updated_at` (string)

**Required changes:**

| Action | Field | Type | Notes |
|--------|-------|------|-------|
| RENAME | `example` → `examples` | `[]string` | Frontend expects array, not single string |
| ADD | `transcription` | `string` | IPA transcription, e.g. `/ɪˈfem.ər.əl/` |
| ADD | `part_of_speech` | `[]string` | Array, e.g. `["adjective"]` |
| ADD | `definitions` | `[]string` | Array of English definitions |
| ADD | `synonyms` | `[]string` | May be empty |
| ADD | `antonyms` | `[]string` | May be empty |
| ADD | `tags` | `[]string` | Used for filtering on frontend |
| ADD | `times_correct` | `int` | Cumulative correct answers, default 0 |
| ADD | `times_incorrect` | `int` | Cumulative incorrect answers, default 0 |
| ADD | `last_studied_at` | `string` | ISO 8601 datetime or empty string |

**Frontend ↔ Backend field mapping** (for the API layer):

```
Frontend (VocabularyCard)     Backend (domain.Card)
─────────────────────────     ─────────────────────
id            string      ↔   id               integer  ← NOTE: serialize as string in JSON
word          string      ↔   front            string
translation   string      ↔   back             string
transcription string      ↔   transcription    string   (ADD)
partOfSpeech  string[]    ↔   part_of_speech   []string (ADD)
definitions   string[]    ↔   definitions      []string (ADD)
examples      string[]    ↔   examples         []string (RENAME from example)
synonyms      string[]    ↔   synonyms         []string (ADD)
antonyms      string[]    ↔   antonyms         []string (ADD)
tags          string[]    ↔   tags             []string (ADD)
deckId        string      ↔   deck_id          integer  ← NOTE: serialize as string in JSON
timesCorrect  number      ↔   times_correct    int      (ADD)
timesIncorrect number     ↔   times_incorrect  int      (ADD)
lastStudiedAt string      ↔   last_studied_at  string   (ADD)
createdAt     string      ↔   created_at       string
```

> **CRITICAL — ID type:** The frontend uses `string` IDs everywhere (e.g. `"1"`, `"42"`). The backend uses `integer` IDs internally. **In all JSON responses, serialize `id` and `deck_id` as strings**, not integers. Use `json:"id,string"` tag in Go structs, or convert in the response serialization layer. This applies to ALL models (Card, Deck).

---

### 2. `domain.Deck` — extend with missing fields

Current fields: `id` (int), `name` (string), `description` (string), `card_count` (int), `created_at` (string), `updated_at` (string)

**Required changes:**

| Action | Field | Type | Notes |
|--------|-------|------|-------|
| ADD | `color` | `string` | Hex color string, e.g. `"#6366f1"` |
| ADD | `tags` | `[]string` | Deck tags for grouping, e.g. `["adjective"]` |

**Frontend ↔ Backend mapping:**

```
Frontend (Deck)         Backend (domain.Deck)
───────────────         ─────────────────────
id          string  ↔   id           integer  ← serialize as string
name        string  ↔   name         string
tags        string[] ↔  tags         []string (ADD)
color       string  ↔   color        string   (ADD)
createdAt   string  ↔   created_at   string
─ (unused) ─            description  string   (keep)
─ (unused) ─            card_count   int      (keep)
─ (unused) ─            updated_at   string   (keep)
```

---

## New Endpoints to Add

### 1. Flat cards endpoints (frontend calls these directly)

The frontend API layer (`/api/cards`) does **not** use the nested `/api/decks/{deckId}/cards` path. Add these flat endpoints:

#### `GET /api/cards`

List cards, optionally filtered by deck.

**Query params:**
- `deck_id` (string, optional) — filter by deck
- `q` (string, optional) — search in `front` and `back` fields (case-insensitive contains)

**Response `200`:**
```json
[
  {
    "id": "1",
    "deck_id": "2",
    "front": "ephemeral",
    "back": "кратковременный",
    "transcription": "/ɪˈfem.ər.əl/",
    "part_of_speech": ["adjective"],
    "definitions": ["Lasting for a very short time."],
    "examples": ["Fame in the internet age is ephemeral."],
    "synonyms": ["transient", "fleeting"],
    "antonyms": ["permanent"],
    "tags": ["adjective", "advanced"],
    "times_correct": 3,
    "times_incorrect": 1,
    "last_studied_at": "2024-01-15T10:00:00Z",
    "created_at": "2024-01-10T00:00:00Z"
  }
]
```

#### `GET /api/cards/{id}`

Get single card by ID.

**Response `200`:** same shape as above (single object)
**Response `404`:** `{"error": {"code": "not_found", "message": "card not found"}}`

#### `POST /api/cards`

Create a new card. The `deck_id` comes in the request body (not path).

**Request body:**
```json
{
  "deck_id": "2",
  "front": "ephemeral",
  "back": "кратковременный",
  "transcription": "/ɪˈfem.ər.əl/",
  "part_of_speech": ["adjective"],
  "definitions": ["Lasting for a very short time."],
  "examples": ["Fame in the internet age is ephemeral."],
  "synonyms": ["transient", "fleeting"],
  "antonyms": ["permanent"],
  "tags": ["adjective", "advanced"]
}
```

**Response `201`:** full card object (same shape as GET)

---

### 2. Study session results

When a study session ends, the frontend calls `bulkUpdateStudyStats` which increments `times_correct` / `times_incorrect` for each card and sets `last_studied_at`. Add a bulk endpoint for this.

#### `POST /api/study/results`

Save session results and update card stats.

**Request body:**
```json
{
  "deck_id": "2",
  "started_at": "2024-01-15T09:55:00Z",
  "card_results": [
    {
      "card_id": "1",
      "times_correct_delta": 1,
      "times_incorrect_delta": 0
    },
    {
      "card_id": "3",
      "times_correct_delta": 0,
      "times_incorrect_delta": 2
    }
  ]
}
```

**Behavior:**
- For each entry, increment the card's `times_correct` by `times_correct_delta` and `times_incorrect` by `times_incorrect_delta`
- Set `last_studied_at` = current server time for all affected cards
- Cards not in the list are not modified

**Response `204` No Content** on success.
**Response `400`** if `card_results` is empty or malformed.

---

## Existing Endpoints That Need Model Updates

These endpoints already exist but their response schemas must now include the new fields added to `domain.Card` and `domain.Deck`:

- `GET /api/decks` → now returns `color`, `tags` per deck
- `GET/PUT /api/decks/{id}` → now returns `color`, `tags`
- `POST /api/decks` → request body now accepts `color`, `tags`; response includes them
- `GET /api/decks/{deckId}/cards` → now returns full card with all new fields
- `POST /api/decks/{deckId}/cards` → request body now accepts all new card fields; response includes them
- `PUT /api/cards/{id}` → request body now accepts all new card fields (partial update); response includes them

---

## CORS

Enable CORS for the following origins:
- `http://localhost:3000` (Next.js dev server)
- `http://localhost:3001` (fallback)

Allowed methods: `GET, POST, PUT, DELETE, OPTIONS`
Allowed headers: `Content-Type, Accept`

---

## Swagger Spec Update

After implementing all changes, **update `doc.json`** with:
1. All new endpoints added above
2. All model field additions/changes in `domain.Card` and `domain.Deck`
3. New `domain.StudyResult` and `domain.CardResult` definitions for the study endpoint

The frontend agent will use the updated `doc.json` to update MSW handlers and the TypeScript API layer.

---

## Summary of What NOT to Change

| Endpoint | Reason |
|----------|--------|
| `GET/POST /api/decks` | Keep path; only extend model |
| `GET/PUT/DELETE /api/decks/{id}` | Keep path; only extend model |
| `GET/POST /api/decks/{deckId}/cards` | Keep — used as alternative; only extend model |
| `PUT/DELETE /api/cards/{id}` | Keep — already correct path |
| All `/api/dictionary/*` | Fully aligned, no changes |
| All `/api/translate*` | Fully aligned, no changes |
