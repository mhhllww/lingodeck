'use client';

import { Badge } from '@/components/ui/badge';

interface AntonymsBlockProps {
  antonyms: string[];
  onWordClick?: (word: string) => void;
}

export function AntonymsBlock({ antonyms, onWordClick }: AntonymsBlockProps) {
  if (!antonyms.length) return null;

  return (
    <div className="space-y-1.5">
      <h4 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide">
        Antonyms
      </h4>
      <div className="flex flex-wrap gap-1.5">
        {antonyms.map((word) => (
          <Badge
            key={word}
            variant="clickable"
            onClick={() => onWordClick?.(word)}
            title={`Search "${word}"`}
          >
            {word}
          </Badge>
        ))}
      </div>
    </div>
  );
}
