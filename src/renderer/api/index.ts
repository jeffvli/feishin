import { tasksApi } from '@/renderer/api/tasks.api';
import { albumsApi } from './albums.api';
import { authApi } from './auth.api';
import { serversApi } from './servers.api';
import { usersApi } from './users.api';

export * from './sockets.api';

export const api = {
  albums: albumsApi,
  auth: authApi,
  servers: serversApi,
  tasks: tasksApi,
  users: usersApi,
};
