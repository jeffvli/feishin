import merge from 'lodash/merge';
import { nanoid } from 'nanoid/non-secure';
import create from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  AdvancedFilterGroup,
  AlbumSort,
  CardDisplayType,
  FilterGroupType,
  Platform,
  SortOrder,
} from '@/renderer/types';

type SidebarProps = {
  expanded: string[];
  image: boolean;
  leftWidth: string;
  rightExpanded: boolean;
  rightWidth: string;
};

type LibraryPageProps = {
  list: ListProps;
};

type ListFilter = {
  orderBy: SortOrder;
  search?: string;
  serverFolderId: string[];
  sortBy: AlbumSort;
};

type ListAdvancedFilter = {
  enabled: boolean;
  filter: AdvancedFilterGroup;
};

type ListProps = {
  advancedFilter: ListAdvancedFilter;
  display: CardDisplayType;
  filter: ListFilter;
  gridScrollOffset: number;
  listScrollOffset: number;
  size: number;
  type: 'list' | 'grid';
};

export interface AppState {
  albums: LibraryPageProps;
  isReorderingQueue: boolean;
  platform: Platform;
  sidebar: {
    expanded: string[];
    image: boolean;
    leftWidth: string;
    rightExpanded: boolean;
    rightWidth: string;
  };
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
  setAppStore: (data: Partial<AppSlice>) => void;
  setPage: (page: 'albums', options: Partial<LibraryPageProps>) => void;
  setSidebar: (options: Partial<SidebarProps>) => void;
}

export const useAppStore = create<AppSlice>()(
  persist(
    devtools(
      immer((set, get) => ({
        albums: {
          list: {
            advancedFilter: {
              enabled: false,
              filter: DEFAULT_ADVANCED_FILTERS,
            },
            display: CardDisplayType.CARD,
            filter: {
              orderBy: SortOrder.DESC,
              search: '',
              serverFolderId: [],
              sortBy: AlbumSort.DATE_ADDED_REMOTE,
            },
            gridScrollOffset: 0,
            listScrollOffset: 0,
            size: 50,
            type: 'grid',
          },
        },
        isReorderingQueue: false,
        platform: Platform.WINDOWS,
        setAppStore: (data) => {
          set({ ...get(), ...data });
        },
        setPage: (page: 'albums', data: any) => {
          set((state) => {
            state[page] = { ...state[page], ...data };
          });
        },
        setSidebar: (options) => {
          set((state) => {
            state.sidebar = { ...state.sidebar, ...options };
          });
        },
        sidebar: {
          expanded: [],
          image: false,
          leftWidth: '230px',
          rightExpanded: false,
          rightWidth: '230px',
        },
      })),
      { name: 'store_app' }
    ),
    {
      merge: (persistedState, currentState) => {
        return merge(currentState, persistedState);
      },
      name: 'store_app',
      version: 1,
    }
  )
);
