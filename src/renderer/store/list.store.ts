import merge from 'lodash/merge';
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { shallow } from 'zustand/shallow';
import {
    AlbumArtistListArgs,
    AlbumArtistListSort,
    AlbumListArgs,
    AlbumListSort,
    LibraryItem,
    PlaylistListArgs,
    PlaylistListSort,
    SongListArgs,
    SongListSort,
    SortOrder,
} from '/@/renderer/api/types';
import { DataTableProps, PersistedTableColumn } from '/@/renderer/store/settings.store';
import { ListDisplayType, TableColumn, TablePagination } from '/@/renderer/types';

export const generatePageKey = (page: string, id?: string) => {
    return id ? `${page}_${id}` : page;
};

export type AlbumListFilter = Omit<AlbumListArgs['query'], 'startIndex' | 'limit'>;
export type SongListFilter = Omit<SongListArgs['query'], 'startIndex' | 'limit'>;
export type AlbumArtistListFilter = Omit<AlbumArtistListArgs['query'], 'startIndex' | 'limit'>;
export type PlaylistListFilter = Omit<PlaylistListArgs['query'], 'startIndex' | 'limit'>;

export type ListKey = keyof ListState['item'] | string;

type FilterType = AlbumListFilter | SongListFilter | AlbumArtistListFilter | PlaylistListFilter;

export type ListTableProps = {
    pagination: TablePagination;
    scrollOffset: number;
} & DataTableProps;

export type ListGridProps = {
    itemsPerRow?: number;
    scrollOffset?: number;
};

export type ListItemProps<TFilter = any> = {
    display: ListDisplayType;
    filter: TFilter;
    grid?: ListGridProps;
    table: ListTableProps;
};

export interface ListState {
    detail: {
        [key: string]: Omit<ListItemProps<any>, 'display'>;
    };
    item: {
        album: ListItemProps<AlbumListFilter>;
        albumArtist: ListItemProps<AlbumArtistListFilter>;
        albumArtistAlbum: ListItemProps<AlbumListFilter>;
        albumArtistSong: ListItemProps<SongListFilter>;
        albumDetail: ListItemProps<any>;
        playlist: ListItemProps<PlaylistListFilter>;
        song: ListItemProps<SongListFilter>;
    };
}

export type ListDeterministicArgs = { key: ListKey };

export interface ListSlice extends ListState {
    _actions: {
        getFilter: (args: {
            customFilters?: Record<any, any>;
            id?: string;
            itemType: LibraryItem;
            key?: string;
        }) => FilterType;
        resetFilter: () => void;
        setDisplayType: (args: { data: ListDisplayType } & ListDeterministicArgs) => void;
        setFilter: (
            args: {
                customFilters?: Record<any, any>;
                data: Partial<FilterType>;
                itemType: LibraryItem;
            } & ListDeterministicArgs,
        ) => FilterType;
        setGrid: (args: { data: Partial<ListGridProps> } & ListDeterministicArgs) => void;
        setStore: (data: Partial<ListSlice>) => void;
        setTable: (args: { data: Partial<ListTableProps> } & ListDeterministicArgs) => void;
        setTableColumns: (args: { data: PersistedTableColumn[] } & ListDeterministicArgs) => void;
        setTablePagination: (
            args: { data: Partial<TablePagination> } & ListDeterministicArgs,
        ) => void;
    };
}

