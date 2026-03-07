import type { User, LoginPayload, RegisterPayload } from '@/types/auth';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.message ?? body?.error ?? 'Request failed');
  }
  return res.json();
}

export async function loginApi(payload: LoginPayload): Promise<User> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    credentials: 'include',
  });
  const data = await handleResponse<{ user: User }>(res);
  return data.user;
}

export async function registerApi(payload: RegisterPayload): Promise<void> {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    credentials: 'include',
  });
  await handleResponse<{ message: string }>(res);
}

export async function verifyEmailApi(token: string): Promise<User> {
  const res = await fetch('/api/auth/verify-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
    credentials: 'include',
  });
  const data = await handleResponse<{ user: User }>(res);
  return data.user;
}

export async function forgotPasswordApi(email: string): Promise<void> {
  const res = await fetch('/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
    credentials: 'include',
  });
  await handleResponse<{ message: string }>(res);
}

export async function resetPasswordApi(token: string, password: string): Promise<void> {
  const res = await fetch('/api/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, password }),
    credentials: 'include',
  });
  await handleResponse<{ message: string }>(res);
}

export async function resendVerificationApi(email: string): Promise<void> {
  const res = await fetch('/api/auth/resend-verification', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
    credentials: 'include',
  });
  await handleResponse<{ message: string }>(res);
}

export async function logoutApi(): Promise<void> {
  await fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'include',
  });
}

export async function refreshApi(): Promise<void> {
  const res = await fetch('/api/auth/refresh', {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Refresh failed');
}

export async function getMeApi(): Promise<User> {
  const res = await fetch('/api/auth/me', {
    credentials: 'include',
  });
  const data = await handleResponse<{ user: User }>(res);
  return data.user;
}
