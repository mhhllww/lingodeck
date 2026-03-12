'use client';

import { useAuthStore } from '@/store/useAuthStore';
import { loginApi, registerApi, logoutApi } from '@/lib/api/auth';
import { useQueryClient } from '@tanstack/react-query';
import type { LoginPayload, RegisterPayload } from '@/types/auth';

export function useAuth() {
  const { user, isLoading, setUser, logout: clearAuthStore } = useAuthStore();
  const queryClient = useQueryClient();

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
    queryClient.clear();
    clearAuthStore();
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
