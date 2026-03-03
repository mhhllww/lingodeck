# Agent Prompt: LingoDeck — Swipe UX Fixes

## Context

You are fixing swipe gesture behavior on the study card in `src/components/study/StudyCard.tsx`. The card uses Framer Motion `drag="x"`.

Do NOT rewrite the component from scratch — apply targeted fixes only.

---

## Fixes

### 1. Card follows the cursor precisely (no lag)

Currently the card feels heavy and lags behind the cursor.

**Fix:** Remove any spring physics from the drag motion value. Use `dragMomentum={false}` and `dragElastic={0}` so the card follows the pointer 1:1:

```tsx
<motion.div
  drag="x"
  dragMomentum={false}
  dragElastic={0}
  dragConstraints={{ left: 0, right: 0 }}
  ...
>
```

---

### 2. Card tilts during swipe (arc movement feel)

As the card is dragged horizontally, it should rotate slightly — as if sliding along a curve.

**Fix:** Derive `rotate` from the drag `x` motion value using `useTransform`:

```tsx
const x = useMotionValue(0);
const rotate = useTransform(x, [-200, 0, 200], [-18, 0, 18]);

<motion.div style={{ x, rotate }} drag="x" ...>
```

The card tilts right when dragged right, tilts left when dragged left. Max ~18deg at full drag distance.

---

### 3. Green glow behind card on swipe right

As the user drags right, a **green glow/shadow** fades in around the card — only in the area immediately behind it, not fullscreen.

**Implementation:** use `boxShadow` driven by `useTransform` on `x`:

```tsx
const greenShadow = useTransform(
  x,
  [0, SWIPE_THRESHOLD],
  ['0px 0px 0px 0px rgba(34,197,94,0)', '0px 0px 60px 30px rgba(34,197,94,0.5)']
);
const redShadow = useTransform(
  x,
  [-SWIPE_THRESHOLD, 0],
  ['0px 0px 60px 30px rgba(239,68,68,0.5)', '0px 0px 0px 0px rgba(239,68,68,0)']
);

// Combine: when x > 0 show green, when x < 0 show red
// Apply to the card wrapper itself:
<motion.div
  style={{
    x,
    rotate,
    boxShadow: useTransform(x, (v) =>
      v >= 0
        ? `0px 0px ${v * 0.5}px ${v * 0.25}px rgba(34,197,94,${Math.min(v / SWIPE_THRESHOLD, 1) * 0.6})`
        : `0px 0px ${Math.abs(v) * 0.5}px ${Math.abs(v) * 0.25}px rgba(239,68,68,${Math.min(Math.abs(v) / SWIPE_THRESHOLD, 1) * 0.6})`
    )
  }}
  drag="x"
  ...
>
```

Glow grows with drag distance and disappears on snap back. No background overlays, no extra elements — the card itself glows.

---

### 4. Red glow behind card on swipe left

Already covered by the `boxShadow` logic in fix 3 — negative `x` values produce red glow automatically.

---

### 5. Card flies out in the direction of swipe

On `onDragEnd`, if the threshold is exceeded, the card should **animate out** in the swipe direction before triggering the action — not just disappear.

```tsx
const controls = useAnimationControls();

const handleDragEnd = async (_, info) => {
  if (info.offset.x > SWIPE_THRESHOLD) {
    await controls.start({ x: 600, opacity: 0, transition: { duration: 0.3 } });
    handleGotIt();
  } else if (info.offset.x < -SWIPE_THRESHOLD) {
    await controls.start({ x: -600, opacity: 0, transition: { duration: 0.3 } });
    handleAgain();
  } else {
    // snap back
    controls.start({ x: 0, rotate: 0, transition: { type: 'spring', stiffness: 300, damping: 20 } });
  }
};

<motion.div
  animate={controls}
  style={{ x, rotate }}
  drag="x"
  dragMomentum={false}
  dragElastic={0}
  dragConstraints={{ left: 0, right: 0 }}
  onDragEnd={handleDragEnd}
>
```

**Important:** after the fly-out animation completes and the action is triggered, reset `x` to `0` and re-enable drag for the next card.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/study/StudyCard.tsx` | All 5 fixes above |
