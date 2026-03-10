# Fix: refresh token race condition in fetchWithAuth.ts

## Problem

`frontend/src/lib/api/fetchWithAuth.ts` has a race condition: when multiple requests
get 401 simultaneously, each one calls `refreshApi()` independently. The second refresh
call fails with 401 because the refresh token is already rotated, causing logout.

Observed in Network tab:
- `refresh` → 204 ✅
- `refresh` → 401 ❌ (second call with already-used refresh token)

## Fix

Add a module-level mutex: a single shared `refreshPromise`. If a refresh is already
in flight, all other 401 handlers wait for the same promise instead of starting a new one.

Replace the contents of `frontend/src/lib/api/fetchWithAuth.ts` with:

```ts
import { refreshApi } from './auth';
import { useAuthStore } from '@/store/useAuthStore';

let refreshPromise: Promise<void> | null = null;

function getRefreshPromise(): Promise<void> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = refreshApi()
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

export async function fetchWithAuth(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  let response = await fetch(input, { ...init, credentials: 'include' });

  if (response.status === 401) {
    try {
      await getRefreshPromise();
      response = await fetch(input, { ...init, credentials: 'include' });
    } catch {
      useAuthStore.getState().logout();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  }

  return response;
}
```

## What changed

- Added `refreshPromise` at module level (persists across calls)
- `getRefreshPromise()` returns existing promise if refresh is already running —
  all parallel 401s await the same promise, only one actual `refreshApi()` call is made
- `.finally()` clears the promise after completion (success or failure),
  so future refreshes work normally

## Do not change

- `credentials: 'include'` on all fetch calls — cookies must be sent
- logout + redirect logic on catch — behaviour on expired refresh token stays the same
- Any files in `frontend/src/lib/api/auth.ts` or `cards.ts` — no changes needed there
