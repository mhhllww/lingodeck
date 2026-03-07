'use client';

import { useState, useRef, useEffect } from 'react';
import { Plus, Search, Pencil, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExploreModal } from './ExploreModal';
import { CreateCardModal } from '@/components/cards/CreateCardModal';
import { CreateDeckModal } from '@/components/cards/CreateDeckModal';

export function ExploreFAB() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [deckOpen, setDeckOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  return (
    <>
      <div ref={menuRef} className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
        <AnimatePresence>
          {menuOpen && (
            <>
              <motion.button
                initial={{ opacity: 0, y: 10, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.8 }}
                transition={{ duration: 0.15, delay: 0.1 }}
                onClick={() => { setMenuOpen(false); setDeckOpen(true); }}
                className="flex items-center gap-2 rounded-full bg-[var(--surface)] border border-[var(--border)] shadow-lg pl-4 pr-3 py-2.5 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
              >
                New deck
                <Layers className="h-4 w-4 text-[var(--muted-foreground)]" />
              </motion.button>
              <motion.button
                initial={{ opacity: 0, y: 10, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.8 }}
                transition={{ duration: 0.15, delay: 0.05 }}
                onClick={() => { setMenuOpen(false); setCreateOpen(true); }}
                className="flex items-center gap-2 rounded-full bg-[var(--surface)] border border-[var(--border)] shadow-lg pl-4 pr-3 py-2.5 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
              >
                Create manually
                <Pencil className="h-4 w-4 text-[var(--muted-foreground)]" />
              </motion.button>
              <motion.button
                initial={{ opacity: 0, y: 10, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.8 }}
                transition={{ duration: 0.15 }}
                onClick={() => { setMenuOpen(false); setExploreOpen(true); }}
                className="flex items-center gap-2 rounded-full bg-[var(--surface)] border border-[var(--border)] shadow-lg pl-4 pr-3 py-2.5 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
              >
                Search & add
                <Search className="h-4 w-4 text-[var(--muted-foreground)]" />
              </motion.button>
            </>
          )}
        </AnimatePresence>
        <motion.button
          onClick={() => setMenuOpen((v) => !v)}
          animate={{ rotate: menuOpen ? 45 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent)] text-white shadow-lg hover:opacity-90 active:scale-95 transition-all"
          aria-label="Add word"
        >
          <Plus className="h-6 w-6" />
        </motion.button>
      </div>

      <ExploreModal open={exploreOpen} onOpenChange={setExploreOpen} />
      <CreateCardModal open={createOpen} onOpenChange={setCreateOpen} />
      <CreateDeckModal open={deckOpen} onOpenChange={setDeckOpen} />
    </>
  );
}
