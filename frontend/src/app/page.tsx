'use client';

import { useState } from 'react';
import { SearchBar } from '@/components/search/SearchBar';
import { SearchResults } from '@/components/search/SearchResults';
import { useDebounce } from '@/hooks/useDebounce';
import { DEBOUNCE_MS } from '@/lib/constants';

export default function ExplorePage() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, DEBOUNCE_MS);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Explore</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Type any word — in English or Russian — to get instant translation and dictionary data.
        </p>
      </div>

      <SearchBar
        value={query}
        onChange={setQuery}
      />

      <SearchResults query={debouncedQuery} onWordClick={setQuery} />
    </div>
  );
}
