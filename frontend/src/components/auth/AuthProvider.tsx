'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { getMeApi, refreshApi } from '@/lib/api/auth';

const PROTECTED_PATHS = ['/', '/cards', '/decks', '/dictionary'];
const AUTH_PATHS = ['/login', '/register'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setLoading(true);
    getMeApi()
      .then(setUser)
      .catch(async () => {
        // Access token missing or expired — try silent refresh
        try {
          await refreshApi();
          const user = await getMeApi();
          setUser(user);
        } catch {
          setUser(null);
          const isProtected = PROTECTED_PATHS.some((p) =>
            p === '/' ? pathname === '/' : pathname.startsWith(p)
          );
          const isAuthPage = AUTH_PATHS.some((p) => pathname.startsWith(p));
          if (isProtected && !isAuthPage) {
            router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
          }
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return <>{children}</>;
}
