import { albumsValidation } from './albums.validation';
import { serversValidation } from './servers.validation';
import { songsValidation } from './songs.validation';
import { usersValidation } from './users.validation';

export { validateRequest, TypedRequest } from './shared.validation';

export const validation = {
  albums: albumsValidation,
  servers: serversValidation,
  songs: songsValidation,
  users: usersValidation,
};
