'use client';

import {useState, useMemo, useCallback} from 'react';
import {useRouter} from 'next/navigation';
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
import {ArrowUpDown, ArrowUp, ArrowDown, BookOpen, Trash2, Pencil, Plus, Layers, Check, ChevronDown, Volume2} from 'lucide-react';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {SearchPalette} from '@/components/search/SearchPalette';
import {
    ContextMenu,
    ContextMenuTrigger,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator
} from '@/components/ui/context-menu';
import {DeckFilterDropdown} from '@/components/ui/deck-filter-dropdown';
import {CreateCardModal} from '@/components/cards/CreateCardModal';
import {useCards} from '@/hooks/useCards';
import {useSpeech} from '@/hooks/useSpeech';
import {useCardStore} from '@/store/useCardStore';
import {useToast} from '@/components/ui/toast';
import type {VocabularyCard} from '@/types/card';

const columnHelper = createColumnHelper<VocabularyCard>();

function SortHeader({label, column}: { label: string; column: Column<VocabularyCard> }) {
    const sorted = column.getIsSorted();
    return (
        <button
            className="flex items-center gap-1.5 font-medium hover:text-[var(--foreground)] transition-colors"
            onClick={column.getToggleSortingHandler()}
        >
            {label}
            {sorted === 'asc' ? (
                <ArrowUp className="h-3.5 w-3.5"/>
            ) : sorted === 'desc' ? (
                <ArrowDown className="h-3.5 w-3.5"/>
            ) : (
                <ArrowUpDown className="h-3.5 w-3.5 opacity-40"/>
            )}
        </button>
    );
}

