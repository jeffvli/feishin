import create from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { Server } from '@/renderer/api/types';

export interface AuthState {
  accessToken: string;
  currentServer: Server | null;
  permissions: {
    isAdmin: boolean;
    username: string;
  };
  refreshToken: string;
  serverCredentials: {
    enabled: boolean;
    id: string;
    serverId: string;
    token: string;
    username: string;
  }[];
  serverKey: string;
  serverUrl: string;
}

export interface AuthSlice extends AuthState {
  addServerCredential: (options: {
    enabled: boolean;
    id: string;
    serverId: string;
    token: string;
    username: string;
  }) => void;
  deleteServerCredential: (options: { id: string }) => void;
  disableServerCredential: (options: { id: string }) => void;
  enableServerCredential: (options: { id: string }) => void;
  login: (auth: Partial<AuthState>) => void;
  logout: () => void;
  setCurrentServer: (server: Server | null) => void;
}

export const useAuthStore = create<AuthSlice>()(
  persist(
    devtools(
      immer((set) => ({
        accessToken: '',
        addServerCredential: (options) => {
          set((state) => {
            state.serverCredentials = state.serverCredentials.filter(
              (c) => c.username !== options.username
            );
            state.serverCredentials.push(options);
          });
        },
        currentServer: null,
        deleteServerCredential: (options) => {
          set((state) => {
            state.serverCredentials = state.serverCredentials.filter(
              (credential) => credential.id !== options.id
            );
          });
        },
        disableServerCredential: (options) => {
          set((state) => {
            state.serverCredentials = state.serverCredentials.map(
              (credential) => {
                if (credential.id === options.id) {
                  credential.enabled = false;
                }
                return credential;
              }
            );
          });
        },
        enableServerCredential: (options) => {
          set((state) => {
            state.serverCredentials = state.serverCredentials.map(
              (credential) => {
                if (credential.id === options.id) {
                  credential.enabled = true;
                }
                return credential;
              }
            );
          });
        },
        login: (auth: Partial<AuthState>) => {
          return set({ ...auth });
        },
        logout: () => {
          return set({
            accessToken: undefined,
            permissions: { isAdmin: false, username: '' },
            refreshToken: undefined,
          });
        },
        permissions: {
          isAdmin: false,
          username: '',
        },
        refreshToken: '',
        serverCredentials: [],
        serverKey: '',
        serverPermissions: '',
        serverUrl: '',
        setCurrentServer: (server: Server | null) => {
          return set({ currentServer: server });
        },
      })),
      { name: 'authentication' }
    ),
    { name: 'store_authentication' }
  )
);
