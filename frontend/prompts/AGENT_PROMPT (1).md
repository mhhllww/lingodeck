# Agent Prompt: LingoDeck — Personal Vocabulary Notebook MVP

## Context

You are building a frontend MVP for **LingoDeck** — a personal vocabulary notebook web app. This is NOT a language-learning app like Duolingo. Think of it as a **Notion-like smart notebook for self-education** with a built-in translator and word explorer.

**Core user story:**
> I hear or see a new English word. I open the app, type the word in one place, instantly get the translation, synonyms, explanations, examples — and it all saves into a neat flip-card that I can review later. No jumping between Google Translate, dictionary sites, and note apps.

The flow is: **Search → Explore → Save → Review.**

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | **Next.js 14+** (App Router) |
| Language | **TypeScript** (strict mode) |
| UI Library | **shadcn/ui** + **Tailwind CSS** |
| State Management | Agent's choice (recommend **Zustand** for simplicity) |
| Data Fetching / Caching | **React Query (TanStack Query)** with caching enabled |
| Translation API | Any free/freemium API (recommend **MyMemory API** or **LibreTranslate** — no API key needed for basic usage) |
| Dictionary Data | **Free Dictionary API** (`https://api.dictionaryapi.dev/api/v2/entries/en/<word>`) |
| Text-to-Speech | **Web Speech API** (`window.speechSynthesis`) — no external service needed |
| Backend | **Not ready yet** — Swagger spec exists but backend is not deployed. Use **MSW (Mock Service Worker)** for all backend API calls |
| Database | PostgreSQL (planned) — for now all data persists in **localStorage** via mock layer |
| Testing | **Vitest** + **React Testing Library** for unit tests; **Playwright** for e2e |
| Animations | **Framer Motion** for flip cards and page transitions |
| Language | Interface is **English only** |

---

## Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout (dark theme provider, fonts, global styles)
│   ├── page.tsx                  # Main page — unified search/explore view
│   ├── cards/
│   │   └── page.tsx              # Cards collection page
│   └── globals.css
├── components/
│   ├── ui/                       # shadcn/ui components
│   ├── search/
│   │   ├── SearchBar.tsx         # Main search input with auto-detect language
│   │   └── SearchResults.tsx     # Combined translation + dictionary results
│   ├── translator/
│   │   ├── TranslationCard.tsx   # Translation result display
│   │   └── LanguageSelector.tsx  # Source/target language picker
│   ├── dictionary/
│   │   ├── WordDetails.tsx       # Full word info: phonetics, definitions, examples
│   │   ├── SynonymsBlock.tsx     # Synonyms display
│   │   ├── AntonymsBlock.tsx     # Antonyms display
│   │   └── PartOfSpeech.tsx      # Grouped by part of speech
│   ├── cards/
│   │   ├── FlipCard.tsx          # Individual card with flip animation
│   │   ├── CardGrid.tsx          # Grid/list of saved cards
│   │   ├── CreateCardModal.tsx   # Manual card creation
│   │   └── CardFilters.tsx       # Search and filter saved cards
│   └── layout/
│       ├── Sidebar.tsx           # Navigation sidebar
│       ├── Header.tsx            # Top bar
│       └── ThemeToggle.tsx       # Dark/light theme switch
├── hooks/
│   ├── useTranslation.ts        # Translation API hook
│   ├── useDictionary.ts         # Dictionary API hook
│   ├── useCards.ts              # CRUD operations for cards
│   ├── useSpeech.ts             # Text-to-speech hook
│   └── useDebounce.ts           # Input debounce
├── lib/
│   ├── api/
│   │   ├── translator.ts        # Translation API client
│   │   ├── dictionary.ts        # Dictionary API client
│   │   └── cards.ts             # Cards API client (hits mock backend)
│   ├── utils.ts                 # Utility functions
│   └── constants.ts             # App constants, supported languages
├── store/
│   └── useCardStore.ts          # Zustand store for cards (persisted to localStorage)
├── mocks/
│   ├── handlers.ts              # MSW request handlers matching Swagger spec
│   ├── browser.ts               # MSW browser worker setup
│   └── data.ts                  # Seed data for mocks
├── types/
│   ├── translation.ts           # Translation-related types
│   ├── dictionary.ts            # Dictionary API response types
│   └── card.ts                  # Card entity types
└── __tests__/
    ├── components/              # Component unit tests
    ├── hooks/                   # Hook tests
    └── e2e/                     # Playwright e2e tests
