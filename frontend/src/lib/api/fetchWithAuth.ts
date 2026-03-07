import { refreshApi } from './auth';
import { useAuthStore } from '@/store/useAuthStore';

export async function fetchWithAuth(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  let response = await fetch(input, { ...init, credentials: 'include' });

  if (response.status === 401) {
    try {
      await refreshApi();
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
