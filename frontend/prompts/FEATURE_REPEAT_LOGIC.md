# FEATURE: Improved Repeat Logic in Study Session

## Problem
Currently in `useStudySession.ts`, when a user swipes AGAIN, the card is placed
at the very end of the queue (`[...rest, current]`). For large decks (30+ cards)
this means the user won't see the failed card again for a long time, which hurts
retention.

## Solution
Instead of placing the failed card at the end, place it **N positions ahead**
in the queue, where N = 3 (or less if fewer cards remain).

## Changes Required

### File: `useStudySession.ts`

In the reducer, find the `AGAIN` case. Currently:
```ts
[...rest, current]
```

Replace with logic that inserts `current` N positions ahead instead of the end:

```ts
const N = 3;
const insertAt = Math.min(N, rest.length);
const newQueue = [
  ...rest.slice(0, insertAt),
  current,
  ...rest.slice(insertAt),
];
```

So the full AGAIN case queue update becomes `newQueue` instead of `[...rest, current]`.

## Behavior
- Failed card returns after 3 cards instead of going to the end
- If fewer than 3 cards remain in queue, card goes to the end (Math.min handles this)
- `againHistory`, `againCounts`, and all other existing logic stays unchanged
- No backend changes required