```

---

## Features Specification

### 1. Unified Search (Main Page)

The main page is a single search bar — the entry point for everything.

**Behavior:**
- User types a word or phrase
- The app **auto-detects** the input language:
  - If the input is in Russian → translate to English, then fetch dictionary data for the English word
  - If the input is in English → translate to Russian, and fetch dictionary data directly
- Results appear below the search bar in a single, scrollable view
- Debounce input by 400ms before firing API calls
- Show skeleton loaders during fetch

**Search results layout (top to bottom):**
1. **Translation block** — source word → translated word, with a 🔊 speaker icon to pronounce the English word via Web Speech API
2. **Dictionary block** — only appears for English words:
   - Phonetic transcription (IPA) with audio if available from API
   - Definitions grouped by part of speech (noun, verb, adjective...)
   - Example sentences (italic, indented)
   - Synonyms (as clickable chips — clicking searches that word)
   - Antonyms (as clickable chips)
3. **"Save to Cards" button** — one click saves the word with all fetched data into a flip card

**Edge cases:**
- Word not found in dictionary → show only translation
- No internet → show error state with retry button
- Empty input → show a subtle placeholder hint: "Type any word to explore..."

### 2. Translator

Integrated into the search flow, but also accessible as a focused view.

**Requirements:**
- Auto-detect source language (at minimum: English ↔ Russian)
- Language pair selector (swap button)
- TTS (text-to-speech) for the English result via `window.speechSynthesis`
- Translation result is copyable (click-to-copy with toast notification)
- API: Use a free translation API. Recommended: **MyMemory API** (`https://api.mymemory.translated.net/get?q=...&langpair=...`) — no key needed for <1000 words/day

### 3. Dictionary

Shows rich word data fetched from the **Free Dictionary API**.

**Card content:**
- Word + phonetic transcription (IPA)
- Audio pronunciation (if the API returns an audio URL)
- Part of speech tags
- All definitions with example sentences
- Synonyms list (clickable → triggers new search)
- Antonyms list (clickable → triggers new search)

**Design:** Notion-like clean blocks. Each part of speech is a collapsible section. No clutter.

### 4. Cards (Flip Cards Collection)

Saved vocabulary cards with flip animation.

**Card structure (data model):**
```typescript
interface VocabularyCard {
  id: string;
  word: string;                    // English word
  translation: string;             // Russian translation
  transcription?: string;          // IPA phonetic
  partOfSpeech?: string[];         // ["noun", "verb"]
  definitions?: string[];          // Top 2-3 definitions
  examples?: string[];             // Top 1-2 examples
  synonyms?: string[];             // Up to 5
  antonyms?: string[];             // Up to 5
  createdAt: string;               // ISO date
  tags?: string[];                 // User-defined tags
}
```

**Flip card UX:**
- **Front side:** word + transcription + 🔊 icon
- **Back side:** translation, definitions, examples, synonyms
- Click/tap to flip with **Framer Motion 3D flip animation** (rotateY)
- Cards displayed in a responsive grid (1 col mobile, 2 cols tablet, 3-4 cols desktop)

**Card management:**
- Delete card (with confirmation)
- Edit card (inline editing or modal)
- Search/filter cards by text
- Filter by tags
- Sort by: date added (newest/oldest), alphabetical
- Manual card creation (for words/phrases not from search)

### 5. TTS (Text-to-Speech)

- Use `window.speechSynthesis` API
- Pronounce English words on demand (speaker icon click)
- Select voice: prefer "en-US" or "en-GB" voice if available
- Graceful fallback if speechSynthesis is not supported

---

## UI / UX Requirements

### Design System
- **Style:** Notion-like — clean, spacious, typography-first
- **Theme:** Dark theme by default, with light theme toggle
- **Colors (dark theme):**
  - Background: `hsl(0, 0%, 7%)` (near-black)
  - Surface: `hsl(0, 0%, 11%)`
  - Border: `hsl(0, 0%, 18%)`
  - Text primary: `hsl(0, 0%, 93%)`
  - Text secondary: `hsl(0, 0%, 55%)`
  - Accent: a calm blue or violet (your choice)
- **Typography:** Inter or system font stack, clean hierarchy
- **Spacing:** Generous whitespace, 8px grid
- **Radius:** Soft rounded corners (8-12px)
- **Components:** shadcn/ui as the base, customize theme tokens

