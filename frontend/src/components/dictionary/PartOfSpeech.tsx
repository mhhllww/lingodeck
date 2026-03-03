'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SynonymsBlock } from './SynonymsBlock';
import { AntonymsBlock } from './AntonymsBlock';
import type { Meaning } from '@/types/dictionary';
import { MAX_DEFINITIONS, MAX_SYNONYMS, MAX_ANTONYMS } from '@/lib/constants';

interface PartOfSpeechProps {
  meaning: Meaning;
  onWordClick?: (word: string) => void;
  defaultOpen?: boolean;
}

export function PartOfSpeech({ meaning, onWordClick, defaultOpen = true }: PartOfSpeechProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const allSynonyms = [
    ...meaning.synonyms,
    ...meaning.definitions.flatMap((d) => d.synonyms),
  ].filter((v, i, a) => a.indexOf(v) === i).slice(0, MAX_SYNONYMS);

  const allAntonyms = [
    ...meaning.antonyms,
    ...meaning.definitions.flatMap((d) => d.antonyms),
  ].filter((v, i, a) => a.indexOf(v) === i).slice(0, MAX_ANTONYMS);

  return (
    <div className="border border-[var(--border)] rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3 bg-[var(--muted)] hover:bg-[var(--border)] transition-colors text-left"
        aria-expanded={isOpen}
      >
        <span className="text-sm font-semibold text-[var(--accent)] italic">
          {meaning.partOfSpeech}
        </span>
        {isOpen ? (
          <ChevronDown className="h-4 w-4 text-[var(--muted-foreground)]" />
        ) : (
          <ChevronRight className="h-4 w-4 text-[var(--muted-foreground)]" />
        )}
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 py-3 space-y-4">
              <div className="space-y-3">
                {meaning.definitions
                  .slice(0, MAX_DEFINITIONS)
                  .map((def, idx) => (
                    <div key={idx} className="space-y-1">
                      <p className="text-sm text-[var(--foreground)]">
                        <span className="text-[var(--muted-foreground)] mr-2 text-xs font-medium">
                          {idx + 1}.
                        </span>
                        {def.definition}
                      </p>
                      {def.example && (
                        <p className="text-sm italic text-[var(--muted-foreground)] pl-5 border-l-2 border-[var(--border)]">
                          "{def.example}"
                        </p>
                      )}
                    </div>
                  ))}
              </div>

              {allSynonyms.length > 0 && (
                <SynonymsBlock synonyms={allSynonyms} onWordClick={onWordClick} />
              )}
              {allAntonyms.length > 0 && (
                <AntonymsBlock antonyms={allAntonyms} onWordClick={onWordClick} />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
