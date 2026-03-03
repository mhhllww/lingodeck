'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, BookMarked, Table2, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Explore', icon: Search },
  { href: '/cards', label: 'My Cards', icon: BookMarked },
  { href: '/decks', label: 'Decks', icon: Layers },
  { href: '/dictionary', label: 'Dictionary', icon: Table2 },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-56 shrink-0 border-r border-[var(--border)] bg-[var(--background)] h-[calc(100vh-3.5rem)] sticky top-14">
        <nav className="flex flex-col gap-1 p-3 pt-4">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                pathname === href
                  ? 'bg-[var(--accent)] text-white'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex border-t border-[var(--border)] bg-[var(--background)]/90 backdrop-blur-sm">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition-colors',
              pathname === href
                ? 'text-[var(--accent)]'
                : 'text-[var(--text-secondary)]'
            )}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        ))}
      </nav>
    </>
  );
}
