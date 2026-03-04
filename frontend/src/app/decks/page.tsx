'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Layers, Check, X, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useCardStore, DECK_COLORS, createDeckOnBackend } from '@/store/useCardStore';
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

function NewDeckCard({ onCreated }: { onCreated: () => void }) {
  const { decks } = useCardStore();
  const [active, setActive] = useState(false);
  const [name, setName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (active) inputRef.current?.focus();
  }, [active]);

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const color = DECK_COLORS[decks.length % DECK_COLORS.length];
    await createDeckOnBackend({ name: trimmed, tags: [], color });
    setName('');
    setActive(false);
    onCreated();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleCreate();
    if (e.key === 'Escape') {
      setActive(false);
      setName('');
    }
  };

  if (active) {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-xl border-2 border-dashed border-[var(--accent)] bg-[var(--surface)] p-5 flex flex-col gap-3"
      >
        <Input
          ref={inputRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Deck name…"
          className="h-9"
        />
        <div className="flex gap-2">
          <Button size="sm" className="flex-1" onClick={handleCreate} disabled={!name.trim()}>
            <Check className="h-3.5 w-3.5 mr-1" /> Create
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setActive(false);
              setName('');
            }}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.button
      layout
      onClick={() => setActive(true)}
      className="rounded-xl border-2 border-dashed border-[var(--border)] bg-transparent hover:border-[var(--accent)]/50 hover:bg-[var(--muted)]/30 transition-colors p-5 flex flex-col items-center justify-center gap-2 min-h-[140px] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
    >
      <Plus className="h-6 w-6" />
      <span className="text-sm font-medium">New Deck</span>
    </motion.button>
  );
}

export default function DecksPage() {
  const { decks, cards } = useCardStore();
  const [_, setRefresh] = useState(0);

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

      {decks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
          <Layers className="h-12 w-12 text-[var(--muted-foreground)] opacity-30" />
          <div>
            <p className="font-semibold text-[var(--foreground)]">No decks yet</p>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              Create a deck to organize your vocabulary cards.
            </p>
          </div>
        </div>
      )}

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
        <NewDeckCard onCreated={() => setRefresh((n) => n + 1)} />
      </div>
    </div>
  );
}
