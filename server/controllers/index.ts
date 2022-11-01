import { albumArtistsController } from '@controllers/album-artists.controller';
import { albumsController } from '@controllers/albums.controller';
import { artistsController } from '@controllers/artists.controller';
import { authController } from '@controllers/auth.controller';
import { genresController } from '@controllers/genres.controller';
import { serversController } from '@controllers/servers.controller';
import { songsController } from '@controllers/songs.controller';
import { tasksController } from '@controllers/tasks.controller';
import { usersController } from '@controllers/users.controller';

export const controller = {
  albumArtists: albumArtistsController,
  albums: albumsController,
  artists: artistsController,
  auth: authController,
  genres: genresController,
  servers: serversController,
  songs: songsController,
  tasks: tasksController,
  users: usersController,
};
