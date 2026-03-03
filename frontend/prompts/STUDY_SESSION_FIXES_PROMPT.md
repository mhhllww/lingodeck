# Agent Prompt: LingoDeck — Study Session Fixes

## Context

You are fixing and improving the existing **Study Session** feature in LingoDeck. The session page is at `/decks/[id]/study` and uses Framer Motion for animations.

Do NOT rewrite the feature from scratch — apply targeted fixes only.

---

## Fixes

### 1. Remove duplicate progress counter

There is currently both a progress bar and a `{current} / {total}` text label showing the same info.

**Fix:** Remove the `{current} / {total}` text label. Keep only the progress bar. No duplicate display.

---

### 2. Fix progress bar during session

The progress bar should reflect **how many unique cards have been marked "Got it"** out of the **total unique cards in the deck**.

```
fill = gotItCards.length / totalUniqueCards
```

- "Again" cards do NOT move the bar forward
- Re-seeing a card that was previously marked "Again" does NOT increment the bar
- Bar only advances when a new unique card gets "Got it"

---

### 3. Remove [Show translation] button

Delete the `[Show translation]` button entirely from `StudyCard.tsx`. Do not replace it with anything.

---

### 4. Flip card on click — toggleable, but not on TTS icon click

The card must be **freely flippable in both directions** on every click — front→back and back→front, unlimited times. There is no "locked" state after the first flip.

```tsx
const [isFlipped, setIsFlipped] = useState(false);
const handleFlip = () => setIsFlipped(prev => !prev);
```

**Exception:** clicking the 🔊 TTS icon must trigger pronunciation only — it must NOT flip the card.

```tsx
// On the 🔊 button, stop propagation:
<button
  onClick={(e) => {
    e.stopPropagation();
    speak(word);
  }}
>
  🔊
</button>

// On the card wrapper:
<div onClick={handleFlip}>
  ...card content...
</div>
```

**Important:** clicking [Again] or [Got it] buttons on the back side must also stop propagation so they don't accidentally re-flip the card:
```tsx
<button onClick={(e) => { e.stopPropagation(); handleAgain(); }}>Again</button>
<button onClick={(e) => { e.stopPropagation(); handleGotIt(); }}>Got it ✓</button>
```

---

### 5. Swipe right = "Got it" (green indicator)

Add swipe gesture support using Framer Motion `drag="x"` on the card.

**Threshold:** action triggers **only on `onDragEnd`** when the final offset exceeds `120px`. Do NOT trigger during drag — only after the user releases.

```tsx
const SWIPE_THRESHOLD = 120;

<motion.div
  drag="x"
  dragConstraints={{ left: 0, right: 0 }}
  dragElastic={0.2}
  onDragEnd={(_, info) => {
    if (info.offset.x > SWIPE_THRESHOLD) {
      handleGotIt();
    } else {
      // snap back — Framer Motion handles this via dragConstraints + dragElastic
    }
  }}
>
```

**Visual indicator during drag:**
- Use `useMotionValue` + `useTransform` to derive opacity from drag offset
- Green `✓ Got it` badge on the right side, visible only when dragging right:

```tsx
const x = useMotionValue(0);
const rightOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1]);
const leftOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0]);

// Pass x to the draggable motion.div:
<motion.div drag="x" style={{ x }} ...>

// Right indicator:
<motion.div style={{ opacity: rightOpacity }} className="absolute right-4 ...">
  ✓ Got it
</motion.div>
```

Indicators fade in **gradually** as drag distance increases — they do NOT appear at rest position.

---

### 6. Swipe left = "Again" (red indicator)

Same pattern as fix 6, opposite direction.

```tsx
onDragEnd={(_, info) => {
  if (info.offset.x < -SWIPE_THRESHOLD) {
    handleAgain();
  }
  // else: snap back automatically
}}
```

Red `✗ Again` badge on the left side using `leftOpacity` from `useTransform` above.

**Note:** Keep the [Again] and [Got it] buttons on the back side as well — swipe is an additional interaction, not a replacement.

**Drag should only be active on the back side of the card** (after flip). On the front side set `drag={false}` to avoid accidental swipes before seeing the translation.

---

### 7. Fix Results screen progress bar

The results progress bar currently shows `gotIt / totalUniqueCards` which can show 100% even when there were mistakes.

**Fix:** The bar represents the **ratio of correct answers out of total answers given**:

```
fill = gotItCount / (gotItCount + againCount)
label = "{gotItCount} correct out of {gotItCount + againCount} total answers"
```

- If a card was seen 3 times (Again, Again, Got it) → counts as 1 gotIt + 2 again = 33% for that card
- This gives an honest accuracy percentage, not a completion percentage

Update the results screen copy accordingly:
- Old: "Got it 8 / Again 4"  
- New: "8 correct · 4 retries · 67% accuracy"

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useStudySession.ts` | Fix queue logic (fix 1), fix progress bar calculation (fix 3) |
| `src/components/study/StudyCard.tsx` | Remove show translation button (fix 4), add click-to-flip with TTS exception (fix 5), add swipe gestures with indicators (fix 6, 7) |
| `src/components/study/ProgressBar.tsx` | Remove duplicate counter (fix 2), fix fill calculation (fix 3) |
| `src/components/study/SessionResults.tsx` | Fix results progress bar and copy (fix 8) |
