'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { verifyEmailApi } from '@/lib/api/auth';
import { useAuthStore } from '@/store/useAuthStore';

type Status = 'loading' | 'success' | 'error';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      return;
    }

    verifyEmailApi(token)
      .then((user) => {
        setUser(user);
        setStatus('success');
        setTimeout(() => router.push('/'), 2000);
      })
      .catch(() => setStatus('error'));
  }, []);

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-[var(--accent)]" />
        <p className="text-sm text-[var(--muted-foreground)]">Verifying your email...</p>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <CheckCircle className="h-10 w-10 text-green-500" />
        <div>
          <h1 className="text-xl font-bold text-[var(--foreground)]">Email verified!</h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">Redirecting you to the app...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <XCircle className="h-10 w-10 text-[var(--destructive)]" />
      <div>
        <h1 className="text-xl font-bold text-[var(--foreground)]">Link invalid or expired</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          This verification link is no longer valid.
        </p>
      </div>
      <Link
        href="/check-email"
        className="text-sm text-[var(--accent)] hover:underline"
      >
        Request a new link
      </Link>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-lg">
      <Suspense>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
