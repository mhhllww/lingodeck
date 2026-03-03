'use client';

import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

export function Header() {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-sm px-4 lg:px-6">
      <Link href="/" className="flex items-center gap-2 font-semibold text-[var(--foreground)]">
        <BookOpen className="h-5 w-5 text-[var(--accent)]" />
        <span className="text-base tracking-tight">LingoDeck</span>
      </Link>
      <ThemeToggle />
    </header>
  );
}