### Animations (Framer Motion)
- Page transitions: subtle fade + slide
- Card flip: 3D rotateY (0.4s ease)
- Search results: staggered fade-in
- Button/chip interactions: scale on hover
- Toast notifications: slide in from bottom-right
- Skeleton loaders for all async content

### Responsive Design
- Mobile-first approach
- Breakpoints: 640px (sm), 768px (md), 1024px (lg), 1280px (xl)
- Sidebar collapses to bottom nav on mobile
- Cards grid adapts: 1 → 2 → 3 → 4 columns

---

## Mock Backend (MSW)

Since the backend is not ready, set up **MSW (Mock Service Worker)** to intercept API calls.

**Mock endpoints (design based on typical CRUD for cards):**

```
GET    /api/cards              → list all cards (with search/filter query params)
GET    /api/cards/:id          → get single card
POST   /api/cards              → create card
PUT    /api/cards/:id          → update card
DELETE /api/cards/:id          → delete card
```

**MSW setup:**
- Use `msw/browser` for client-side interception
- Persist mock data in `localStorage` so cards survive page reload
- Seed with 5-10 example cards on first load
- Simulate network delay (200-500ms) for realistic UX

When the real backend is ready, we simply remove the MSW layer and point the API client to the real URL — **zero component changes needed**.

---

## Caching Strategy (React Query)

```typescript
// Translation results: cache for 10 minutes
useQuery({ queryKey: ['translation', word, langPair], staleTime: 10 * 60 * 1000 })

// Dictionary results: cache for 1 hour (word data rarely changes)
useQuery({ queryKey: ['dictionary', word], staleTime: 60 * 60 * 1000 })

// Cards list: always fresh, invalidate on mutation
useQuery({ queryKey: ['cards'], staleTime: 0 })
```

---

## Testing Requirements

### Unit Tests (Vitest + React Testing Library)
- SearchBar: renders, debounces input, calls hooks correctly
- FlipCard: renders front/back, flips on click
- TranslationCard: displays translation, copy button works
- WordDetails: renders all sections, handles missing data gracefully
- useTranslation hook: calls API, returns loading/error/data states
- useDictionary hook: same
- useCards hook: CRUD operations work correctly

### E2E Tests (Playwright)
- Full search flow: type word → see translation + dictionary → save to cards
- Cards page: view saved cards, flip a card, delete a card
- Theme toggle works
- Responsive layout on mobile viewport

---

## Non-Functional Requirements

- **Performance:** Lighthouse score > 90 on all metrics
- **Accessibility:** Proper ARIA labels, keyboard navigation, focus management
- **SEO:** Basic meta tags, semantic HTML (this is an SPA-like app, so SEO is secondary)
- **Error handling:** Every API call has loading, success, and error states with user-friendly messages
- **Code quality:** ESLint + Prettier configured, no `any` types, strict TypeScript

---

## Development Phases

### Phase 1: Foundation (Start here)
1. Next.js project setup with TypeScript, Tailwind, shadcn/ui
2. Dark/light theme setup with next-themes
3. Layout: sidebar + header + main content area
4. Routing: `/` (search), `/cards` (collection)

### Phase 2: Search + Translation
1. SearchBar component with debounce
2. Translation API integration (MyMemory)
3. Language auto-detection
4. TranslationCard with TTS
5. React Query setup with caching

### Phase 3: Dictionary
1. Free Dictionary API integration
2. WordDetails component (all sections)
3. Clickable synonym/antonym chips
4. Skeleton loaders

### Phase 4: Cards
1. Zustand store with localStorage persistence
2. "Save to Cards" flow from search results
3. FlipCard component with Framer Motion
4. CardGrid with responsive layout
5. Card CRUD: create, edit, delete
6. Filters, search, sort, tags

### Phase 5: MSW + Polish
1. MSW setup for backend API mocking
2. Seed data
3. Error states and empty states
4. Animations polish
5. Responsive fine-tuning

### Phase 6: Testing
1. Vitest + RTL unit tests
2. Playwright e2e tests
3. Lighthouse audit + fixes

---

## Key Principles

1. **One input, full context** — the user types once and gets everything about the word
2. **Zero friction save** — one click to save a word with all its data to a card
3. **Notion-like calm** — no gamification, no streaks, no noise. Just a clean, beautiful notebook
4. **Backend-agnostic** — MSW mocks today, real API tomorrow, zero UI changes
5. **Type everything** — strict TypeScript, no `any`, explicit interfaces for all API responses
