'use client';

import { useState } from 'react';
import { BookmarkPlus, BookmarkCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { DeckTagSelector } from './DeckTagSelector';
import { useCardStore } from '@/store/useCardStore';
import { useToast } from '@/components/ui/toast';
import type { VocabularyCard } from '@/types/card';

interface SaveCardButtonProps {
  cardData: Omit<VocabularyCard, 'id' | 'createdAt' | 'tags' | 'deckId'>;
  suggestedTags: string[];
  onSaved?: (deckName?: string) => void;
}

export function SaveCardButton({ cardData, suggestedTags, onSaved }: SaveCardButtonProps) {
  const { cards, addCard, deleteCard, setLastUsedDeckId, decks } = useCardStore();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const savedCard = cards.find(
    (c) => c.word.toLowerCase() === cardData.word.toLowerCase()
  );
  const isSaved = !!savedCard;

  const handleSave = ({ deckId, tags }: { deckId: string | null; tags: string[] }) => {
    setOpen(false);

    const card = addCard({
      ...cardData,
      deckId: deckId ?? undefined,
      tags,
    });

    if (deckId) setLastUsedDeckId(deckId);

    const deckName = deckId ? (decks.find((d) => d.id === deckId)?.name ?? undefined) : undefined;

    toast({
      title: deckName ? `Saved to "${deckName}"` : 'Saved to cards!',
      description: `"${cardData.word}" added to your collection`,
      variant: 'success',
      duration: 4000,
      action: {
        label: 'Undo',
        onClick: () => deleteCard(card.id),
      },
    });

    onSaved?.(deckName);
  };

  if (isSaved) {
    const deckName = savedCard.deckId
      ? decks.find((d) => d.id === savedCard.deckId)?.name
      : undefined;

    return (
      <Button variant="outline" className="w-full gap-2" size="lg" disabled>
        <BookmarkCheck className="h-4 w-4" />
        {deckName ? `Saved in "${deckName}"` : 'Saved ✓'}
      </Button>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button className="w-full gap-2" size="lg">
          <BookmarkPlus className="h-4 w-4" />
          Save to Cards
        </Button>
      </PopoverTrigger>
      <PopoverContent align="center" className="p-0">
        <DeckTagSelector
          suggestedTags={suggestedTags}
          onSave={handleSave}
          onClose={() => setOpen(false)}
        />
      </PopoverContent>
    </Popover>
  );
}
