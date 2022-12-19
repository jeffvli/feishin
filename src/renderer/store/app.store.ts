import merge from 'lodash/merge';
import { nanoid } from 'nanoid/non-secure';
import create from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { AlbumListSort, SongListSort, SortOrder } from '/@/renderer/api/types';
import { AdvancedFilterGroup, CardDisplayType, Platform, FilterGroupType } from '/@/renderer/types';

type SidebarProps = {
  expanded: string[];
  image: boolean;
  leftWidth: string;
  rightExpanded: boolean;
  rightWidth: string;
};

type LibraryPageProps<TSort> = {
  list: ListProps<TSort>;
};

type ListFilter<TSort> = {
  musicFolderId?: string;
  sortBy: TSort;
  sortOrder: SortOrder;
};

type ListAdvancedFilter = {
  enabled: boolean;
  filter: AdvancedFilterGroup;
};

type ListProps<T> = {
  advancedFilter: ListAdvancedFilter;
  display: CardDisplayType;
  filter: ListFilter<T>;
  gridScrollOffset: number;
  listScrollOffset: number;
  size: number;
  type: 'list' | 'grid';
};

type TitlebarProps = {
  backgroundColor: string;
  outOfView: boolean;
};

export interface AppState {
  albums: LibraryPageProps<AlbumListSort>;
  isReorderingQueue: boolean;
  platform: Platform;
  sidebar: {
    expanded: string[];
    image: boolean;
    leftWidth: string;
    rightExpanded: boolean;
    rightWidth: string;
  };
  songs: LibraryPageProps<SongListSort>;
  titlebar: TitlebarProps;
}

const DEFAULT_ADVANCED_FILTERS = {
  group: [],
  rules: [
    {
      field: '',
      operator: '',
      uniqueId: nanoid(),
      value: '',
    },
  ],
  type: FilterGroupType.AND,
  uniqueId: nanoid(),
};

export interface AppSlice extends AppState {
  actions: {
    resetServerDefaults: () => void;
    setAppStore: (data: Partial<AppSlice>) => void;
    setPage: (
      page: 'albums' | 'songs',
      options: Partial<LibraryPageProps<AlbumListSort | SongListSort>>,
    ) => void;
    setSidebar: (options: Partial<SidebarProps>) => void;
    setTitlebar: (options: Partial<TitlebarProps>) => void;
  };
}

export const useAppStore = create<AppSlice>()(
  persist(
    devtools(
      immer((set, get) => ({
        actions: {
          resetServerDefaults: () => {
            set((state) => {
              state.albums.list = {
                ...state.albums.list,
                filter: {
                  ...state.albums.list.filter,
                  musicFolderId: undefined,
                },
                gridScrollOffset: 0,
                listScrollOffset: 0,
              };
            });
          },
          setAppStore: (data) => {
            set({ ...get(), ...data });
          },
          setPage: (page: 'albums' | 'songs', data: any) => {
            set((state) => {
              state[page] = { ...state[page], ...data };
            });
          },
          setSidebar: (options) => {
            set((state) => {
              state.sidebar = { ...state.sidebar, ...options };
            });
          },
          setTitlebar: (options) => {
            set((state) => {
              state.titlebar = { ...state.titlebar, ...options };
            });
          },
        },
        albums: {
          list: {
            advancedFilter: {
              enabled: false,
              filter: DEFAULT_ADVANCED_FILTERS,
            },
            display: CardDisplayType.CARD,
            filter: {
              musicFolderId: undefined,
              sortBy: AlbumListSort.RECENTLY_ADDED,
              sortOrder: SortOrder.ASC,
            },
            gridScrollOffset: 0,
            listScrollOffset: 0,
            size: 50,
            type: 'grid',
          },
        },
        isReorderingQueue: false,
        platform: Platform.WINDOWS,
        sidebar: {
          expanded: [],
          image: false,
          leftWidth: '230px',
          rightExpanded: false,
          rightWidth: '400px',
        },
        songs: {
          list: {
            advancedFilter: {
              enabled: false,
              filter: DEFAULT_ADVANCED_FILTERS,
            },
            display: CardDisplayType.CARD,
            filter: {
              musicFolderId: undefined,
              sortBy: SongListSort.NAME,
              sortOrder: SortOrder.ASC,
            },
            gridScrollOffset: 0,
            listScrollOffset: 0,
            size: 50,
            type: 'grid',
          },
        },
        titlebar: {
          backgroundColor: '#000000',
          outOfView: false,
        },
      })),
      { name: 'store_app' },
    ),
    {
      merge: (persistedState, currentState) => {
        return merge(currentState, persistedState);
      },
      name: 'store_app',
      version: 1,
    },
  ),
);

export const useAppStoreActions = () => useAppStore((state) => state.actions);

export const useAlbumRouteStore = () => useAppStore((state) => state.albums);

export const useSongRouteStore = () => useAppStore((state) => state.songs);

export const useSidebarStore = () => useAppStore((state) => state.sidebar);

export const useSidebarRightExpanded = () => useAppStore((state) => state.sidebar.rightExpanded);

export const useSetTitlebar = () => useAppStore((state) => state.actions.setTitlebar);

export const useTitlebarStore = () => useAppStore((state) => state.titlebar);
