import { albumArtistsController } from './album-artists.controller';
import { albumsController } from './albums.controller';
import { artistsController } from './artists.controller';
import { authController } from './auth.controller';
import { serversController } from './servers.controller';
import { songsController } from './songs.controller';
import { usersController } from './users.controller';

export const controller = {
  albumArtists: albumArtistsController,
  albums: albumsController,
  artists: artistsController,
  auth: authController,
  servers: serversController,
  songs: songsController,
  users: usersController,
};
