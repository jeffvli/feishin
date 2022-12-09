import merge from 'lodash/merge';
import { nanoid } from 'nanoid/non-secure';
import create from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { JFAlbumListSort } from '/@/api/jellyfin.types';
import { NDAlbumListSort } from '/@/api/navidrome.types';
import { SortOrder } from '/@/api/types';
import { useAppStore } from '/@/store/app.store';
import { ServerType } from '/@/types';

export type ServerListItem = {
  credential: string;
  id: string;
  name: string;
  ndCredential?: string;
  type: ServerType;
  url: string;
  userId: string | null;
  username: string;
};

export interface AuthState {
  currentServer: ServerListItem | null;
  deviceId: string;
  serverList: ServerListItem[];
}

export interface AuthSlice extends AuthState {
  actions: {
    addServer: (args: ServerListItem) => void;
    deleteServer: (id: string) => void;
    setCurrentServer: (server: ServerListItem | null) => void;
    updateServer: (id: string, args: Partial<ServerListItem>) => void;
  };
}

export const useAuthStore = create<AuthSlice>()(
  persist(
    devtools(
      immer((set) => ({
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
          setCurrentServer: (server) => {
            set((state) => {
              state.currentServer = server;

              if (server) {
                useAppStore.getState().actions.setPage('albums', {
                  list: {
                    ...useAppStore.getState().albums.list,
                    filter: {
                      ...useAppStore.getState().albums.list.filter,
                      sortBy:
                        server.type === ServerType.NAVIDROME
                          ? NDAlbumListSort.NAME
                          : JFAlbumListSort.NAME,
                      sortOrder: SortOrder.ASC,
                    },
                  },
                });
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
