'use client';

import { use, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CardGrid } from '@/components/cards/CardGrid';
import { DeckHero } from '@/components/decks/DeckHero';
import { useDecks, useAllCards, useUpdateDeck } from '@/hooks/useCardsQuery';

export default function DeckDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: decks = [] } = useDecks();
  const { data: cards = [] } = useAllCards();
  const updateDeck = useUpdateDeck();

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
        onUpdateDeck={(data) => updateDeck.mutate({ id, data })}
        onStudy={() => router.push(`/decks/${id}/study`)}
        onBack={() => router.push('/decks')}
      />

      <CardGrid deckId={id} />
    </div>
  );
}
