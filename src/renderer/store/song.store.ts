import merge from 'lodash/merge';
import create from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { SongListArgs, SongListSort, SortOrder } from '/@/renderer/api/types';
import { DataTableProps } from '/@/renderer/store/settings.store';
import { ListDisplayType, TableColumn } from '/@/renderer/types';

type TableProps = {
  scrollOffset: number;
} & DataTableProps;

type ListProps<T> = {
  display: ListDisplayType;
  filter: T;
  table: TableProps;
};

type AlbumListFilter = Omit<SongListArgs['query'], 'startIndex' | 'limit'>;

interface SongState {
  list: ListProps<AlbumListFilter>;
}

export interface SongSlice extends SongState {
  actions: {
    setFilters: (data: Partial<AlbumListFilter>) => void;
    setStore: (data: Partial<SongSlice>) => void;
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
          },
          setStore: (data) => {
            set({ ...get(), ...data });
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
            ],
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

export const useSongFilters = () => {
  return useSongStore((state) => [state.list.filter, state.actions.setFilters]);
};

export const useSongListStore = () => useSongStore((state) => state.list);
