import { albumArtistsValidation } from './album-artists.validation';
import { albumsValidation } from './albums.validation';
import { artistsValidation } from './artists.validation';
import { authValidation } from './auth.validation';
import { serversValidation } from './servers.validation';
import { songsValidation } from './songs.validation';
import { usersValidation } from './users.validation';

export { validateRequest, TypedRequest } from './shared.validation';

export const validation = {
  albumArtists: albumArtistsValidation,
  albums: albumsValidation,
  artists: artistsValidation,
  auth: authValidation,
  servers: serversValidation,
  songs: songsValidation,
  users: usersValidation,
};
