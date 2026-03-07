import { Suspense } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';

export const metadata = { title: 'Sign in — LingoDeck' };

export default function LoginPage() {
  return (
    <div className="w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-lg">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Sign in</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Welcome back to LingoDeck
        </p>
      </div>
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
