'use client';

import { useState } from 'react';
import { LayoutGrid, Table2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CardGrid } from '@/components/cards/CardGrid';
import { DictionaryTable } from '@/components/dictionary-table/DictionaryTable';

type ViewMode = 'cards' | 'table';

export default function WordsPage() {
  const [view, setView] = useState<ViewMode>('table');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Words</h1>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-[var(--border)] p-1">
          <Button
            variant={view === 'table' ? 'default' : 'ghost'}
            size="icon-sm"
            onClick={() => setView('table')}
            title="Table view"
          >
            <Table2 className="h-4 w-4" />
          </Button>
          <Button
            variant={view === 'cards' ? 'default' : 'ghost'}
            size="icon-sm"
            onClick={() => setView('cards')}
            title="Card view"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {view === 'table' ? <DictionaryTable /> : <CardGrid />}
    </div>
  );
}
