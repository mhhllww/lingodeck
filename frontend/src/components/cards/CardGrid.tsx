'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, BookOpen, FolderInput } from 'lucide-react';
import { FlipCard } from './FlipCard';
import { CardFilters } from './CardFilters';
import { CreateCardModal } from './CreateCardModal';
import { AssignDeckModal } from './AssignDeckModal';
import { AddCardsToDeckModal } from './AddCardsToDeckModal';
import { Button } from '@/components/ui/button';
import { useCards } from '@/hooks/useCards';
import { useToast } from '@/components/ui/toast';
import type { VocabularyCard } from '@/types/card';

interface CardGridProps {
  deckId?: string;
}

export function CardGrid({ deckId }: CardGridProps = {}) {
  const { cards: filteredCards, allCards: allStoreCards, filters, deleteCard, setFilters } = useCards();
  const cards = deckId ? filteredCards.filter((c) => c.deckId === deckId) : filteredCards;
  const allCards = deckId ? allStoreCards.filter((c) => c.deckId === deckId) : allStoreCards;
const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editCard, setEditCard] = useState<VocabularyCard | undefined>();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [assignCard, setAssignCard] = useState<VocabularyCard | null>(null);
  const [addToDeckOpen, setAddToDeckOpen] = useState(false);

  const allTags = [
    ...new Set(allCards.flatMap((c) => c.tags ?? [])),
  ].sort();

  const handleDelete = (id: string) => {
    setDeletingId(id);
    setTimeout(() => {
      deleteCard(id);
      setDeletingId(null);
      toast({ title: 'Card deleted', variant: 'default' });
    }, 300);
  };

  const handleEdit = (card: VocabularyCard) => {
    setEditCard(card);
    setModalOpen(true);
  };

  const handleModalClose = (open: boolean) => {
    setModalOpen(open);
    if (!open) setEditCard(undefined);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">My Cards</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            {allCards.length} {allCards.length === 1 ? 'word' : 'words'} saved
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          {deckId && (
            <Button variant="outline" onClick={() => setAddToDeckOpen(true)} className="gap-2">
              <FolderInput className="h-4 w-4" />
              <span className="hidden sm:inline">Add existing</span>
            </Button>
          )}
          <Button onClick={() => setModalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Card</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      {allCards.length > 0 && (
        <CardFilters filters={filters} allTags={allTags} onChange={setFilters} />
      )}

      {/* Grid */}
      {cards.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence mode="popLayout">
            {cards.map((card) => (
              <motion.div
                key={card.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{
                  opacity: deletingId === card.id ? 0 : 1,
                  scale: deletingId === card.id ? 0.9 : 1,
                }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.25 }}
              >
                <FlipCard
                  card={card}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                  onAssignDeck={setAssignCard}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : allCards.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
          <BookOpen className="h-12 w-12 text-[var(--muted-foreground)] opacity-30" />
          <div>
            <p className="font-semibold text-[var(--foreground)]">No cards yet</p>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              Search for a word on the Explore page and save it, or create a card manually.
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setModalOpen(true)} variant="outline" className="gap-2">
              <Plus className="h-4 w-4" /> Create your first card
            </Button>
            {deckId && (
              <Button onClick={() => setAddToDeckOpen(true)} variant="outline" className="gap-2">
                <FolderInput className="h-4 w-4" /> Add existing
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="py-12 text-center text-sm text-[var(--muted-foreground)]">
          No cards match your filters.
        </div>
      )}

      <CreateCardModal
        open={modalOpen}
        onOpenChange={handleModalClose}
        editCard={editCard}
        deckId={deckId}
      />
      <AssignDeckModal
        card={assignCard}
        open={!!assignCard}
        onOpenChange={(open) => { if (!open) setAssignCard(null); }}
      />
      {deckId && (
        <AddCardsToDeckModal
          deckId={deckId}
          open={addToDeckOpen}
          onOpenChange={setAddToDeckOpen}
        />
      )}
    </div>
  );
}
