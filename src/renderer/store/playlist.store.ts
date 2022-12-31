import merge from 'lodash/merge';
import create from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { PlaylistListArgs, PlaylistListSort, SortOrder } from '/@/renderer/api/types';
import { DataTableProps } from '/@/renderer/store/settings.store';
import { ListDisplayType, TableColumn, TablePagination } from '/@/renderer/types';

type TableProps = {
  pagination: TablePagination;
  scrollOffset: number;
} & DataTableProps;

type ListProps<T> = {
  display: ListDisplayType;
  filter: T;
  table: TableProps;
};

export type PlaylistListFilter = Omit<PlaylistListArgs['query'], 'startIndex' | 'limit'>;

interface PlaylistState {
  list: ListProps<PlaylistListFilter>;
}

export interface PlaylistSlice extends PlaylistState {
  actions: {
    setFilters: (data: Partial<PlaylistListFilter>) => PlaylistListFilter;
    setStore: (data: Partial<PlaylistSlice>) => void;
    setTable: (data: Partial<TableProps>) => void;
    setTablePagination: (data: Partial<TableProps['pagination']>) => void;
  };
}

export const usePlaylistStore = create<PlaylistSlice>()(
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
              state.list.table.pagination = { ...state.list.table.pagination, ...data };
            });
          },
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
      merge: (persistedState, currentState) => {
        return merge(currentState, persistedState);
      },
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

export const usePlaylistListStore = () => usePlaylistStore((state) => state.list);

export const usePlaylistTablePagination = () =>
  usePlaylistStore((state) => state.list.table.pagination);

export const useSetPlaylistTablePagination = () =>
  usePlaylistStore((state) => state.actions.setTablePagination);

export const useSetPlaylistTable = () => usePlaylistStore((state) => state.actions.setTable);
