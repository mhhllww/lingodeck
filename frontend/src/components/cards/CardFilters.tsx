'use client';

import { useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { DeckFilterDropdown } from '@/components/ui/deck-filter-dropdown';
import { getTagClasses } from '@/lib/tagColors';
import type { CardFilters as CardFiltersType, Deck } from '@/types/card';

interface CardFiltersProps {
  filters: CardFiltersType;
  allTags: string[];
  decks: Deck[];
  onChange: (filters: Partial<CardFiltersType>) => void;
}

export function CardFilters({ filters, allTags, decks, onChange }: CardFiltersProps) {
  const toggleTag = (tag: string) => {
    const next = filters.tags.includes(tag)
      ? filters.tags.filter((t) => t !== tag)
      : [...filters.tags, tag];
    onChange({ tags: next });
  };

  const toggleDeck = useCallback((id: string) => {
    const current = filters.deckIds;
    const next = current.includes(id)
      ? current.filter((d) => d !== id)
      : [...current, id];
    onChange({ deckIds: next });
  }, [filters.deckIds, onChange]);

  const hasActiveFilters = filters.tags.length > 0 || filters.deckIds.length > 0;

  if (decks.length === 0 && allTags.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {decks.length > 0 && (
        <DeckFilterDropdown
          decks={decks}
          selectedIds={filters.deckIds}
          onToggle={toggleDeck}
        />
      )}
      {allTags.map((tag) => {
        const active = filters.tags.includes(tag);
        return (
          <button
            key={tag}
            onClick={() => toggleTag(tag)}
            className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium transition-opacity ${getTagClasses(tag)} ${active ? 'opacity-100 ring-1 ring-current' : 'opacity-50 hover:opacity-80'}`}
          >
            <span className="opacity-40">#</span>{tag}
          </button>
        );
      })}
      {hasActiveFilters && (
        <Badge
          variant="outline"
          onClick={() => onChange({ tags: [], deckIds: [] })}
          className="cursor-pointer opacity-60 hover:opacity-100"
        >
          × clear
        </Badge>
      )}
    </div>
  );
}
