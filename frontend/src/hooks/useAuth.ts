'use client';

import { useAuthStore } from '@/store/useAuthStore';
import { loginApi, registerApi, logoutApi } from '@/lib/api/auth';
import type { LoginPayload, RegisterPayload } from '@/types/auth';

export function useAuth() {
  const { user, isLoading, setUser, logout: clearStore } = useAuthStore();

  const login = async (payload: LoginPayload) => {
    const user = await loginApi(payload);
    setUser(user);
    return user;
  };

  const register = async (payload: RegisterPayload) => {
    await registerApi(payload);
  };

  const logout = async () => {
    await logoutApi();
    clearStore();
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
  };
}
