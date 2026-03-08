'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface SearchPaletteProps {
  value: string;
  onChange: (value: string) => void;
  totalCount: number;
  filteredCount: number;
  disabled?: boolean;
}

export function SearchPalette({ value, onChange, totalCount, filteredCount, disabled }: SearchPaletteProps) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (disabled) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.key === 'Escape') {
        setOpen(false);
        onChange('');
        return;
      }

      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 0);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [disabled, onChange]);

  const handleClose = useCallback(() => {
    setOpen(false);
    onChange('');
  }, [onChange]);

  const handleApply = useCallback(() => {
    setOpen(false);
  }, []);

  return (
    <>
      {/* Active filter badge */}
      {!open && value && (
        <Badge
          variant="secondary"
          className="cursor-pointer gap-1.5 px-3 py-1"
          onClick={handleClose}
        >
          <Search className="h-3 w-3" />
          &quot;{value}&quot;
          <X className="h-3 w-3 opacity-60 hover:opacity-100" />
        </Badge>
      )}
      {!open && value && (
        <span className="text-xs text-[var(--muted-foreground)] mr-1">
          {filteredCount} results
        </span>
      )}

      {/* Command palette */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-50 bg-black/50"
              onClick={handleClose}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.15 }}
              className="fixed left-1/2 top-[20%] z-50 w-full max-w-lg -translate-x-1/2 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl overflow-hidden"
            >
              <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)]">
                <Search className="h-5 w-5 text-[var(--muted-foreground)] shrink-0" />
                <Input
                  ref={inputRef}
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') handleClose();
                    if (e.key === 'Enter') handleApply();
                  }}
                  placeholder="Search words..."
                  className="border-0 shadow-none focus-visible:ring-0 h-8 px-0 text-base"
                  autoFocus
                />
                <button
                  onClick={handleClose}
                  className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors shrink-0"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="px-4 py-2 text-xs text-[var(--muted-foreground)] flex items-center justify-between">
                <span>
                  {value
                    ? `${filteredCount} of ${totalCount} words`
                    : `${totalCount} words total`}
                </span>
                <kbd className="px-1.5 py-0.5 rounded bg-[var(--muted)] text-[10px] font-mono">ESC</kbd>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
