import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { PlaylistListSort, SortOrder } from '/@/renderer/api/types';
import { PlaylistListFilter, SongListFilter } from '/@/renderer/store/list.store';
import { DataTableProps } from '/@/renderer/store/settings.store';
import { ListDisplayType, TableColumn, TablePagination } from '/@/renderer/types';
import { mergeOverridingColumns } from '/@/renderer/store/utils';

type TableProps = {
    pagination: TablePagination;
    scrollOffset: number;
} & DataTableProps;

type ListProps<T> = {
    display: ListDisplayType;
    filter: T;
    table: TableProps;
};

type DetailPaginationProps = TablePagination & {
    scrollOffset: number;
};

type DetailTableProps = DataTableProps & {
    id: {
        [key: string]: DetailPaginationProps & { filter: SongListFilter };
    };
};

type DetailProps = {
    display: ListDisplayType;
    table: DetailTableProps;
};

type ListGridProps = {
    itemsPerRow?: number;
    scrollOffset?: number;
};

interface PlaylistState {
    detail: DetailProps;
    grid: ListGridProps;
    list: ListProps<PlaylistListFilter>;
}

export interface PlaylistSlice extends PlaylistState {
    actions: {
        setDetailFilters: (id: string, data: Partial<SongListFilter>) => SongListFilter;
        setDetailTable: (data: Partial<DetailTableProps>) => void;
        setDetailTablePagination: (id: string, data: Partial<DetailPaginationProps>) => void;
        setFilters: (data: Partial<PlaylistListFilter>) => PlaylistListFilter;
        setGrid: (args: { data: Partial<ListGridProps> }) => void;
        setStore: (data: Partial<PlaylistSlice>) => void;
        setTable: (data: Partial<TableProps>) => void;
        setTablePagination: (args: { data: Partial<TablePagination> }) => void;
    };
}

export const usePlaylistStore = create<PlaylistSlice>()(
    persist(
        devtools(
            immer((set, get) => ({
                actions: {
                    setDetailFilters: (id, data) => {
                        set((state) => {
                            state.detail.table.id[id] = {
                                ...state.detail.table.id[id],
                                filter: {
                                    ...state.detail.table.id[id].filter,
                                    ...data,
                                },
                            };
                        });

                        return get().detail.table.id[id].filter;
                    },
                    setDetailTable: (data) => {
                        set((state) => {
                            state.detail.table = { ...state.detail.table, ...data };
                        });
                    },
                    setDetailTablePagination: (id, data) => {
                        set((state) => {
                            state.detail.table.id[id] = {
                                ...state.detail.table.id[id],
                                ...data,
                            };
                        });
                    },
                    setFilters: (data) => {
                        set((state) => {
                            state.list.filter = { ...state.list.filter, ...data };
                        });

                        return get().list.filter;
                    },
                    setGrid: (args) => {
                        set((state) => {
                            state.grid = {
                                ...state.grid,
                                ...args.data,
                            };
                        });
                    },
                    setStore: (data) => {
                        set({ ...get(), ...data });
                    },
                    setTable: (data) => {
                        set((state) => {
                            state.list.table = { ...state.list.table, ...data };
                        });
                    },
                    setTablePagination: (args) => {
                        set((state) => {
                            state.list.table.pagination = {
                                ...state.list.table.pagination,
                                ...args.data,
                            };
                        });
                    },
                },
                detail: {
                    display: ListDisplayType.TABLE,
                    table: {
                        autoFit: true,
                        columns: [
                            {
                                column: TableColumn.ROW_INDEX,
                                width: 50,
                            },
                            {
                                column: TableColumn.TITLE_COMBINED,
                                width: 500,
                            },
                            {
                                column: TableColumn.DURATION,
                                width: 100,
                            },
                            {
                                column: TableColumn.ALBUM,
                                width: 500,
                            },
                        ],
                        id: {},
                        rowHeight: 60,
                    },
                },
                grid: {
                    itemsPerRow: 5,
                    scrollOffset: 0,
                },
                list: {
                    display: ListDisplayType.TABLE,
                    filter: {
                        musicFolderId: undefined,
                        sortBy: PlaylistListSort.NAME,
                        sortOrder: SortOrder.ASC,
                    },
                    table: {
                        autoFit: true,
                        columns: [
                            {
                                column: TableColumn.ROW_INDEX,
                                width: 50,
                            },
                            {
                                column: TableColumn.TITLE,
                                width: 500,
                            },
                            {
                                column: TableColumn.SONG_COUNT,
                                width: 100,
                            },
                        ],
                        pagination: {
                            currentPage: 1,
                            itemsPerPage: 100,
                            totalItems: 1,
                            totalPages: 1,
                        },
                        rowHeight: 40,
                        scrollOffset: 0,
                    },
                },
            })),
            { name: 'store_playlist' },
        ),
        {
            merge: mergeOverridingColumns,
            name: 'store_playlist',
            version: 1,
        },
    ),
);

export const usePlaylistStoreActions = () => usePlaylistStore((state) => state.actions);

export const useSetPlaylistStore = () => usePlaylistStore((state) => state.actions.setStore);

export const useSetPlaylistFilters = () => usePlaylistStore((state) => state.actions.setFilters);

export const usePlaylistFilters = () => {
    return usePlaylistStore((state) => [state.list.filter, state.actions.setFilters]);
};

export const usePlaylistGridStore = () => usePlaylistStore((state) => state.grid);

export const usePlaylistListStore = () => usePlaylistStore((state) => state.list);

export const usePlaylistTablePagination = () =>
    usePlaylistStore((state) => state.list.table.pagination);

export const useSetPlaylistTablePagination = () =>
    usePlaylistStore((state) => state.actions.setTablePagination);

export const useSetPlaylistTable = () => usePlaylistStore((state) => state.actions.setTable);

export const usePlaylistDetailStore = () => usePlaylistStore((state) => state.detail);

export const usePlaylistDetailTablePagination = (id: string) =>
    usePlaylistStore((state) => state.detail.table.id[id]);

export const useSetPlaylistDetailTablePagination = () =>
    usePlaylistStore((state) => state.actions.setDetailTablePagination);

export const useSetPlaylistDetailTable = () =>
    usePlaylistStore((state) => state.actions.setDetailTable);

export const useSetPlaylistDetailFilters = () =>
    usePlaylistStore((state) => state.actions.setDetailFilters);
