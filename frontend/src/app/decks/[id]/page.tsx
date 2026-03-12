'use client';

import { use, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Layers, LayoutGrid, Table2, FilePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CardGrid } from '@/components/cards/CardGrid';
import { DictionaryTable } from '@/components/dictionary-table/DictionaryTable';
import { DeckHero } from '@/components/decks/DeckHero';
import { AddCardsToDeckModal } from '@/components/cards/AddCardsToDeckModal';
import { useDecks, useAllCards, useUpdateDeck } from '@/hooks/useCardsQuery';

type ViewMode = 'cards' | 'table';

export default function DeckDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: decks = [] } = useDecks();
  const { data: cards = [] } = useAllCards();
  const updateDeck = useUpdateDeck();
  const [view, setView] = useState<ViewMode>('table');
  const [addToDeckOpen, setAddToDeckOpen] = useState(false);

  const deck = decks.find((d) => d.id === id);
  const deckCards = useMemo(() => cards.filter((c) => c.deckId === id), [cards, id]);

  if (!deck) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Layers className="h-12 w-12 text-[var(--muted-foreground)] opacity-30" />
        <p className="text-[var(--muted-foreground)]">Deck not found.</p>
        <Button variant="outline" onClick={() => router.push('/decks')}>
          Back to Decks
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <DeckHero
        deck={deck}
        deckCards={deckCards}
        onUpdateDeck={(data) => updateDeck.mutate({ id, data: { name: deck.name, color: deck.color, description: deck.description, ...data } })}
        onStudy={() => router.push(`/decks/${id}/study`)}
        onBack={() => router.push('/decks')}
        addButton={
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-white/80 hover:text-white hover:bg-white/10"
            onClick={() => setAddToDeckOpen(true)}
            aria-label="Add existing cards"
          >
            <FilePlus className="h-4 w-4" />
          </Button>
        }
      />

      {view === 'table' ? (
        <DictionaryTable
          deckId={id}
          viewToggle={
            <div className="flex items-center gap-1 rounded-lg border border-[var(--border)] p-1 shrink-0">
              <Button
                variant={view === 'table' ? 'default' : 'ghost'}
                size="icon-sm"
                onClick={() => setView('table')}
                title="Table view"
              >
                <Table2 className="h-4 w-4" />
              </Button>
              <Button
                variant={view === 'cards' ? 'default' : 'ghost'}
                size="icon-sm"
                onClick={() => setView('cards')}
                title="Card view"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
          }
        />
      ) : (
        <CardGrid
          deckId={id}
          viewToggle={
            <div className="flex items-center gap-1 rounded-lg border border-[var(--border)] p-1 shrink-0">
              <Button
                variant={view === 'table' ? 'default' : 'ghost'}
                size="icon-sm"
                onClick={() => setView('table')}
                title="Table view"
              >
                <Table2 className="h-4 w-4" />
              </Button>
              <Button
                variant={view === 'cards' ? 'default' : 'ghost'}
                size="icon-sm"
                onClick={() => setView('cards')}
                title="Card view"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
          }
        />
      )}

      <AddCardsToDeckModal
        deckId={id}
        open={addToDeckOpen}
        onOpenChange={setAddToDeckOpen}
      />
    </div>
  );
}
