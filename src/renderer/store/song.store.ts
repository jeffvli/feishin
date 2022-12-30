import merge from 'lodash/merge';
import create from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { SongListArgs, SongListSort, SortOrder } from '/@/renderer/api/types';
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

export type SongListFilter = Omit<SongListArgs['query'], 'startIndex' | 'limit'>;

interface SongState {
  list: ListProps<SongListFilter>;
}

export interface SongSlice extends SongState {
  actions: {
    setFilters: (data: Partial<SongListFilter>) => SongListFilter;
    setStore: (data: Partial<SongSlice>) => void;
    setTable: (data: Partial<TableProps>) => void;
    setTablePagination: (data: Partial<TableProps['pagination']>) => void;
  };
}

export const useSongStore = create<SongSlice>()(
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
            sortBy: SongListSort.RECENTLY_ADDED,
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
      })),
      { name: 'store_song' },
    ),
    {
      merge: (persistedState, currentState) => {
        return merge(currentState, persistedState);
      },
      name: 'store_song',
      version: 1,
    },
  ),
);

export const useSongStoreActions = () => useSongStore((state) => state.actions);

export const useSetSongStore = () => useSongStore((state) => state.actions.setStore);

export const useSetSongFilters = () => useSongStore((state) => state.actions.setFilters);

export const useSongFilters = () => {
  return useSongStore((state) => [state.list.filter, state.actions.setFilters]);
};

export const useSongListStore = () => useSongStore((state) => state.list);

export const useSongTablePagination = () => useSongStore((state) => state.list.table.pagination);

export const useSetSongTablePagination = () =>
  useSongStore((state) => state.actions.setTablePagination);

export const useSetSongTable = () => useSongStore((state) => state.actions.setTable);
