import { albumArtistsService } from './album-artists.service';
import { albumsService } from './albums.service';
import { artistsService } from './artists.service';
import { authService } from './auth.service';
import { genresService } from './genres.service';
import { serversService } from './servers.service';
import { usersService } from './users.service';

export const service = {
  albumArtists: albumArtistsService,
  albums: albumsService,
  artists: artistsService,
  auth: authService,
  genres: genresService,
  servers: serversService,
  users: usersService,
};
