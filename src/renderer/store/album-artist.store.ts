import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { AlbumArtistListArgs, AlbumArtistListSort, SortOrder } from '/@/renderer/api/types';
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
    grid: {
        scrollOffset: number;
        size: number;
    };
    table: TableProps;
};

export type AlbumArtistListFilter = Omit<AlbumArtistListArgs['query'], 'startIndex' | 'limit'>;

export interface AlbumArtistState {
    list: ListProps<AlbumArtistListFilter>;
}

export interface AlbumArtistSlice extends AlbumArtistState {
    actions: {
        setFilters: (data: Partial<AlbumArtistListFilter>) => AlbumArtistListFilter;
        setStore: (data: Partial<AlbumArtistSlice>) => void;
        setTable: (data: Partial<TableProps>) => void;
        setTablePagination: (data: Partial<TableProps['pagination']>) => void;
    };
}

export const useAlbumArtistStore = create<AlbumArtistSlice>()(
    persist(
        devtools(
            immer((set, get) => ({
                actions: {
                    setFilters: (data) => {
                        set((state) => {
                            state.list.filter = { ...state.list.filter, ...data };
                        });

                        return get().list.filter;
                    },
                    setStore: (data) => {
                        set({ ...get(), ...data });
                    },
                    setTable: (data) => {
                        set((state) => {
                            state.list.table = { ...state.list.table, ...data };
                        });
                    },
                    setTablePagination: (data) => {
                        set((state) => {
                            state.list.table.pagination = {
                                ...state.list.table.pagination,
                                ...data,
                            };
                        });
                    },
                },
                list: {
                    display: ListDisplayType.TABLE,
                    filter: {
                        musicFolderId: undefined,
                        sortBy: AlbumArtistListSort.NAME,
                        sortOrder: SortOrder.ASC,
                    },
                    grid: {
                        scrollOffset: 0,
                        size: 50,
                    },
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
                        ],
                        pagination: {
                            currentPage: 1,
                            itemsPerPage: 100,
                            totalItems: 1,
                            totalPages: 1,
                        },
                        rowHeight: 60,
                        scrollOffset: 0,
                    },
                },
            })),
            { name: 'store_album_artist' },
        ),
        {
            merge: mergeOverridingColumns,
            name: 'store_album_artist',
            version: 1,
        },
    ),
);

export const useAlbumArtistStoreActions = () => useAlbumArtistStore((state) => state.actions);

export const useSetAlbumArtistStore = () => useAlbumArtistStore((state) => state.actions.setStore);

export const useSetAlbumArtistFilters = () =>
    useAlbumArtistStore((state) => state.actions.setFilters);

export const useAlbumArtistListStore = () => useAlbumArtistStore((state) => state.list);

export const useAlbumArtistTablePagination = () =>
    useAlbumArtistStore((state) => state.list.table.pagination);

export const useSetAlbumArtistTablePagination = () =>
    useAlbumArtistStore((state) => state.actions.setTablePagination);

export const useSetAlbumArtistTable = () => useAlbumArtistStore((state) => state.actions.setTable);
