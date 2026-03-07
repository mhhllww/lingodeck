'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { SearchBar } from './SearchBar';
import { SearchResults } from './SearchResults';
import { useDebounce } from '@/hooks/useDebounce';
import { DEBOUNCE_MS } from '@/lib/constants';

interface ExploreModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExploreModal({ open, onOpenChange }: ExploreModalProps) {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, DEBOUNCE_MS);

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onOpenChange]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/50"
            onClick={() => onOpenChange(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.15 }}
            className="fixed left-1/2 top-[10%] z-50 w-full max-w-2xl -translate-x-1/2 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <p className="text-sm text-[var(--muted-foreground)]">
                Type any word to get translation and dictionary data
              </p>
              <button
                onClick={() => onOpenChange(false)}
                className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-5 pb-2">
              <SearchBar value={query} onChange={setQuery} />
            </div>
            <div className="px-5 pb-5 max-h-[60vh] overflow-y-auto">
              <SearchResults query={debouncedQuery} onWordClick={setQuery} />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
