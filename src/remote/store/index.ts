import { hideNotification, showNotification } from '@mantine/notifications';
import type { NotificationProps as MantineNotificationProps } from '@mantine/notifications';
import merge from 'lodash/merge';
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { SongUpdate } from '/@/renderer/types';

interface StatefulWebSocket extends WebSocket {
  natural: boolean;
}

interface SettingsState {
  connected: boolean;
  info: Omit<SongUpdate, 'currentTime'>;
  isDark: boolean;
  showImage: boolean;
  socket?: StatefulWebSocket;
}

export interface SettingsSlice extends SettingsState {
  actions: {
    reconnect: () => void;
    send: (event: string, ...data: any[]) => void;
    toggleIsDark: () => void;
    toggleShowImage: () => void;
  };
}

const initialState: SettingsState = {
  connected: false,
  info: {},
  isDark: window.matchMedia('(prefers-color-scheme: dark)').matches,
  showImage: true,
};

interface NotificationProps extends MantineNotificationProps {
  type?: 'error' | 'warning';
}

const showToast = ({ type, ...props }: NotificationProps) => {
  const color = type === 'warning' ? 'var(--warning-color)' : 'var(--danger-color)';

  const defaultTitle = type === 'warning' ? 'Warning' : 'Error';

  const defaultDuration = type === 'error' ? 2000 : 1000;

  return showNotification({
    autoClose: defaultDuration,
    styles: () => ({
      closeButton: {
        '&:hover': {
          background: 'transparent',
        },
      },
      description: {
        color: 'var(--toast-description-fg)',
        fontSize: '1rem',
      },
      loader: {
        margin: '1rem',
      },
      root: {
        '&::before': { backgroundColor: color },
        background: 'var(--toast-bg)',
        border: '2px solid var(--generic-border-color)',
        bottom: '90px',
      },
      title: {
        color: 'var(--toast-title-fg)',
        fontSize: '1.3rem',
      },
    }),
    title: defaultTitle,
    ...props,
  });
};

const toast = {
  error: (props: NotificationProps) => showToast({ type: 'error', ...props }),
  hide: hideNotification,
  warn: (props: NotificationProps) => showToast({ type: 'warning', ...props }),
};

export const useRemoteStore = create<SettingsSlice>()(
  persist(
    devtools(
      immer((set, get) => ({
        actions: {
          reconnect: () => {
            const existing = get().socket;

            if (existing) {
              if (
                existing.readyState === WebSocket.OPEN ||
                existing.readyState === WebSocket.CONNECTING
              ) {
                existing.natural = true;
                existing.close(4001);
              }
            }
            set((state) => {
              const socket = new WebSocket(
                // eslint-disable-next-line no-restricted-globals
                location.href.replace('http', 'ws'),
              ) as StatefulWebSocket;

              socket.natural = false;

              socket.addEventListener('message', (message) => {
                const { event, data } = JSON.parse(message.data);

                switch (event) {
                  case 'error': {
                    toast.error({ message: data, title: 'Socket error' });
                    break;
                  }
                  case 'proxy': {
                    set((state) => {
                      if (state.info.song) {
                        state.info.song.imageUrl = `data:image/jpeg;base64,${data}`;
                      }
                    });
                    break;
                  }
                  case 'song': {
                    set((nested) => {
                      nested.info = { ...nested.info, ...data };
                    });
                  }
                }
              });

              socket.addEventListener('open', () => {
                set({ connected: true });
              });

              socket.addEventListener('close', (reason) => {
                if (reason.code === 4000) {
                  toast.warn({
                    message: 'Feishin remote server is down',
                    title: 'Connection closed',
                  });
                } else if (reason.code !== 4001 && !socket.natural) {
                  toast.error({
                    message: 'Socket closed for unexpected reason',
                    title: 'Connection closed',
                  });
                }

                if (!socket.natural) {
                  set({ connected: false, info: {} });
                }
              });

              state.socket = socket;
            });
          },
          send: (event, ...data) => {
            get().socket?.send(JSON.stringify([event, ...data]));
          },
          toggleIsDark: () => {
            set((state) => {
              state.isDark = !state.isDark;
            });
          },
          toggleShowImage: () => {
            set((state) => {
              state.showImage = !state.showImage;
            });
          },
        },
        ...initialState,
      })),
      { name: 'store_settings' },
    ),
    {
      merge: (persistedState, currentState) => {
        return merge(currentState, persistedState);
      },
      name: 'store_settings',
      version: 6,
    },
  ),
);

export const useConnected = () => useRemoteStore((state) => state.connected);

export const useInfo = () => useRemoteStore((state) => state.info);

export const useIsDark = () => useRemoteStore((state) => state.isDark);

export const useReconnect = () => useRemoteStore((state) => state.actions.reconnect);

export const useShowImage = () => useRemoteStore((state) => state.showImage);

export const useSend = () => useRemoteStore((state) => state.actions.send);

export const useToggleDark = () => useRemoteStore((state) => state.actions.toggleIsDark);

export const useToggleShowImage = () => useRemoteStore((state) => state.actions.toggleShowImage);
