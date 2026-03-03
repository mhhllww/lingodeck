'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  type Column,
} from '@tanstack/react-table';
import { ArrowUpDown, ArrowUp, ArrowDown, Plus, Search, BookOpen, Trash2, Pencil } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CreateCardModal } from '@/components/cards/CreateCardModal';
import { useCards } from '@/hooks/useCards';
import { useToast } from '@/components/ui/toast';
import type { VocabularyCard } from '@/types/card';

const columnHelper = createColumnHelper<VocabularyCard>();

function SortHeader({ label, column }: { label: string; column: Column<VocabularyCard> }) {
  const sorted = column.getIsSorted();
  return (
    <button
      className="flex items-center gap-1.5 font-medium hover:text-[var(--foreground)] transition-colors"
      onClick={column.getToggleSortingHandler()}
    >
      {label}
      {sorted === 'asc' ? (
        <ArrowUp className="h-3.5 w-3.5" />
      ) : sorted === 'desc' ? (
        <ArrowDown className="h-3.5 w-3.5" />
      ) : (
        <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
      )}
    </button>
  );
}

export function DictionaryTable() {
  const { allCards, deleteCard } = useCards();
  const { toast } = useToast();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editCard, setEditCard] = useState<VocabularyCard | undefined>();

  const allTags = useMemo(
    () => [...new Set(allCards.flatMap((c) => c.tags ?? []))].sort(),
    [allCards]
  );

  const tagFilteredCards = useMemo(() => {
    if (activeTags.length === 0) return allCards;
    return allCards.filter((card) => activeTags.every((tag) => card.tags?.includes(tag)));
  }, [allCards, activeTags]);

  const handleDelete = useCallback(
    (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      deleteCard(id);
      toast({ title: 'Card deleted', variant: 'default' });
    },
    [deleteCard, toast]
  );

  const handleEdit = useCallback((card: VocabularyCard, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditCard(card);
    setModalOpen(true);
  }, []);

  const handleModalClose = useCallback((open: boolean) => {
    setModalOpen(open);
    if (!open) setEditCard(undefined);
  }, []);

  const toggleTag = (tag: string) => {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor('word', {
        header: ({ column }) => <SortHeader label="Word" column={column} />,
        cell: ({ row }) => (
          <div>
            <span className="font-medium text-[var(--foreground)]">{row.original.word}</span>
            {row.original.transcription && (
              <span className="block text-xs text-[var(--muted-foreground)] mt-0.5">
                {row.original.transcription}
              </span>
            )}
          </div>
        ),
      }),
      columnHelper.accessor('translation', {
        header: ({ column }) => <SortHeader label="Translation" column={column} />,
        cell: ({ getValue }) => (
          <span className="text-[var(--foreground)]">{getValue()}</span>
        ),
      }),
      columnHelper.accessor('partOfSpeech', {
        header: 'Part of Speech',
        enableSorting: false,
        cell: ({ getValue }) => {
          const parts = getValue();
          if (!parts?.length) return <span className="text-[var(--muted-foreground)]">—</span>;
          return (
            <div className="flex flex-wrap gap-1">
              {parts.map((p) => (
                <Badge key={p} variant="outline" className="text-xs">
                  {p}
                </Badge>
              ))}
            </div>
          );
        },
      }),
      columnHelper.accessor('definitions', {
        header: 'Definition',
        enableSorting: false,
        cell: ({ getValue }) => {
          const defs = getValue();
          if (!defs?.length) return <span className="text-[var(--muted-foreground)]">—</span>;
          const text = defs[0];
          return (
            <span className="text-sm text-[var(--muted-foreground)] line-clamp-2">
              {text.length > 80 ? text.slice(0, 80) + '…' : text}
            </span>
          );
        },
      }),
      columnHelper.accessor('tags', {
        header: 'Tags',
        enableSorting: false,
        cell: ({ getValue }) => {
          const tags = getValue();
          if (!tags?.length) return <span className="text-[var(--muted-foreground)]">—</span>;
          return (
            <div className="flex flex-wrap gap-1">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          );
        },
      }),
      columnHelper.accessor('createdAt', {
        header: ({ column }) => <SortHeader label="Added" column={column} />,
        cell: ({ getValue }) => (
          <span className="text-sm text-[var(--muted-foreground)] whitespace-nowrap">
            {new Date(getValue()).toLocaleDateString()}
          </span>
        ),
      }),
      columnHelper.display({
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={(e) => handleEdit(row.original, e)}
              title="Edit"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={(e) => handleDelete(row.original.id, e)}
              title="Delete"
              className="text-[var(--destructive)] hover:text-[var(--destructive)]"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ),
      }),
    ],
    [handleDelete, handleEdit]
  );

  const table = useReactTable({
    data: tagFilteredCards,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: 'includesString',
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Dictionary</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            {allCards.length} {allCards.length === 1 ? 'word' : 'words'} saved
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New Card</span>
        </Button>
      </div>

      {/* Filters */}
      {allCards.length > 0 && (
        <div className="space-y-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)] pointer-events-none" />
            <Input
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Filter words..."
              className="pl-9 h-9"
            />
          </div>
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {allTags.map((tag) => (
                <Badge
                  key={tag}
                  variant={activeTags.includes(tag) ? 'default' : 'clickable'}
                  onClick={() => toggleTag(tag)}
                  className="cursor-pointer"
                >
                  {tag}
                </Badge>
              ))}
              {activeTags.length > 0 && (
                <Badge
                  variant="outline"
                  onClick={() => setActiveTags([])}
                  className="cursor-pointer opacity-60 hover:opacity-100"
                >
                  × clear
                </Badge>
              )}
            </div>
          )}
        </div>
      )}

      {/* Table / Empty state */}
      {allCards.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
          <BookOpen className="h-12 w-12 text-[var(--muted-foreground)] opacity-30" />
          <div>
            <p className="font-semibold text-[var(--foreground)]">No words yet</p>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              Search for a word on the Explore page and save it, or create a card manually.
            </p>
          </div>
          <Button onClick={() => setModalOpen(true)} variant="outline" className="gap-2">
            <Plus className="h-4 w-4" /> Add your first word
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border border-[var(--border)] overflow-hidden">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow
                  key={headerGroup.id}
                  className="hover:bg-transparent border-b border-[var(--border)] bg-[var(--muted)]/40"
                >
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="group cursor-pointer"
                    onClick={() => handleEdit(row.original)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center text-[var(--muted-foreground)]"
                  >
                    No results match your filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <CreateCardModal open={modalOpen} onOpenChange={handleModalClose} editCard={editCard} />
    </div>
  );
}
