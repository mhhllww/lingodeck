'use client';

import { useRef } from 'react';
import { Search, X, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  batchMode?: boolean;
  onBatchModeChange?: (enabled: boolean) => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

export function SearchBar({
  value,
  onChange,
  placeholder = 'Type any word to explore...',
  batchMode = false,
  onBatchModeChange,
  inputRef: externalRef,
}: SearchBarProps) {
  const internalRef = useRef<HTMLInputElement>(null);
  const inputRef = externalRef ?? internalRef;

  return (
    <div className="space-y-2">
      <div className="relative flex items-center w-full">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)] pointer-events-none" />
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            'pl-10 pr-10 h-12 text-base rounded-xl border-[var(--border)] bg-[var(--surface)] focus:ring-[var(--accent)] shadow-sm transition-all',
            batchMode && 'ring-2 ring-[var(--accent)]/40'
          )}
          autoFocus
          aria-label="Search word"
        />
        <AnimatePresence>
          {value && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute right-2"
            >
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => {
                  onChange('');
                  inputRef.current?.focus();
                }}
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {onBatchModeChange && (
        <button
          onClick={() => onBatchModeChange(!batchMode)}
          className={cn(
            'flex items-center gap-1.5 text-xs transition-colors px-1',
            batchMode
              ? 'text-[var(--accent)] font-medium'
              : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
          )}
        >
          <Zap className={cn('h-3 w-3', batchMode && 'fill-current')} />
          Quick add mode
          {batchMode && <span className="opacity-60">(active)</span>}
        </button>
      )}
    </div>
  );
}
