import { RegisterForm } from '@/components/auth/RegisterForm';

export const metadata = { title: 'Create account — LingoDeck' };

export default function RegisterPage() {
  return (
    <div className="w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-lg">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Create account</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Start building your vocabulary
        </p>
      </div>
      <RegisterForm />
    </div>
  );
}
