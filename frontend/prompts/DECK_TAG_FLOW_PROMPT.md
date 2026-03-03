# Agent Prompt: LingoDeck — Deck & Tag Flow Improvement

## Context

You are improving an existing **LingoDeck** app — a personal vocabulary notebook built with:
- **Next.js 14+** (App Router), **TypeScript** (strict), **shadcn/ui** + **Tailwind CSS**
- **Zustand** for state, **React Query** for fetching, **Framer Motion** for animations
- Cards stored in **localStorage** via MSW mock layer

The current card save flow is:
> Search word → click "Save to Cards" → pick Auto Tag or User Tag → if User Tag: check if tag exists → choose from list OR add new → then choose tag → auto-generate part of speech → card created in deck

**Problem:** Too many steps for a frequent action. Users lose momentum. The flow has redundant branches.

---

## Current Data Model

```typescript
interface VocabularyCard {
  id: string;
  word: string;
  translation: string;
  transcription?: string;
  partOfSpeech?: string[];
  definitions?: string[];
  examples?: string[];
  synonyms?: string[];
  antonyms?: string[];
  createdAt: string;
  tags?: string[];
}
```

---

## What to Build

### 1. Extend Data Model — Add Decks

```typescript
interface Deck {
  id: string;
  name: string;
  tags: string[];          // tags associated with this deck
  color?: string;          // accent color for visual identity
  createdAt: string;
  cardCount: number;       // derived, not stored
}

// Update VocabularyCard:
interface VocabularyCard {
  // ... existing fields ...
  deckId?: string;         // which deck this card belongs to
  tags?: string[];         // keep for backward compat
}
```

Persist decks in Zustand store alongside cards. Add to `useCardStore.ts`.

---

### 2. Replace the Multi-Step Tag Flow with a Single Smart Component

Create `src/components/cards/DeckTagSelector.tsx` — a **single-step inline component** that replaces the entire current branching flow.

**Behavior:**
- Renders as a compact popover/dropdown triggered from the "Save to Cards" button
- Contains a **combobox** (searchable input) that:
  - Shows existing decks + their tags as options
  - If the user types something not in the list → shows "Create deck **{name}**" option at the bottom
  - Supports keyboard navigation (↑↓ to navigate, Enter to confirm, Escape to close)
- Below the combobox: **tag chips** from the selected deck appear as one-click quick-selects
- **Auto Tag suggestion**: if the word has a clear part of speech from the dictionary API, show it as a suggested tag chip with a ✨ icon — one click applies it
- A **"Save without deck"** link at the bottom for zero-friction fallback

**States:**
```
idle → open → (typing/browsing) → selected → saving → success
```

On success: popover closes, card appears in deck, show a **toast** with undo action (3s timeout).

---

### 3. Smart Defaults (Context-Aware Saving)

In `useCardStore.ts`, track `lastUsedDeckId`. When opening the DeckTagSelector:
- Pre-select the last used deck
- User can change it or confirm immediately with one click/Enter
- This means for repeat users: save flow becomes **2 clicks** (open popover → confirm)

---

### 4. Optimistic UI

In `useCards.ts` hook, implement optimistic updates:

```typescript
const saveCard = useMutation({
  mutationFn: createCard,
  onMutate: async (newCard) => {
    await queryClient.cancelQueries({ queryKey: ['cards'] });
    const previous = queryClient.getQueryData(['cards']);
    queryClient.setQueryData(['cards'], (old) => [...old, { ...newCard, id: 'temp-' + Date.now() }]);
    return { previous };
  },
  onError: (err, newCard, context) => {
    queryClient.setQueryData(['cards'], context.previous);
    toast.error('Failed to save card');
  },
  onSettled: () => queryClient.invalidateQueries({ queryKey: ['cards'] }),
});
```

Card appears instantly in the deck. No loading spinner blocking the user.

---

### 5. Batch Add Mode

Add a **"Keep adding"** toggle in the DeckTagSelector. When enabled:
- After saving, the search bar clears and refocuses automatically
- The selected deck persists between saves
- A small floating counter shows how many cards were added in this session: "Added 4 words to **Verbs** ✓"
- Toggle lives in the header area near the search bar: `[ ] Quick add mode`

Implement in `SearchBar.tsx` — add `batchMode` state, when active show subtle indicator.

---

### 6. Decks Page

Create `src/app/decks/page.tsx` — a page showing all decks as cards.

**Layout:**
- Each deck card shows: name, color accent, card count, top 3 tags as chips, last added date
- Click deck → navigates to `/decks/[id]` showing filtered cards view (reuse `CardGrid` with deckId filter)
- "New Deck" button → inline creation (no modal, just an editable card that appears in the grid)

Add "Decks" to the sidebar navigation in `Sidebar.tsx`.

---

### 7. Update "Save to Cards" Button UX

In `SearchResults.tsx`, replace the current simple button with:

```tsx
<SaveCardButton
  word={word}
  cardData={cardData}
  suggestedTags={partOfSpeech}  // from dictionary API response
/>
```

`SaveCardButton` renders:
- Primary button: **"Save to Cards"** (or **"Saved ✓"** if already saved — check by word match in store)
- On click: opens `DeckTagSelector` as a popover anchored to the button
- If already saved: button shows deck name it belongs to, click → navigate to that deck

---

## Files to Create / Modify

| Action | File |
|--------|------|
| Create | `src/components/cards/DeckTagSelector.tsx` |
| Create | `src/components/cards/SaveCardButton.tsx` |
| Create | `src/app/decks/page.tsx` |
| Create | `src/app/decks/[id]/page.tsx` |
| Modify | `src/store/useCardStore.ts` — add Deck CRUD, lastUsedDeckId |
| Modify | `src/hooks/useCards.ts` — add optimistic updates, batch mode state |
| Modify | `src/components/search/SearchResults.tsx` — replace save button |
| Modify | `src/components/layout/Sidebar.tsx` — add Decks nav item |
| Modify | `src/mocks/handlers.ts` — add deck CRUD endpoints |
| Modify | `src/types/card.ts` — add Deck interface, update VocabularyCard |

---

## Key Principles (unchanged from original)

- **Zero friction save** — target: 2 clicks for repeat users, 3 for new deck
- **Optimistic everything** — never block the user waiting for a save
- **Backend-agnostic** — all new deck endpoints go through MSW mock layer first
- **Type everything** — strict TypeScript, no `any`
- **Notion-like calm** — no popups stacking on popups, everything inline where possible