export const useListStore = create<ListSlice>()(
    persist(
        devtools(
            immer((set, get) => ({
                _actions: {
                    getFilter: (args) => {
                        const state = get();

                        if (args.id && args.key) {
                            return {
                                artistIds: [args.id],
                                ...state.item.song.filter,
                                ...state.detail[args.key]?.filter,
                                _custom: {
                                    ...state.detail[args.key]?.filter?._custom,
                                    jellyfin: {
                                        ...state.detail[args.key]?.filter?._custom?.jellyfin,
                                        includeItemTypes:
                                            args?.itemType === LibraryItem.ALBUM
                                                ? 'MusicAlbum'
                                                : 'Audio',
                                    },
                                    navidrome: {
                                        ...state.detail[args.key]?.filter?._custom?.navidrome,
                                    },
                                },
                            };
                        }

                        if (args.key) {
                            return state.item[args.key as keyof ListState['item']].filter;
                        }

                        return state.item.song.filter;
                    },
                    resetFilter: () => {
                        set((state) => {
                            state.item.album.filter = {
                                musicFolderId: undefined,
                                sortBy: AlbumListSort.RECENTLY_ADDED,
                                sortOrder: SortOrder.DESC,
                            } as AlbumListFilter;

                            state.item.song.filter = {
                                musicFolderId: undefined,
                                sortBy: SongListSort.RECENTLY_ADDED,
                                sortOrder: SortOrder.DESC,
                            } as SongListFilter;
                        });
                    },
                    setDisplayType: (args) => {
                        set((state) => {
                            const [page] = args.key.split('_');
                            state.item[page as keyof ListState['item']].display = args.data;
                        });
                    },
                    setFilter: (args) => {
                        const [, id] = args.key.split('_');

                        set((state) => {
                            if (id) {
                                if (!state.detail[args.key]) {
                                    state.detail[args.key] = {
                                        filter: {} as FilterType,
                                        table: {
                                            pagination: {
                                                currentPage: 1,
                                                itemsPerPage: 100,
                                                totalItems: 0,
                                                totalPages: 0,
                                            },
                                        } as ListTableProps,
                                    };
                                }

                                state.detail[args.key].filter = {
                                    ...state.detail[args.key as keyof ListState['item']].filter,
                                    ...args.data,
                                } as FilterType;
                            } else {
                                state.item[args.key as keyof ListState['item']].filter = {
                                    ...state.item[args.key as keyof ListState['item']].filter,
                                    ...args.data,
                                } as FilterType;
                            }
                        });

                        return {
                            ...get()._actions.getFilter({
                                id,
                                itemType: args.itemType,
                                key: args.key,
                            }),
                            ...args.customFilters,
                        };
                    },
                    setGrid: (args) => {
                        const [page, id] = args.key.split('_');

                        set((state) => {
                            if (id) {
                                if (!state.detail[args.key]) {
                                    state.detail[args.key] = {
                                        filter: {} as FilterType,
                                        grid: {
                                            itemsPerRow:
                                                state.item[page as keyof ListState['item']].grid
                                                    ?.itemsPerRow || 5,
                                            scrollOffset: 0,
                                        },
                                        table: {
                                            pagination: {
                                                currentPage: 1,
                                                itemsPerPage: 100,
                                                totalItems: 0,
                                                totalPages: 0,
                                            },
                                        } as ListTableProps,
                                    };
                                }

                                if (state.detail[args.key as keyof ListState['item']].grid) {
                                    state.detail[args.key as keyof ListState['item']].grid = {
                                        ...state.detail[args.key as keyof ListState['item']]?.grid,
                                        ...args.data,
                                    };
                                }
                            } else if (state.item[page as keyof ListState['item']].grid) {
                                state.item[page as keyof ListState['item']].grid = {
                                    ...state.item[page as keyof ListState['item']]?.grid,
                                    ...args.data,
                                };
                            }
                        });
                    },
                    setStore: (data) => {
                        set({ ...get(), ...data });
                    },
                    setTable: (args) => {
                        set((state) => {
                            const [page, id] = args.key.split('_');

                            if (id) {
                                if (!state.detail[args.key]) {
                                    state.detail[args.key] = {
                                        filter: {
                                            ...state.item[page as keyof ListState['item']].filter,
                                        } as FilterType,
                                        table: {
                                            pagination: {
                                                currentPage: 1,
                                                itemsPerPage: 100,
                                                totalItems: 0,
                                                totalPages: 0,
                                            },
                                            scrollOffset: 0,
                                        } as ListTableProps,
                                    };
                                }

                                if (state.detail[args.key as keyof ListState['item']].table) {
                                    state.detail[args.key as keyof ListState['item']].table = {
                                        ...state.detail[args.key as keyof ListState['item']]?.table,
                                        ...args.data,
                                    };
                                }
                            } else {
                                state.item[page as keyof ListState['item']].table = {
                                    ...state.item[page as keyof ListState['item']].table,
                                    ...args.data,
                                };
                            }
                        });
                    },
                    setTableColumns: (args) => {
                        set((state) => {
                            state.item[args.key as keyof ListState['item']].table.columns = [
                                ...state.item[args.key as keyof ListState['item']].table.columns,
                                ...args.data,
                            ];
                        });
                    },
                    setTablePagination: (args) => {
                        set((state) => {
                            const [, id] = args.key.split('_');

                            if (id) {
                                if (!state.detail[args.key]) {
                                    state.detail[args.key] = {
                                        filter: {} as FilterType,
                                        table: {
                                            pagination: {
                                                currentPage: 1,
                                                itemsPerPage: 100,
                                                totalItems: 0,
                                                totalPages: 0,
                                            },
                                        } as ListTableProps,
                                    };
                                }

                                state.detail[args.key as keyof ListState['item']].table.pagination =
                                    {
                                        ...state.detail[args.key as keyof ListState['item']].table
                                            .pagination,
                                        ...args.data,
                                    };
                            } else {
                                state.item[args.key as keyof ListState['item']].table.pagination = {
                                    ...state.item[args.key as keyof ListState['item']].table
                                        .pagination,
                                    ...args.data,
                                };
                            }
                        });
                    },
                },
                detail: {},
                item: {
                    album: {
                        display: ListDisplayType.POSTER,
                        filter: {
                            sortBy: AlbumListSort.RECENTLY_ADDED,
                            sortOrder: SortOrder.DESC,
                        },
                        grid: { itemsPerRow: 5, scrollOffset: 0 },
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
                                    column: TableColumn.ALBUM_ARTIST,
                                    width: 300,
                                },
                                {
                                    column: TableColumn.YEAR,
                                    width: 100,
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
                    albumArtist: {
                        display: ListDisplayType.POSTER,
                        filter: {
                            sortBy: AlbumArtistListSort.NAME,
                            sortOrder: SortOrder.DESC,
                        },
                        grid: { itemsPerRow: 5, scrollOffset: 0 },
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
                    albumArtistAlbum: {
                        display: ListDisplayType.POSTER,
                        filter: {
                            sortBy: AlbumListSort.RECENTLY_ADDED,
                            sortOrder: SortOrder.DESC,
                        },
                        grid: { itemsPerRow: 5, scrollOffset: 0 },
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
                                    column: TableColumn.ALBUM_ARTIST,
                                    width: 300,
                                },
                                {
                                    column: TableColumn.YEAR,
                                    width: 100,
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
                    albumArtistSong: {
                        display: ListDisplayType.TABLE,
                        filter: {
                            sortBy: SongListSort.RECENTLY_ADDED,
                            sortOrder: SortOrder.DESC,
                        },
                        grid: { itemsPerRow: 5, scrollOffset: 0 },
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
                                    column: TableColumn.ALBUM,
                                    width: 300,
                                },
                                {
                                    column: TableColumn.DURATION,
                                    width: 100,
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
                    albumDetail: {
                        display: ListDisplayType.TABLE,
                        filter: {
                            sortBy: SongListSort.ALBUM,
                            sortOrder: SortOrder.ASC,
                        },
                        table: {
                            autoFit: true,
                            columns: [],
                            followCurrentSong: false,
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
                    playlist: {
                        display: ListDisplayType.POSTER,
                        filter: {
                            sortBy: PlaylistListSort.NAME,
                            sortOrder: SortOrder.DESC,
                        },
                        grid: { scrollOffset: 0, size: 0 },
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
                            rowHeight: 60,
                            scrollOffset: 0,
                        },
                    },
                    song: {
                        display: ListDisplayType.TABLE,
                        filter: {
                            sortBy: SongListSort.RECENTLY_ADDED,
                            sortOrder: SortOrder.DESC,
                        },
                        grid: { itemsPerRow: 5, scrollOffset: 0 },
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
                                    column: TableColumn.ALBUM,
                                    width: 300,
                                },
                                {
                                    column: TableColumn.DURATION,
                                    width: 100,
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
                },
            })),
            { name: 'store_list' },
        ),
        {
            merge: (persistedState, currentState) => {
                return merge(currentState, persistedState);
            },
            name: 'store_list',
            partialize: (state) => {
                return Object.fromEntries(
                    Object.entries(state).filter(([key]) => !['detail'].includes(key)),
                );
            },
            version: 2,
        },
    ),
);

export const useListStoreActions = () => useListStore((state) => state._actions);

export const useListStoreByKey = <TFilter>(args: { filter?: Partial<TFilter>; key: string }) => {
    const key = args.key as keyof ListState['item'];
    return useListStore(
        (state) => ({
            ...state.item[key],
            filter: {
                ...state.item[key].filter,
                ...args.filter,
            },
        }),
        shallow,
    );
};

export const useListFilterByKey = <TFilter>(args: { filter?: Partial<TFilter>; key: string }) => {
    const key = args.key as keyof ListState['item'];
    return useListStore(
        (state) => ({
            ...state.item[key].filter,
            ...args.filter,
        }),
        shallow,
    );
};

export const useAlbumListFilter = (args: { id?: string; key?: string }) =>
    useListStore((state) => {
        return state._actions.getFilter({
            id: args.id,
            itemType: LibraryItem.ALBUM,
            key: args.key,
        }) as AlbumListFilter;
    }, shallow);

export const useListDetail = (key: string) => useListStore((state) => state.detail[key], shallow);
