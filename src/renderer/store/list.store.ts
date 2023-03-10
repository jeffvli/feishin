import merge from 'lodash/merge';
import create from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import shallow from 'zustand/shallow';
import {
  AlbumArtistListArgs,
  AlbumArtistListSort,
  AlbumListArgs,
  AlbumListSort,
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

export type ListKey = keyof ListState['item'] | string;

type FilterType = AlbumListFilter | SongListFilter | AlbumArtistListFilter;

type ListTableProps = {
  pagination: TablePagination;
  scrollOffset: number;
} & DataTableProps;

type ListGridProps = {
  scrollOffset?: number;
  size?: number;
};

type ItemProps<TFilter = any> = {
  display: ListDisplayType;
  filter: TFilter;
  grid?: ListGridProps;
  table: ListTableProps;
};

export interface ListState {
  detail: {
    [key: string]: Omit<ItemProps<any>, 'display'>;
  };
  item: {
    album: ItemProps<AlbumListFilter>;
    albumArtist: ItemProps<AlbumArtistListFilter>;
    albumDetail: ItemProps<any>;
    song: ItemProps<SongListFilter>;
  };
}

type DeterministicArgs = { key: ListKey };

export interface ListSlice extends ListState {
  _actions: {
    getFilter: (args: { id?: string; key?: string }) => FilterType;
    resetFilter: () => void;
    setDisplayType: (args: { data: ListDisplayType } & DeterministicArgs) => void;
    setFilter: (args: { data: Partial<FilterType> } & DeterministicArgs) => FilterType;
    setGrid: (args: { data: Partial<ListGridProps> } & DeterministicArgs) => void;
    setStore: (data: Partial<ListSlice>) => void;
    setTable: (args: { data: Partial<ListTableProps> } & DeterministicArgs) => void;
    setTableColumns: (args: { data: PersistedTableColumn[] } & DeterministicArgs) => void;
    setTablePagination: (args: { data: Partial<TablePagination> } & DeterministicArgs) => void;
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
                jfParams: {
                  ...state.detail[args.key]?.filter.jfParams,
                  includeItemTypes: 'Audio',
                },
                ndParams: {
                  ...state.detail[args.key]?.filter.ndParams,
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

            return get()._actions.getFilter({ id, key: args.key });
          },
          setGrid: (args) => {
            const [page, id] = args.key.split('_');

            set((state) => {
              if (id) {
                if (!state.detail[args.key]) {
                  state.detail[args.key] = {
                    filter: {} as FilterType,
                    grid: {
                      scrollOffset: 0,
                      size: state.item[page as keyof ListState['item']].grid?.size || 200,
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
                      jfParams: {},
                      ndParams: {},
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
              state.item[args.key as keyof ListState['item']].table.columns = {
                ...state.item[args.key as keyof ListState['item']].table.columns,
                ...args.data,
              };
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

                state.detail[args.key as keyof ListState['item']].table.pagination = {
                  ...state.detail[args.key as keyof ListState['item']].table.pagination,
                  ...args.data,
                };
              } else {
                state.item[args.key as keyof ListState['item']].table.pagination = {
                  ...state.item[args.key as keyof ListState['item']].table.pagination,
                  ...args.data,
                };
              }
            });
          },
        },
        detail: {},
        item: {
          album: {
            display: ListDisplayType.CARD,
            filter: {
              sortBy: AlbumListSort.RECENTLY_ADDED,
              sortOrder: SortOrder.DESC,
            },
            grid: { scrollOffset: 0, size: 200 },
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
            display: ListDisplayType.CARD,
            filter: {
              sortBy: AlbumArtistListSort.NAME,
              sortOrder: SortOrder.DESC,
            },
            grid: { scrollOffset: 0, size: 200 },
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
            display: ListDisplayType.CARD,
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
            display: ListDisplayType.CARD,
            filter: {
              sortBy: SongListSort.RECENTLY_ADDED,
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
                  column: TableColumn.TITLE_COMBINED,
                  width: 500,
                },
                {
                  column: TableColumn.DURATION,
                  width: 100,
                },
                {
                  column: TableColumn.ALBUM,
                  width: 300,
                },
                {
                  column: TableColumn.ARTIST,
                  width: 100,
                },
                {
                  column: TableColumn.YEAR,
                  width: 100,
                },
                {
                  column: TableColumn.DATE_ADDED,
                  width: 100,
                },
                {
                  column: TableColumn.PLAY_COUNT,
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
      version: 1,
    },
  ),
);

export const useListStoreActions = () => useListStore((state) => state._actions);

export const useAlbumListStore = (args?: { id?: string; key?: string }) =>
  useListStore((state) => {
    const detail = args?.key ? state.detail[args.key] : undefined;

    return {
      ...state.item.album,
      filter: {
        ...state.item.album.filter,
        ...detail?.filter,
      },
      grid: {
        ...state.item.album.grid,
        ...detail?.grid,
      },
      table: {
        ...state.item.album.table,
        ...detail?.table,
      },
    };
  }, shallow);

export const useAlbumArtistListStore = () =>
  useListStore((state) => state.item.albumArtist, shallow);

export const useSongListStore = (args?: { id?: string; key?: string }) =>
  useListStore((state) => {
    const detail = args?.key ? state.detail[args.key] : undefined;

    return {
      ...state.item.song,
      filter: {
        ...state.item.song.filter,
        ...detail?.filter,
      },
      grid: {
        ...state.item.song.grid,
        ...detail?.grid,
      },
      table: {
        ...state.item.song.table,
        ...detail?.table,
      },
    };
  }, shallow);

export const useSongListFilter = (args: { id?: string; key?: string }) =>
  useListStore((state) => {
    return state._actions.getFilter({ id: args.id, key: args.key }) as SongListFilter;
  }, shallow);

export const useAlbumListFilter = (args: { id?: string; key?: string }) =>
  useListStore((state) => {
    return state._actions.getFilter({ id: args.id, key: args.key }) as AlbumListFilter;
  }, shallow);

export const useAlbumArtistListFilter = (args: { id?: string; key?: string }) =>
  useListStore((state) => {
    return state._actions.getFilter({ id: args.id, key: args.key }) as AlbumArtistListFilter;
  }, shallow);

export const useListDetail = (key: string) => useListStore((state) => state.detail[key], shallow);