export function DictionaryTable() {
    const {allCards, deleteCard} = useCards();
    const {speak} = useSpeech();
    const decks = useCardStore((s) => s.decks);
    const {toast} = useToast();
    const router = useRouter();

    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [activeTags, setActiveTags] = useState<string[]>([]);
    const [activeDeckIds, setActiveDeckIds] = useState<Set<string>>(new Set());
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
    const [modalOpen, setModalOpen] = useState(false);
    const [editCard, setEditCard] = useState<VocabularyCard | undefined>();

    const allTags = useMemo(
        () => [...new Set(allCards.flatMap((c) => c.tags ?? []))].sort(),
        [allCards]
    );

    const activeDeckIdsList = useMemo(() => [...activeDeckIds], [activeDeckIds]);

    const toggleDeckFilter = useCallback((id: string) => {
        setActiveDeckIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    }, []);

    const filteredCards = useMemo(() => {
        let cards = allCards;
        if (activeDeckIds.size > 0) {
            cards = cards.filter((c) =>
                activeDeckIds.has('none') ? !c.deckId : c.deckId != null && activeDeckIds.has(c.deckId)
            );
            // If both "none" and specific decks selected, include both
            if (activeDeckIds.has('none') && activeDeckIds.size > 1) {
                cards = allCards.filter((c) =>
                    !c.deckId || (c.deckId != null && activeDeckIds.has(c.deckId))
                );
            }
        }
        if (activeTags.length > 0) {
            cards = cards.filter((card) => activeTags.every((tag) => card.tags?.includes(tag)));
        }
        return cards;
    }, [allCards, activeTags, activeDeckIds]);

    const handleDelete = useCallback(
        (id: string, e: React.MouseEvent) => {
            e.stopPropagation();
            deleteCard(id);
            toast({title: 'Card deleted', variant: 'default'});
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
                header: ({table}) => (
                    <input
                        type="checkbox"
                        className="h-4 w-4 accent-[var(--accent)] cursor-pointer align-middle"
                        checked={table.getIsAllRowsSelected()}
                        ref={(el) => {
                            if (el) el.indeterminate = table.getIsSomeRowsSelected();
                        }}
                        onChange={table.getToggleAllRowsSelectedHandler()}
                    />
                ),
                cell: ({row}) => (
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
                header: ({column}) => <SortHeader label="Word" column={column}/>,
                cell: ({row}) => (
                    <div className="flex items-center gap-2">
                        <div>
                            <span className="font-medium text-[var(--foreground)]">{row.original.word}</span>
                            {row.original.transcription && (
                                <span className="block text-xs text-[var(--muted-foreground)] mt-0.5">
                                    {row.original.transcription}
                                </span>
                            )}
                        </div>
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={(e) => { e.stopPropagation(); speak(row.original.word); }}
                            title="Pronounce"
                            className="shrink-0 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                        >
                            <Volume2 className="h-3.5 w-3.5"/>
                        </Button>
                    </div>
                ),
            }),
            columnHelper.accessor('translation', {
                header: ({column}) => <SortHeader label="Translation" column={column}/>,
                cell: ({getValue}) => (
                    <span className="text-[var(--foreground)]">{getValue()}</span>
                ),
            }),
            columnHelper.accessor('partOfSpeech', {
                header: 'Part of Speech',
                enableSorting: false,
                cell: ({getValue}) => {
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
                cell: ({getValue}) => {
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
                cell: ({getValue}) => {
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
                cell: ({getValue}) => {
                    const deckId = getValue();
                    if (!deckId) return <span className="text-[var(--muted-foreground)]">—</span>;
                    const deck = decks.find((d) => d.id === deckId);
                    if (!deck) return <span className="text-[var(--muted-foreground)]">—</span>;
                    return (
                        <Badge
                            className="text-xs text-white cursor-pointer hover:opacity-80 transition-opacity"
                            style={{backgroundColor: deck.color}}
                            onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/decks/${deckId}`);
                            }}
                        >
                            {deck.name}
                        </Badge>
                    );
                },
            }),
            columnHelper.accessor('createdAt', {
                header: ({column}) => <SortHeader label="Added" column={column}/>,
                cell: ({getValue}) => (
                    <span className="text-sm text-[var(--muted-foreground)] whitespace-nowrap">
            {new Date(getValue()).toLocaleDateString()}
          </span>
                ),
            }),
            columnHelper.display({
                id: 'actions',
                header: '',
                cell: ({row}) => (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={(e) => handleEdit(row.original, e)}
                            title="Edit"
                        >
                            <Pencil className="h-3.5 w-3.5"/>
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={(e) => handleDelete(row.original.id, e)}
                            title="Delete"
                            className="text-[var(--destructive)] hover:text-[var(--destructive)]"
                        >
                            <Trash2 className="h-3.5 w-3.5"/>
                        </Button>
                    </div>
                ),
            }),
        ],
        [handleDelete, handleEdit, decks, router]
    );

    const table = useReactTable({
        data: filteredCards,
        columns,
        state: {sorting, globalFilter, rowSelection},
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
        toast({title: `Deleted ${rows.length} ${rows.length === 1 ? 'card' : 'cards'}`, variant: 'default'});
    }, [table, deleteCard, toast]);

    return (
        <div className="flex flex-col gap-6 h-[calc(100vh-12rem)]">
            {/* Toolbar */}
            {allCards.length > 0 && (
                <div className="flex items-center justify-between gap-4">
                    <p className="text-sm text-[var(--muted-foreground)]">
                        {allCards.length} {allCards.length === 1 ? 'word' : 'words'} saved
                        <span className="ml-2 opacity-50">— start typing to search</span>
                    </p>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handleBulkDelete}
                        disabled={selectedCount === 0}
                        title={selectedCount > 0 ? `Delete ${selectedCount} ${selectedCount === 1 ? 'word' : 'words'}` : 'Select words to delete'}
                        className="text-[var(--muted-foreground)] hover:text-[var(--destructive)] shrink-0"
                    >
                        <Trash2 className="h-4 w-4"/>
                    </Button>
                </div>
            )}

            {/* Deck filter + Tags + search */}
            {allCards.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                    <SearchPalette
                        value={globalFilter}
                        onChange={setGlobalFilter}
                        totalCount={filteredCards.length}
                        filteredCount={table.getFilteredRowModel().rows.length}
                        disabled={modalOpen}
                    />
                    {decks.length > 0 && (
                        <DeckFilterDropdown
                            decks={decks}
                            selectedIds={activeDeckIdsList}
                            onToggle={toggleDeckFilter}
                        />
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
                    {(activeTags.length > 0 || activeDeckIds.size > 0) && (
                        <Badge
                            variant="outline"
                            onClick={() => { setActiveTags([]); setActiveDeckIds(new Set()); }}
                            className="cursor-pointer opacity-60 hover:opacity-100"
                        >
                            × clear
                        </Badge>
                    )}
                </div>
            )}

            {/* Table / Empty state */}
            {allCards.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
                    <BookOpen className="h-12 w-12 text-[var(--muted-foreground)] opacity-30"/>
                    <div>
                        <p className="font-semibold text-[var(--foreground)]">No words yet</p>
                        <p className="text-sm text-[var(--muted-foreground)] mt-1">
                            Search for a word on the Explore page and save it, or create a card manually.
                        </p>
                    </div>
                    <Button onClick={() => setModalOpen(true)} variant="outline" className="gap-2">
                        <Plus className="h-4 w-4"/> Add your first word
                    </Button>
                </div>
            ) : (
                <div className="rounded-lg border border-[var(--border)] overflow-auto flex-1 min-h-0">
                    <Table>
                        <TableHeader>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow
                                    key={headerGroup.id}
                                    className="hover:bg-transparent border-b border-[var(--border)] bg-[var(--muted)] sticky top-0 z-10"
                                >
                                    {headerGroup.headers.map((header) => (
                                        <TableHead
                                            key={header.id}
                                            style={header.id === 'actions' || header.id === 'select' ? {
                                                width: '1%',
                                                whiteSpace: 'nowrap'
                                            } : undefined}
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
                                                data-state={row.getIsSelected() ? 'selected' : undefined}
                                                onClick={() => row.toggleSelected()}
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
                                                <Pencil className="h-4 w-4"/>
                                                Edit
                                            </ContextMenuItem>
                                            <ContextMenuSeparator/>
                                            <ContextMenuItem
                                                onClick={() => {
                                                    deleteCard(row.original.id);
                                                    toast({title: 'Card deleted', variant: 'default'});
                                                }}
                                                className="text-[var(--destructive)] focus:text-[var(--destructive)]"
                                            >
                                                <Trash2 className="h-4 w-4"/>
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

            <CreateCardModal open={modalOpen} onOpenChange={handleModalClose} editCard={editCard}/>
        </div>
    );
}
