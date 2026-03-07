'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { forgotPasswordApi } from '@/lib/api/auth';

const schema = z.object({
  email: z.string().email('Invalid email'),
});

type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    await forgotPasswordApi(values.email);
    setSent(true);
  };

  return (
    <div className="w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-lg">
      {sent ? (
        <div className="flex flex-col items-center gap-4 text-center">
          <CheckCircle className="h-10 w-10 text-green-500" />
          <div>
            <h1 className="text-xl font-bold text-[var(--foreground)]">Check your inbox</h1>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              If this email is registered, you will receive a reset link shortly.
            </p>
          </div>
          <Link href="/login" className="text-sm text-[var(--accent)] hover:underline">
            Back to sign in
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[var(--foreground)]">Forgot password?</h1>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Enter your email and we'll send you a reset link.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="email" className="text-sm font-medium text-[var(--foreground)]">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-xs text-[var(--destructive)]">{errors.email.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Send reset link
            </Button>

            <p className="text-center text-sm text-[var(--muted-foreground)]">
              <Link href="/login" className="text-[var(--accent)] hover:underline">
                Back to sign in
              </Link>
            </p>
          </form>
        </>
      )}
    </div>
  );
}
