import { albumArtistsValidation } from '@validations/album-artists.validation';
import { albumsValidation } from '@validations/albums.validation';
import { artistsValidation } from '@validations/artists.validation';
import { authValidation } from '@validations/auth.validation';
import { serversValidation } from '@validations/servers.validation';
import { songsValidation } from '@validations/songs.validation';
import { tasksValidation } from '@validations/tasks.validation';
import { usersValidation } from '@validations/users.validation';

export { validateRequest, TypedRequest } from '@validations/shared.validation';

export const validation = {
  albumArtists: albumArtistsValidation,
  albums: albumsValidation,
  artists: artistsValidation,
  auth: authValidation,
  servers: serversValidation,
  songs: songsValidation,
  tasks: tasksValidation,
  users: usersValidation,
};
