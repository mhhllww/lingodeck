'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useCardStore } from '@/store/useCardStore';
import { cn } from '@/lib/utils';
import type { VocabularyCard } from '@/types/card';

interface AssignDeckModalProps {
  card: VocabularyCard | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AssignDeckModal({ card, open, onOpenChange }: AssignDeckModalProps) {
  const { decks, updateCard } = useCardStore();

  const handleSelect = (deckId: string | null) => {
    if (!card) return;
    updateCard(card.id, { deckId: deckId ?? undefined });
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 8 }}
                transition={{ duration: 0.2 }}
                className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl border border-[var(--border)] bg-[var(--background)] p-6 shadow-xl"
              >
                <div className="flex items-center justify-between mb-4">
                  <Dialog.Title className="text-lg font-semibold text-[var(--foreground)]">
                    Move to deck
                  </Dialog.Title>
                  <Dialog.Close asChild>
                    <Button variant="ghost" size="icon-sm" aria-label="Close">
                      <X className="h-4 w-4" />
                    </Button>
                  </Dialog.Close>
                </div>

                {card && (
                  <p className="text-sm text-[var(--muted-foreground)] mb-4">
                    <span className="font-medium text-[var(--foreground)]">{card.word}</span>
                    {' — '}
                    {card.translation}
                  </p>
                )}

                <div className="flex flex-col gap-1 max-h-64 overflow-y-auto">
                  {decks.length === 0 && (
                    <p className="text-sm text-[var(--muted-foreground)] py-4 text-center">
                      No decks yet. Create one first.
                    </p>
                  )}
                  {card?.deckId && (
                    <button
                      onClick={() => handleSelect(null)}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[var(--muted-foreground)] hover:bg-[var(--muted)] transition-colors text-left"
                    >
                      Remove from deck
                    </button>
                  )}
                  {decks.map((deck) => (
                    <button
                      key={deck.id}
                      onClick={() => handleSelect(deck.id)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-[var(--muted)] transition-colors text-left',
                        deck.id === card?.deckId
                          ? 'text-[var(--accent)] font-medium'
                          : 'text-[var(--foreground)]'
                      )}
                    >
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: deck.color }}
                      />
                      <span className="flex-1 truncate">{deck.name}</span>
                      {deck.id === card?.deckId && <Check className="h-3.5 w-3.5 shrink-0" />}
                    </button>
                  ))}
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
