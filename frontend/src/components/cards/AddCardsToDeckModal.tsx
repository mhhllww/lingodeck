'use client';

import { useState, useMemo } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Search, Check, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DeckFilterDropdown } from '@/components/ui/deck-filter-dropdown';
import { useAllCards, useDecks, useUpdateCard } from '@/hooks/useCardsQuery';
import { cn } from '@/lib/utils';
import type { VocabularyCard } from '@/types/card';

interface AddCardsToDeckModalProps {
  deckId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddCardsToDeckModal({ deckId, open, onOpenChange }: AddCardsToDeckModalProps) {
  const { data: cards = [] } = useAllCards();
  const { data: decks = [] } = useDecks();
  const updateCard = useUpdateCard();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filterDeckIds, setFilterDeckIds] = useState<string[]>([]);
  const [confirming, setConfirming] = useState(false);

  const available = useMemo(() => {
    const q = query.toLowerCase();
    return cards
      .filter((c) => c.deckId !== deckId)
      .filter((c) => {
        if (filterDeckIds.length === 0) return true;
        if (filterDeckIds.includes('none') && !c.deckId) return true;
        return c.deckId ? filterDeckIds.includes(c.deckId) : false;
      })
      .filter(
        (c) =>
          !q ||
          c.word.toLowerCase().includes(q) ||
          c.translation.toLowerCase().includes(q)
      );
  }, [cards, deckId, query, filterDeckIds]);

  const otherDecks = useMemo(() => decks.filter((d) => d.id !== deckId), [decks, deckId]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleDeckFilter = (id: string) => {
    setFilterDeckIds((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const selectedCards = useMemo(
    () => cards.filter((c) => selected.has(c.id)),
    [cards, selected]
  );

  const cardsFromDecks = useMemo(
    () => selectedCards.filter((c) => c.deckId),
    [selectedCards]
  );

  const getDeckName = (card: VocabularyCard) => {
    const deck = decks.find((d) => d.id === card.deckId);
    return deck?.name ?? 'Unknown deck';
  };

  const handleAdd = () => {
    if (cardsFromDecks.length > 0 && !confirming) {
      setConfirming(true);
      return;
    }
    selected.forEach((id) => updateCard.mutate({ id, data: { deckId } }));
    resetAndClose();
  };

  const resetAndClose = () => {
    setSelected(new Set());
    setQuery('');
    setFilterDeckIds([]);
    setConfirming(false);
    onOpenChange(false);
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setSelected(new Set());
      setQuery('');
      setFilterDeckIds([]);
      setConfirming(false);
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
                {confirming ? (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                      </div>
                      <div>
                        <Dialog.Title className="text-lg font-semibold text-[var(--foreground)]">
                          Move cards from other decks?
                        </Dialog.Title>
                        <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
                          {cardsFromDecks.length === 1
                            ? 'This card will be removed from its current deck.'
                            : `${cardsFromDecks.length} cards will be removed from their current decks.`}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 max-h-48 overflow-y-auto -mx-1 px-1">
                      {cardsFromDecks.map((card) => (
                        <div
                          key={card.id}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--muted)]/50 text-sm"
                        >
                          <span className="font-medium">{card.word}</span>
                          <span className="text-[var(--muted-foreground)]">from</span>
                          <span
                            className="inline-flex items-center gap-1.5 text-[var(--muted-foreground)]"
                          >
                            <span
                              className="inline-block h-2 w-2 rounded-full shrink-0"
                              style={{ backgroundColor: decks.find((d) => d.id === card.deckId)?.color }}
                            />
                            {getDeckName(card)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-3 pt-1 border-t border-[var(--border)]">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => setConfirming(false)}
                      >
                        Back
                      </Button>
                      <Button className="flex-1" onClick={handleAdd}>
                        Move & add
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
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

                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
                        <Input
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          placeholder="Search cards…"
                          className="pl-9"
                          autoFocus
                        />
                      </div>
                      {otherDecks.length > 0 && (
                        <DeckFilterDropdown
                          decks={otherDecks}
                          selectedIds={filterDeckIds}
                          onToggle={toggleDeckFilter}
                          triggerClassName="h-10 px-3 text-sm rounded-lg"
                        />
                      )}
                    </div>

                    <div className="flex flex-col gap-1 max-h-72 overflow-y-auto -mx-1 px-1">
                      {available.length === 0 && (
                        <p className="text-sm text-[var(--muted-foreground)] py-8 text-center">
                          {query || filterDeckIds.length > 0
                            ? 'No cards match your filters.'
                            : 'All cards are already in this deck.'}
                        </p>
                      )}
                      {available.map((card) => {
                        const isSelected = selected.has(card.id);
                        const cardDeck = card.deckId
                          ? decks.find((d) => d.id === card.deckId)
                          : null;
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
                            {cardDeck && (
                              <span className="ml-auto inline-flex items-center gap-1 text-xs text-[var(--muted-foreground)] shrink-0">
                                <span
                                  className="inline-block h-2 w-2 rounded-full"
                                  style={{ backgroundColor: cardDeck.color }}
                                />
                                {cardDeck.name}
                              </span>
                            )}
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
                  </>
                )}
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
