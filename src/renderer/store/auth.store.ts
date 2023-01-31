import merge from 'lodash/merge';
import { nanoid } from 'nanoid/non-secure';
import create from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { AlbumListSort, SongListSort, SortOrder } from '/@/renderer/api/types';
import { useAlbumArtistListDataStore } from '/@/renderer/store/album-artist-list-data.store';
import { useAlbumListDataStore } from '/@/renderer/store/album-list-data.store';
import { useAlbumStore } from '/@/renderer/store/album.store';
import { useSongStore } from '/@/renderer/store/song.store';
import { ServerListItem } from '/@/renderer/types';

export interface AuthState {
  currentServer: ServerListItem | null;
  deviceId: string;
  serverList: ServerListItem[];
}

export interface AuthSlice extends AuthState {
  actions: {
    addServer: (args: ServerListItem) => void;
    deleteServer: (id: string) => void;
    getServer: (id?: string) => ServerListItem | undefined;
    setCurrentServer: (server: ServerListItem | null) => void;
    updateServer: (id: string, args: Partial<ServerListItem>) => void;
  };
}

export const useAuthStore = create<AuthSlice>()(
  persist(
    devtools(
      immer((set, get) => ({
        actions: {
          addServer: (args) => {
            set((state) => {
              state.serverList.push(args);
            });
          },
          deleteServer: (id) => {
            set((state) => {
              state.serverList = state.serverList.filter((credential) => credential.id !== id);
              if (state.currentServer?.id === id) {
                state.currentServer = null;
              }
            });
          },
          getServer: (id) => {
            return get().serverList.find((server) => server.id === id);
          },
          setCurrentServer: (server) => {
            set((state) => {
              state.currentServer = server;

              if (server) {
                useAlbumStore.getState().actions.setFilters({
                  musicFolderId: undefined,
                  sortBy: AlbumListSort.RECENTLY_ADDED,
                  sortOrder: SortOrder.DESC,
                });
                useSongStore.getState().actions.setFilters({
                  musicFolderId: undefined,
                  sortBy: SongListSort.RECENTLY_ADDED,
                  sortOrder: SortOrder.DESC,
                });

                // Reset persisted grid list stores
                useAlbumListDataStore.getState().actions.setItemData([]);
                useAlbumArtistListDataStore.getState().actions.setItemData([]);
              }
            });
          },
          updateServer: (id: string, args: Partial<ServerListItem>) => {
            set((state) => {
              const server = state.serverList.find((server) => server.id === id);
              if (server) {
                Object.assign(server, { ...server, ...args });
              }
            });
          },
        },
        currentServer: null,
        deviceId: nanoid(),
        serverList: [],
      })),
      { name: 'store_authentication' },
    ),
    {
      merge: (persistedState, currentState) => merge(currentState, persistedState),
      name: 'store_authentication',
      version: 1,
    },
  ),
);

export const useCurrentServerId = () => useAuthStore((state) => state.currentServer)?.id || '';

export const useCurrentServer = () => useAuthStore((state) => state.currentServer);

export const useServerList = () => useAuthStore((state) => state.serverList);

export const useAuthStoreActions = () => useAuthStore((state) => state.actions);
