import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { createWithEqualityFn } from 'zustand/traditional';

import { DataTableProps } from '/@/renderer/store/settings.store';
import { mergeOverridingColumns } from '/@/renderer/store/utils';
import { AlbumArtistListArgs, AlbumArtistListSort, SortOrder } from '/@/shared/types/domain-types';
import { ListDisplayType, TableColumn, TablePagination } from '/@/shared/types/types';

export type AlbumArtistListFilter = Omit<AlbumArtistListArgs['query'], 'limit' | 'startIndex'>;

export interface AlbumArtistSlice extends AlbumArtistState {
    actions: {
        setFilters: (data: Partial<AlbumArtistListFilter>) => AlbumArtistListFilter;
        setStore: (data: Partial<AlbumArtistSlice>) => void;
        setTable: (data: Partial<TableProps>) => void;
        setTablePagination: (data: Partial<TableProps['pagination']>) => void;
    };
}

export interface AlbumArtistState {
    list: ListProps<AlbumArtistListFilter>;
}

type ListProps<T> = {
    display: ListDisplayType;
    filter: T;
    grid: {
        scrollOffset: number;
        size: number;
    };
    table: TableProps;
};

type TableProps = DataTableProps & {
    pagination: TablePagination;
    scrollOffset: number;
};

export const useAlbumArtistStore = createWithEqualityFn<AlbumArtistSlice>()(
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
