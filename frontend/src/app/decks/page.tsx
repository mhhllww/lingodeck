'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Layers, X, BookOpen, Trash2, BookMarked } from 'lucide-react';
import { SearchPalette } from '@/components/search/SearchPalette';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDecks, useAllCards, useUpdateDeck, useDeleteDeck } from '@/hooks/useCardsQuery';
import { ColorPicker } from '@/components/ui/color-picker';
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
  const updateDeck = useUpdateDeck();
  const deleteDeck = useDeleteDeck();
  const [previewColor, setPreviewColor] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const displayColor = previewColor ?? deck.color;

  const lastStudiedLabel = lastStudiedAt
    ? `Last studied ${formatDate(lastStudiedAt)}`
    : 'Not studied yet';

  const handlePreview = useCallback((c: string) => setPreviewColor(c), []);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      className="group relative rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden cursor-pointer hover:border-[var(--accent)]/50 transition-colors"
      style={{ borderTopColor: displayColor, borderTopWidth: 3 }}
      onClick={() => router.push(`/decks/${deck.id}`)}
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <ColorPicker
              value={deck.color}
              onChange={(color) => { setPreviewColor(null); updateDeck.mutate({ id: deck.id, data: { color } }); }}
              onPreview={handlePreview}
            />
            <h3 className="font-semibold text-[var(--foreground)] text-base leading-tight truncate">
              {deck.name}
            </h3>
          </div>
          <button
            className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--muted-foreground)] hover:text-[var(--destructive)]"
            onClick={(e) => {
              e.stopPropagation();
              if (cardCount > 0) {
                setDeleteOpen(true);
              } else {
                deleteDeck.mutate({ id: deck.id, keepCards: false });
              }
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

      <Dialog.Root open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AnimatePresence>
          {deleteOpen && (
            <Dialog.Portal forceMount>
              <Dialog.Overlay asChild>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                  onClick={(e) => e.stopPropagation()}
                />
              </Dialog.Overlay>
              <Dialog.Content asChild>
                <motion.div
                  initial={{ opacity: 0, scale: 0.96, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: 8 }}
                  transition={{ duration: 0.2 }}
                  className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl border border-[var(--border)] bg-[var(--background)] p-6 shadow-xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Dialog.Title className="text-lg font-semibold text-[var(--foreground)] mb-2">
                    Delete &quot;{deck.name}&quot;?
                  </Dialog.Title>
                  <p className="text-sm text-[var(--muted-foreground)] mb-5">
                    This deck has {cardCount} {cardCount === 1 ? 'card' : 'cards'}. What would you like to do?
                  </p>
                  <Dialog.Close asChild>
                    <button
                      className="absolute right-3 top-3 rounded-md p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </Dialog.Close>
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      className="flex-1 gap-2 justify-center"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteDeck.mutate({ id: deck.id, keepCards: false });
                        setDeleteOpen(false);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete all
                    </Button>
                    {cardCount > 0 && (
                      <Button
                        variant="outline"
                        className="flex-1 gap-2 justify-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteDeck.mutate({ id: deck.id, keepCards: true });
                          setDeleteOpen(false);
                        }}
                      >
                        <BookMarked className="h-4 w-4" />
                        Keep cards
                      </Button>
                    )}
                  </div>
                </motion.div>
              </Dialog.Content>
            </Dialog.Portal>
          )}
        </AnimatePresence>
      </Dialog.Root>
    </motion.div>
  );
}


export default function DecksPage() {
  const { data: decks = [] } = useDecks();
  const { data: cards = [] } = useAllCards();
  const [modalOpen, setModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDecks = decks.filter((d) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return d.name.toLowerCase().includes(q) || d.description?.toLowerCase().includes(q);
  });

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
        <>
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-1.5 flex-1">
            <SearchPalette
              value={searchQuery}
              onChange={setSearchQuery}
              totalCount={decks.length}
              filteredCount={filteredDecks.length}
              disabled={modalOpen}
            />
            <p className="text-sm text-[var(--muted-foreground)]">
              {decks.length} {decks.length === 1 ? 'deck' : 'decks'} saved
              {!searchQuery && <span className="ml-2 opacity-50">— start typing to search</span>}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredDecks.map((deck) => (
              <DeckCard
                key={deck.id}
                deck={deck}
                cardCount={cardCountByDeck(deck.id)}
                lastStudiedAt={lastStudiedByDeck(deck.id)}
              />
            ))}
          </AnimatePresence>
        </div>
        </>
      )}

      <CreateDeckModal open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  );
}
