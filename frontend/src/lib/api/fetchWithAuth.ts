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
