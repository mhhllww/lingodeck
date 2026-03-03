'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { SearchBar } from '@/components/search/SearchBar';
import { SearchResults } from '@/components/search/SearchResults';
import { useDebounce } from '@/hooks/useDebounce';
import { DEBOUNCE_MS } from '@/lib/constants';

export default function ExplorePage() {
  const [query, setQuery] = useState('');
  const [batchMode, setBatchMode] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [lastDeckName, setLastDeckName] = useState<string | undefined>();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(query, DEBOUNCE_MS);

  const handleSaved = useCallback(
    (deckName?: string) => {
      setSessionCount((n) => n + 1);
      setLastDeckName(deckName);
      if (batchMode) {
        setQuery('');
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
    },
    [batchMode]
  );

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
        batchMode={batchMode}
        onBatchModeChange={setBatchMode}
        inputRef={searchInputRef}
      />

      {/* Session counter (batch mode) */}
      <AnimatePresence>
        {batchMode && sessionCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2 text-sm text-[var(--accent)] font-medium"
          >
            <CheckCircle2 className="h-4 w-4" />
            Added {sessionCount} {sessionCount === 1 ? 'word' : 'words'}
            {lastDeckName && (
              <span className="text-[var(--muted-foreground)] font-normal">
                {' '}to &ldquo;{lastDeckName}&rdquo;
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <SearchResults query={debouncedQuery} onWordClick={setQuery} onSaved={handleSaved} />
    </div>
  );
}
