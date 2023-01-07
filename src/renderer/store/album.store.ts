import merge from 'lodash/merge';
import create from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { AlbumListArgs, AlbumListSort, SortOrder } from '/@/renderer/api/types';
import { DataTableProps } from '/@/renderer/store/settings.store';
import { ListDisplayType, TableColumn, TablePagination } from '/@/renderer/types';

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

export type AlbumListFilter = Omit<AlbumListArgs['query'], 'startIndex' | 'limit'>;

export interface AlbumState {
  list: ListProps<AlbumListFilter>;
}

export interface AlbumSlice extends AlbumState {
  actions: {
    setFilters: (data: Partial<AlbumListFilter>) => AlbumListFilter;
    setStore: (data: Partial<AlbumSlice>) => void;
    setTable: (data: Partial<TableProps>) => void;
    setTablePagination: (data: Partial<TableProps['pagination']>) => void;
  };
}

export const useAlbumStore = create<AlbumSlice>()(
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
          display: ListDisplayType.CARD,
          filter: {
            musicFolderId: undefined,
            sortBy: AlbumListSort.RECENTLY_ADDED,
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
      })),
      { name: 'store_album' },
    ),
    {
      merge: (persistedState, currentState) => {
        return merge(currentState, persistedState);
      },
      name: 'store_album',
      version: 1,
    },
  ),
);

export const useAlbumStoreActions = () => useAlbumStore((state) => state.actions);

export const useSetAlbumStore = () => useAlbumStore((state) => state.actions.setStore);

export const useSetAlbumFilters = () => useAlbumStore((state) => state.actions.setFilters);

export const useAlbumListStore = () => useAlbumStore((state) => state.list);

export const useAlbumListFilters = () => useAlbumStore((state) => state.list.filter);

export const useAlbumTablePagination = () => useAlbumStore((state) => state.list.table.pagination);

export const useSetAlbumTablePagination = () =>
  useAlbumStore((state) => state.actions.setTablePagination);

export const useSetAlbumTable = () => useAlbumStore((state) => state.actions.setTable);
