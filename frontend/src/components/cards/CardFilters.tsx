'use client';

import { useCallback } from 'react';
import { Layers, Check, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
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
        <Popover>
          <PopoverTrigger asChild>
            <button className="inline-flex items-center gap-1.5 h-7 px-2.5 text-xs rounded-md border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--muted)] transition-colors">
              <Layers className="h-3.5 w-3.5 opacity-50" />
              {filters.deckIds.length === 0
                ? 'All decks'
                : `${filters.deckIds.length} selected`}
              <ChevronDown className="h-3 w-3 opacity-50" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-48 p-1">
            <button
              className="flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded-md hover:bg-[var(--muted)] transition-colors"
              onClick={() => toggleDeck('none')}
            >
              <span className={`h-4 w-4 flex items-center justify-center rounded border ${filters.deckIds.includes('none') ? 'bg-[var(--primary)] border-[var(--primary)]' : 'border-[var(--border)]'}`}>
                {filters.deckIds.includes('none') && <Check className="h-3 w-3 text-white" />}
              </span>
              <span className="inline-block h-2.5 w-2.5 rounded-full border border-[var(--border)]" />
              No deck
            </button>
            {decks.map((deck) => (
              <button
                key={deck.id}
                className="flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded-md hover:bg-[var(--muted)] transition-colors"
                onClick={() => toggleDeck(deck.id)}
              >
                <span className={`h-4 w-4 flex items-center justify-center rounded border ${filters.deckIds.includes(deck.id) ? 'bg-[var(--primary)] border-[var(--primary)]' : 'border-[var(--border)]'}`}>
                  {filters.deckIds.includes(deck.id) && <Check className="h-3 w-3 text-white" />}
                </span>
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: deck.color }}
                />
                {deck.name}
              </button>
            ))}
          </PopoverContent>
        </Popover>
      )}
      {allTags.map((tag) => (
        <Badge
          key={tag}
          variant={filters.tags.includes(tag) ? 'default' : 'clickable'}
          onClick={() => toggleTag(tag)}
          className="cursor-pointer"
        >
          {tag}
        </Badge>
      ))}
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
