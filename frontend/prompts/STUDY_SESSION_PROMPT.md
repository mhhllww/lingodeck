# Agent Prompt: LingoDeck — Study Session Feature

## Context

You are extending an existing **LingoDeck** app — a personal vocabulary notebook built with:
- **Next.js 14+** (App Router), **TypeScript** (strict), **shadcn/ui** + **Tailwind CSS**
- **Zustand** for state, **React Query** for fetching, **Framer Motion** for animations
- Cards stored in **localStorage** via MSW mock layer

The app already has:
- Vocabulary cards with flip animation (`FlipCard.tsx`)
- Decks system (groups of cards by tag)
- Cards CRUD via `useCardStore.ts`

You are adding a **Study Session** — an interactive mode where the user reviews cards from a deck one by one, marking each as "Again" or "Got it".

---

## Data Model Extensions

Add session-related fields to `VocabularyCard`:

```typescript
interface VocabularyCard {
  // ... existing fields ...
  lastStudiedAt?: string;       // ISO date of last review
  timesCorrect?: number;        // total "Got it" count
  timesIncorrect?: number;      // total "Again" count
}

interface StudySession {
  deckId: string;
  startedAt: string;
  cards: SessionCard[];
}

interface SessionCard {
  cardId: string;
  status: 'pending' | 'got_it' | 'again';
}
```

Persist session state in Zustand (not localStorage — session is ephemeral, lost on refresh is fine).

---

## Pages to Create

### `/decks/[id]/study` — Study Session Page

This is the main new page. It has 3 internal views controlled by local state (no routing between them):

```
'start' | 'studying' | 'results'
```

---

## View 1: Session Start Screen

**Route:** `/decks/[id]/study`
**Initial state:** `view = 'start'`

**Layout:**
- Centered card on a dimmed/blurred background (rest of app is visible but inactive)
- Deck name as heading
- Subtitle: "X cards to review"
- Two buttons: **[Start]** (primary) and **[Cancel]** (ghost, navigates back to `/decks/[id]`)

**On [Start]:** shuffle the deck cards, initialize `StudySession`, set `view = 'studying'`

---

## View 2: Study Card Screen

**State:** `view = 'studying'`

### Layout (top to bottom):

```
[← Exit]                          3 / 12
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

        [ CARD ]

[Show translation] (centered below card)
```

**Progress bar:**
- Top of screen, full width
- Shows `gotIt.length / totalCards` fill
- Label: `{current} / {total}` right-aligned

**Exit button:**
- Top-left, ghost/subtle
- On click: show inline confirmation "Exit session? Progress will be lost" with [Exit] / [Continue] — do NOT use a modal, render inline below the button

**Card — Front side:**
- Word (large, prominent)
- Transcription (IPA, muted)
- 🔊 icon for TTS pronunciation
- Subtle hint text: "Do you know this word?"

**[Show translation] button:**
- Centered below card
- On click: flip card (Framer Motion rotateY, reuse existing FlipCard animation)
- Button disappears after flip

**Card — Back side (after flip):**
- Translation (large)
- Part of speech tag
- Top 1-2 definitions (muted, smaller)
- One example sentence (italic)
- Two action buttons at bottom:
  - **[Again]** — outlined/red-tinted
  - **[Got it ✓]** — filled/green-tinted

**[Again] behavior:**
- Card animates out to the right with slight rotation (Framer Motion)
- Card is pushed to the end of the queue
- Next card slides in from the left
- Card flips back to front automatically

**[Got it] behavior:**
- Card animates out upward with fade
- Card is removed from queue
- Next card slides in from the left
- Progress bar increments

**When queue is empty:** set `view = 'results'`

---

## View 3: Results Screen

**State:** `view = 'results'`

**Layout:**
```
🎉  Session Complete

Got it    8     Again    4
[████████░░░░░░]  67%

Words to review:
  • abandon   • melancholy   • ephemeral   • scrutiny

[Study Again]        [Back to Deck]
```

**Details:**
- "Got it" count in green, "Again" count in red/orange
- Progress bar showing ratio
- "Words to review" — list of failed words as **clickable chips**
  - Click opens that card's detail view in a side drawer (or navigates to `/cards?word=...`)
- **[Study Again]** — restarts session with only the "Again" cards
- **[Back to Deck]** — navigates to `/decks/[id]`

**On session complete:** update `lastStudiedAt`, `timesCorrect`, `timesIncorrect` for each card in Zustand store.

---

## Animations (Framer Motion)

| Transition | Animation |
|-----------|-----------|
| Start → Studying | Fade in + scale up (0.95 → 1) |
| Card flip | rotateY 0→180deg, 0.4s ease |
| Again (card exit) | x: 120, rotate: 8deg, opacity: 0, 0.3s |
| Got it (card exit) | y: -80, opacity: 0, 0.25s |
| Next card enter | x: -120 → 0, opacity: 0 → 1, 0.3s |
| Studying → Results | Staggered fade-in of result stats |

Use `AnimatePresence` for card queue transitions.

---

## Decks Page Update

In `src/app/decks/page.tsx`, add to each deck card:
- **[Study]** button — navigates to `/decks/[id]/study`
- Last studied date: "Last studied 2 days ago" (muted, small)
- If never studied: "Not studied yet"

---

## Files to Create / Modify

| Action | File |
|--------|------|
| Create | `src/app/decks/[id]/study/page.tsx` |
| Create | `src/components/study/SessionStart.tsx` |
| Create | `src/components/study/StudyCard.tsx` |
| Create | `src/components/study/SessionResults.tsx` |
| Create | `src/components/study/ProgressBar.tsx` |
| Create | `src/hooks/useStudySession.ts` |
| Modify | `src/store/useCardStore.ts` — add timesCorrect, timesIncorrect, lastStudiedAt |
| Modify | `src/app/decks/page.tsx` — add Study button, last studied info |
| Modify | `src/types/card.ts` — add StudySession, SessionCard interfaces |

---

## Key Principles

- **No modals** — confirmations render inline, results are a view state not a popup
- **Keyboard-friendly** — Space or Enter = "Show translation", G = "Got it", A = "Again"
- **Framer Motion for all transitions** — reuse existing FlipCard animation logic
- **Ephemeral session state** — lives in Zustand only, no persistence needed
- **Type everything** — strict TypeScript, no `any`
