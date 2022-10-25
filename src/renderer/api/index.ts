import { albumsApi } from './albums.api';
import { authApi } from './auth.api';
import { serversApi } from './servers.api';
import { usersApi } from './users.api';

export const api = {
  albums: albumsApi,
  auth: authApi,
  servers: serversApi,
  users: usersApi,
};
