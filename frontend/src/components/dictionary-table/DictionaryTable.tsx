'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  type RowSelectionState,
  type Column,
} from '@tanstack/react-table';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpDown, ArrowUp, ArrowDown, Plus, Search, BookOpen, Trash2, Pencil, X } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem, ContextMenuSeparator } from '@/components/ui/context-menu';
import { CreateCardModal } from '@/components/cards/CreateCardModal';
import { useCards } from '@/hooks/useCards';
import { useCardStore } from '@/store/useCardStore';
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
  const decks = useCardStore((s) => s.decks);
  const { toast } = useToast();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [editCard, setEditCard] = useState<VocabularyCard | undefined>();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (modalOpen) return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.key === 'Escape') {
        setSearchOpen(false);
        setGlobalFilter('');
        return;
      }

      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        setSearchOpen(true);
        setTimeout(() => searchRef.current?.focus(), 0);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [modalOpen]);

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

  const selectedCount = Object.keys(rowSelection).length;

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'select',
        header: ({ table }) => (
          <input
            type="checkbox"
            className="h-4 w-4 accent-[var(--accent)] cursor-pointer align-middle"
            checked={table.getIsAllRowsSelected()}
            ref={(el) => { if (el) el.indeterminate = table.getIsSomeRowsSelected(); }}
            onChange={table.getToggleAllRowsSelectedHandler()}
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            className="h-4 w-4 accent-[var(--accent)] cursor-pointer align-middle"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            onClick={(e) => e.stopPropagation()}
          />
        ),
      }),
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
      columnHelper.accessor('deckId', {
        header: 'Deck',
        enableSorting: false,
        cell: ({ getValue }) => {
          const deckId = getValue();
          if (!deckId) return <span className="text-[var(--muted-foreground)]">—</span>;
          const deck = decks.find((d) => d.id === deckId);
          if (!deck) return <span className="text-[var(--muted-foreground)]">—</span>;
          return (
            <Badge
              className="text-xs text-white"
              style={{ backgroundColor: deck.color }}
            >
              {deck.name}
            </Badge>
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
    [handleDelete, handleEdit, decks]
  );

  const table = useReactTable({
    data: tagFilteredCards,
    columns,
    state: { sorting, globalFilter, rowSelection },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: 'includesString',
  });

  const handleBulkDelete = useCallback(() => {
    const rows = table.getSelectedRowModel().rows;
    rows.forEach((row) => deleteCard(row.original.id));
    setRowSelection({});
    toast({ title: `Deleted ${rows.length} ${rows.length === 1 ? 'card' : 'cards'}`, variant: 'default' });
  }, [table, deleteCard, toast]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Dictionary</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            {allCards.length} {allCards.length === 1 ? 'word' : 'words'} saved
            <span className="ml-2 opacity-50">— start typing to search</span>
          </p>
        </div>
      </div>

      {/* Toolbar: search badge + tags + bulk delete */}
      {allCards.length > 0 && (
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5 flex-1">
            {!searchOpen && globalFilter && (
              <>
                <Badge
                  variant="secondary"
                  className="cursor-pointer gap-1.5 px-3 py-1"
                  onClick={() => { setGlobalFilter(''); }}
                >
                  <Search className="h-3 w-3" />
                  &quot;{globalFilter}&quot;
                  <X className="h-3 w-3 opacity-60 hover:opacity-100" />
                </Badge>
                <span className="text-xs text-[var(--muted-foreground)] mr-1">
                  {table.getFilteredRowModel().rows.length} results
                </span>
              </>
            )}
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
          <Button
            variant="outline"
            size="icon"
            onClick={handleBulkDelete}
            disabled={selectedCount === 0}
            title={selectedCount > 0 ? `Delete ${selectedCount} ${selectedCount === 1 ? 'word' : 'words'}` : 'Select words to delete'}
            className="text-[var(--muted-foreground)] hover:text-[var(--destructive)] shrink-0"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Command palette search */}
      <AnimatePresence>
        {searchOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-50 bg-black/50"
              onClick={() => { setSearchOpen(false); setGlobalFilter(''); }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.15 }}
              className="fixed left-1/2 top-[20%] z-50 w-full max-w-lg -translate-x-1/2 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl overflow-hidden"
            >
              <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)]">
                <Search className="h-5 w-5 text-[var(--muted-foreground)] shrink-0" />
                <Input
                  ref={searchRef}
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setSearchOpen(false);
                      setGlobalFilter('');
                    }
                    if (e.key === 'Enter') {
                      setSearchOpen(false);
                    }
                  }}
                  placeholder="Search words..."
                  className="border-0 shadow-none focus-visible:ring-0 h-8 px-0 text-base"
                  autoFocus
                />
                <button
                  onClick={() => { setSearchOpen(false); setGlobalFilter(''); }}
                  className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors shrink-0"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="px-4 py-2 text-xs text-[var(--muted-foreground)] flex items-center justify-between">
                <span>
                  {globalFilter
                    ? `${table.getFilteredRowModel().rows.length} of ${tagFilteredCards.length} words`
                    : `${tagFilteredCards.length} words total`}
                </span>
                <kbd className="px-1.5 py-0.5 rounded bg-[var(--muted)] text-[10px] font-mono">ESC</kbd>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

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
                    <TableHead
                      key={header.id}
                      style={header.id === 'actions' || header.id === 'select' ? { width: '1%', whiteSpace: 'nowrap' } : undefined}
                    >
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
                  <ContextMenu key={row.id}>
                    <ContextMenuTrigger asChild>
                      <TableRow
                        className="group cursor-pointer"
                        onClick={() => handleEdit(row.original)}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                      <ContextMenuItem onClick={() => handleEdit(row.original)}>
                        <Pencil className="h-4 w-4" />
                        Edit
                      </ContextMenuItem>
                      <ContextMenuSeparator />
                      <ContextMenuItem
                        onClick={() => { deleteCard(row.original.id); toast({ title: 'Card deleted', variant: 'default' }); }}
                        className="text-[var(--destructive)] focus:text-[var(--destructive)]"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
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
