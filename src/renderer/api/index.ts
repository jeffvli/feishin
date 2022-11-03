import { albumsApi } from '@/renderer/api/albums.api';
import { authApi } from '@/renderer/api/auth.api';
import { genresApi } from '@/renderer/api/genres.api';
import { serversApi } from '@/renderer/api/servers.api';
import { tasksApi } from '@/renderer/api/tasks.api';
import { usersApi } from '@/renderer/api/users.api';

export * from './sockets.api';

export const api = {
  albums: albumsApi,
  auth: authApi,
  genres: genresApi,
  servers: serversApi,
  tasks: tasksApi,
  users: usersApi,
};
