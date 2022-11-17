import { io } from 'socket.io-client';
import { useAuthStore } from '@/renderer/store';

export const socket = io(useAuthStore.getState().serverUrl, {
  query: {
    id: useAuthStore.getState().permissions.id,
    username: useAuthStore.getState().permissions.username,
  },
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 500,
});

socket.emit('join', {
  id: useAuthStore.getState().permissions.id,
});
