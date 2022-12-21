import merge from 'lodash/merge';
import create from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { AlbumListArgs, AlbumListSort, SortOrder } from '/@/renderer/api/types';
import { CardDisplayType } from '/@/renderer/types';

type TableProps = {
  scrollOffset: number;
};

type ListProps<T> = {
  display: CardDisplayType;
  filter: T;
  grid: {
    scrollOffset: number;
    size: number;
  };
  table: TableProps;
};

type AlbumListFilter = Omit<AlbumListArgs['query'], 'startIndex' | 'limit'>;

export interface AlbumState {
  list: ListProps<AlbumListFilter>;
}

export interface AlbumSlice extends AlbumState {
  actions: {
    setFilters: (data: Partial<AlbumListFilter>) => void;
    setStore: (data: Partial<AlbumSlice>) => void;
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
          },
          setStore: (data) => {
            set({ ...get(), ...data });
          },
        },
        list: {
          display: CardDisplayType.CARD,
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
