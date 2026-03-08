'use client';

import { usePathname } from 'next/navigation';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import {ExploreFAB} from "@/components/search/ExploreFAB";

const AUTH_PATHS = ['/login', '/register', '/check-email', '/verify-email', '/forgot-password', '/reset-password'];

export function ShellLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = AUTH_PATHS.some((p) => pathname.startsWith(p));

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <main className="flex-1 min-w-0 px-4 py-6 lg:px-8 pb-20 lg:pb-6">
          {children}
        </main>
        <ExploreFAB />
      </div>
    </div>
  );
}
