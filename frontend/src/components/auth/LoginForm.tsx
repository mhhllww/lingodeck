'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/toast';
import { GoogleButton } from './GoogleButton';

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const { login } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: LoginFormValues) => {
    setUnverifiedEmail(null);
    try {
      await login(values);
      toast({ title: 'Welcome back!', variant: 'success' });
      const redirect = searchParams.get('redirect') ?? '/';
      router.push(redirect);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      if (message.includes('not verified') || message.includes('EMAIL_NOT_VERIFIED')) {
        setUnverifiedEmail(values.email);
        return;
      }
      toast({ title: 'Login failed', description: message, variant: 'error' });
    }
  };

  return (
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

      <div className="space-y-1">
        <label htmlFor="password" className="text-sm font-medium text-[var(--foreground)]">
          Password
        </label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          {...register('password')}
        />
        {errors.password && (
          <p className="text-xs text-[var(--destructive)]">{errors.password.message}</p>
        )}
      </div>

      <div className="text-right">
        <Link href="/forgot-password" className="text-xs text-[var(--muted-foreground)] hover:underline">
          Forgot password?
        </Link>
      </div>

      {unverifiedEmail && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-sm">
          <p className="text-[var(--foreground)]">Please verify your email first.</p>
          <Link
            href={`/check-email?email=${encodeURIComponent(unverifiedEmail)}`}
            className="text-[var(--accent)] hover:underline text-xs"
          >
            Resend verification email
          </Link>
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
        Sign in
      </Button>

      <div className="relative my-2 flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
        <span className="flex-1 border-t border-[var(--border)]" />
        or
        <span className="flex-1 border-t border-[var(--border)]" />
      </div>

      <GoogleButton />

      <p className="text-center text-sm text-[var(--muted-foreground)]">
        No account?{' '}
        <Link href="/register" className="text-[var(--accent)] hover:underline">
          Sign up
        </Link>
      </p>
    </form>
  );
}
