'use client';

import { Search, SortAsc, SortDesc } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

  const toggleSort = () => {
    if (filters.sortField === 'createdAt') {
      onChange({ sortOrder: filters.sortOrder === 'desc' ? 'asc' : 'desc' });
    } else {
      onChange({ sortField: 'createdAt', sortOrder: 'desc' });
    }
  };

  return (
    <div className="space-y-3">
      {/* Search + Deck + Sort row */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)] pointer-events-none" />
          <Input
            value={filters.query}
            onChange={(e) => onChange({ query: e.target.value })}
            placeholder="Filter cards..."
            className="pl-9 h-9"
          />
        </div>
        {decks.length > 0 && (
          <Select
            value={filters.deckId ?? 'all'}
            onValueChange={(v) => onChange({ deckId: v === 'all' ? null : v })}
          >
            <SelectTrigger className="w-[140px] shrink-0">
              <SelectValue placeholder="All decks" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All decks</SelectItem>
              <SelectItem value="no-deck">No deck</SelectItem>
              {decks.map((deck) => (
                <SelectItem key={deck.id} value={deck.id}>
                  {deck.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Button
          variant="outline"
          size="icon"
          onClick={toggleSort}
          title={`Sort by date ${filters.sortOrder === 'desc' ? '(newest first)' : '(oldest first)'}`}
        >
          {filters.sortOrder === 'desc' ? (
            <SortDesc className="h-4 w-4" />
          ) : (
            <SortAsc className="h-4 w-4" />
          )}
        </Button>
        <Button
          variant={filters.sortField === 'word' ? 'default' : 'outline'}
          size="sm"
          onClick={() =>
            onChange({
              sortField: 'word',
              sortOrder: filters.sortField === 'word' ? (filters.sortOrder === 'asc' ? 'desc' : 'asc') : 'asc',
            })
          }
        >
          A–Z
        </Button>
      </div>

      {/* Tag filters */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
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
          {filters.tags.length > 0 && (
            <Badge
              variant="outline"
              onClick={() => onChange({ tags: [] })}
              className="cursor-pointer opacity-60 hover:opacity-100"
            >
              × clear
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
