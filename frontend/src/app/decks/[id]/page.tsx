'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Layers, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ColorPicker } from '@/components/ui/color-picker';
import { CardGrid } from '@/components/cards/CardGrid';
import { useCardStore } from '@/store/useCardStore';

export default function DeckDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { decks, updateDeck } = useCardStore();

  const deck = decks.find((d) => d.id === id);

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
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => router.push('/decks')}
          aria-label="Back to decks"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <ColorPicker
            value={deck.color}
            onChange={(color) => updateDeck(id, { color })}
          />
          <h1 className="text-2xl font-bold text-[var(--foreground)] truncate">{deck.name}</h1>
        </div>

        <Button
          size="sm"
          className="gap-2 shrink-0"
          onClick={() => router.push(`/decks/${id}/study`)}
        >
          <BookOpen className="h-3.5 w-3.5" />
          Study
        </Button>
      </div>

      <CardGrid deckId={id} />
    </div>
  );
}
