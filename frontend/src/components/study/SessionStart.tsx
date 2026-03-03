'use client';

import { motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Deck } from '@/types/card';

interface SessionStartProps {
  deck: Deck;
  cardCount: number;
  onStart: () => void;
  onCancel: () => void;
}

export function SessionStart({ deck, cardCount, onStart, onCancel }: SessionStartProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col items-center justify-center min-h-[60vh] px-4"
    >
      <div className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center space-y-6 shadow-lg">
        {/* Deck color accent */}
        <div
          className="mx-auto h-12 w-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${deck.color}22`, border: `2px solid ${deck.color}` }}
        >
          <BookOpen className="h-5 w-5" style={{ color: deck.color }} />
        </div>

        <div className="space-y-1">
          <h1 className="text-xl font-bold text-[var(--foreground)]">{deck.name}</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            {cardCount} {cardCount === 1 ? 'card' : 'cards'} to review
          </p>
        </div>

        <div className="space-y-2 pt-2">
          <Button className="w-full" size="lg" onClick={onStart} autoFocus>
            Start
          </Button>
          <Button variant="ghost" className="w-full" onClick={onCancel}>
            Cancel
          </Button>
        </div>

        <p className="text-xs text-[var(--muted-foreground)]">
          Keyboard: <kbd className="font-mono">Space</kbd> show translation ·{' '}
          <kbd className="font-mono">G</kbd> got it · <kbd className="font-mono">A</kbd> again
        </p>
      </div>
    </motion.div>
  );
}
