'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { resendVerificationApi } from '@/lib/api/auth';
import { useToast } from '@/components/ui/toast';

function CheckEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') ?? '';
  const { toast } = useToast();

  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleResend = async () => {
    try {
      await resendVerificationApi(email);
      toast({ title: 'Email sent!', variant: 'success' });
      setCooldown(60);
    } catch (err) {
      toast({
        title: 'Failed to resend',
        description: err instanceof Error ? err.message : 'Try again later',
        variant: 'error',
      });
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--muted)]">
        <Mail className="h-7 w-7 text-[var(--accent)]" />
      </div>
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Check your inbox</h1>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          We sent a verification link to
        </p>
        {email && (
          <p className="mt-0.5 text-sm font-medium text-[var(--foreground)]">{email}</p>
        )}
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">The link expires in 24 hours.</p>
      </div>

      <Button
        variant="outline"
        className="w-full"
        onClick={handleResend}
        disabled={cooldown > 0}
      >
        {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend email'}
      </Button>

      <Link href="/login" className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
        Back to sign in
      </Link>
    </div>
  );
}

export default function CheckEmailPage() {
  return (
    <div className="w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-lg">
      <Suspense>
        <CheckEmailContent />
      </Suspense>
    </div>
  );
}
