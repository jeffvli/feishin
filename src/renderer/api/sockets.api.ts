import { io } from 'socket.io-client';

const { username } = JSON.parse(
  localStorage.getItem('store_authentication') || '{}'
).state.permissions;

export const socket = io('http://localhost:8843', {
  query: { username },
});
