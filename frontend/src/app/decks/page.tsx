'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Layers, X, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCardStore } from '@/store/useCardStore';
import { CreateDeckModal } from '@/components/cards/CreateDeckModal';
import { formatDate } from '@/lib/utils';
import type { Deck } from '@/types/card';

function DeckCard({
  deck,
  cardCount,
  lastStudiedAt,
}: {
  deck: Deck;
  cardCount: number;
  lastStudiedAt: string | null;
}) {
  const router = useRouter();
  const { deleteDeck } = useCardStore();

  const lastStudiedLabel = lastStudiedAt
    ? `Last studied ${formatDate(lastStudiedAt)}`
    : 'Not studied yet';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      className="group relative rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden cursor-pointer hover:border-[var(--accent)]/50 transition-colors"
      style={{ borderTopColor: deck.color, borderTopWidth: 3 }}
      onClick={() => router.push(`/decks/${deck.id}`)}
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-3">
          <h3 className="font-semibold text-[var(--foreground)] text-base leading-tight">
            {deck.name}
          </h3>
          <button
            className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--muted-foreground)] hover:text-[var(--destructive)]"
            onClick={(e) => {
              e.stopPropagation();
              deleteDeck(deck.id);
            }}
            title="Delete deck"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <p className="text-2xl font-bold text-[var(--foreground)] mb-1">{cardCount}</p>
        <p className="text-xs text-[var(--muted-foreground)] mb-3">
          {cardCount === 1 ? 'card' : 'cards'}
        </p>

        {deck.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {deck.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <p className="text-xs text-[var(--muted-foreground)] mb-3">{lastStudiedLabel}</p>

        <Button
          size="sm"
          className="w-full gap-2"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/decks/${deck.id}/study`);
          }}
          disabled={cardCount === 0}
        >
          <BookOpen className="h-3.5 w-3.5" />
          Study
        </Button>
      </div>
    </motion.div>
  );
}


export default function DecksPage() {
  const { decks, cards } = useCardStore();
  const [modalOpen, setModalOpen] = useState(false);

  const cardCountByDeck = (deckId: string) =>
    cards.filter((c) => c.deckId === deckId).length;

  const lastStudiedByDeck = (deckId: string): string | null => {
    const studied = cards
      .filter((c) => c.deckId === deckId && c.lastStudiedAt)
      .map((c) => c.lastStudiedAt!);
    if (!studied.length) return null;
    return studied.reduce((a, b) => (a > b ? a : b));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Decks</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            {decks.length} {decks.length === 1 ? 'deck' : 'decks'}
          </p>
        </div>
      </div>

      {decks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
          <Layers className="h-12 w-12 text-[var(--muted-foreground)] opacity-30" />
          <div>
            <p className="font-semibold text-[var(--foreground)]">No decks yet</p>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              Create a deck to organize your vocabulary cards.
            </p>
          </div>
          <Button onClick={() => setModalOpen(true)} variant="outline" className="gap-2">
            <Plus className="h-4 w-4" /> Create your first deck
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence mode="popLayout">
            {decks.map((deck) => (
              <DeckCard
                key={deck.id}
                deck={deck}
                cardCount={cardCountByDeck(deck.id)}
                lastStudiedAt={lastStudiedByDeck(deck.id)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      <CreateDeckModal open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  );
}
