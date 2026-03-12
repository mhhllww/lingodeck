'use client';

import { useState, useMemo } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Search, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAllCards, useUpdateCard } from '@/hooks/useCardsQuery';
import { cn } from '@/lib/utils';

interface AddCardsToDeckModalProps {
  deckId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddCardsToDeckModal({ deckId, open, onOpenChange }: AddCardsToDeckModalProps) {
  const { data: cards = [] } = useAllCards();
  const updateCard = useUpdateCard();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const available = useMemo(() => {
    const q = query.toLowerCase();
    return cards
      .filter((c) => c.deckId !== deckId)
      .filter(
        (c) =>
          !q ||
          c.word.toLowerCase().includes(q) ||
          c.translation.toLowerCase().includes(q)
      );
  }, [cards, deckId, query]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAdd = () => {
    selected.forEach((id) => updateCard.mutate({ id, data: { deckId } }));
    setSelected(new Set());
    setQuery('');
    onOpenChange(false);
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setSelected(new Set());
      setQuery('');
    }
    onOpenChange(open);
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleClose}>
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
                className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-[var(--border)] bg-[var(--background)] p-6 shadow-xl flex flex-col gap-4"
              >
                <div className="flex items-center justify-between">
                  <Dialog.Title className="text-lg font-semibold text-[var(--foreground)]">
                    Add cards to deck
                  </Dialog.Title>
                  <Dialog.Close asChild>
                    <Button variant="ghost" size="icon-sm" aria-label="Close">
                      <X className="h-4 w-4" />
                    </Button>
                  </Dialog.Close>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search cards…"
                    className="pl-9"
                    autoFocus
                  />
                </div>

                <div className="flex flex-col gap-1 max-h-72 overflow-y-auto -mx-1 px-1">
                  {available.length === 0 && (
                    <p className="text-sm text-[var(--muted-foreground)] py-8 text-center">
                      {query ? 'No cards match your search.' : 'All cards are already in this deck.'}
                    </p>
                  )}
                  {available.map((card) => {
                    const isSelected = selected.has(card.id);
                    return (
                      <button
                        key={card.id}
                        onClick={() => toggle(card.id)}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left',
                          isSelected
                            ? 'bg-[var(--accent)]/10 text-[var(--accent)]'
                            : 'hover:bg-[var(--muted)] text-[var(--foreground)]'
                        )}
                      >
                        <div
                          className={cn(
                            'h-4 w-4 rounded border shrink-0 flex items-center justify-center transition-colors',
                            isSelected
                              ? 'bg-[var(--accent)] border-[var(--accent)]'
                              : 'border-[var(--border)]'
                          )}
                        >
                          {isSelected && <Check className="h-2.5 w-2.5 text-white" />}
                        </div>
                        <span className="font-medium">{card.word}</span>
                        <span className="text-[var(--muted-foreground)] truncate">
                          {card.translation}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex gap-3 pt-1 border-t border-[var(--border)]">
                  <Dialog.Close asChild>
                    <Button variant="outline" className="flex-1" type="button">
                      Cancel
                    </Button>
                  </Dialog.Close>
                  <Button
                    className="flex-1"
                    onClick={handleAdd}
                    disabled={selected.size === 0}
                  >
                    Add {selected.size > 0 ? `${selected.size} card${selected.size > 1 ? 's' : ''}` : 'cards'}
                  </Button>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
