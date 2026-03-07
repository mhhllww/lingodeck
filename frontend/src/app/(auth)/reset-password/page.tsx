'use client';

import { useState, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { resetPasswordApi } from '@/lib/api/auth';

const schema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof schema>;

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') ?? '';
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setError(null);
    try {
      await resetPasswordApi(token, values.password);
      setSuccess(true);
      setTimeout(() => router.push('/login'), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid or expired link');
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <CheckCircle className="h-10 w-10 text-green-500" />
        <div>
          <h1 className="text-xl font-bold text-[var(--foreground)]">Password updated!</h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">Redirecting to sign in...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <XCircle className="h-10 w-10 text-[var(--destructive)]" />
        <div>
          <h1 className="text-xl font-bold text-[var(--foreground)]">Link invalid or expired</h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">{error}</p>
        </div>
        <Link href="/forgot-password" className="text-sm text-[var(--accent)] hover:underline">
          Request a new reset link
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Set new password</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Choose a strong password for your account.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="password" className="text-sm font-medium text-[var(--foreground)]">
            New password
          </label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            {...register('password')}
          />
          {errors.password && (
            <p className="text-xs text-[var(--destructive)]">{errors.password.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <label htmlFor="confirmPassword" className="text-sm font-medium text-[var(--foreground)]">
            Confirm password
          </label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && (
            <p className="text-xs text-[var(--destructive)]">{errors.confirmPassword.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Update password
        </Button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-lg">
      <Suspense>
        <ResetPasswordContent />
      </Suspense>
    </div>
  );
}
