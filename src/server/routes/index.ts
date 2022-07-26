import { Router } from 'express';
import { albumArtistsRouter } from './album-artists.route';
import { albumsRouter } from './albums.route';
import { artistsRouter } from './artists.route';
import { authRouter } from './auth.route';
import { serversRouter } from './servers.route';
import { songsRouter } from './songs.route';
import { tasksRouter } from './tasks.route';
import { usersRouter } from './users.route';

export const routes = Router();

routes.use('/api/auth', authRouter);
routes.use('/api/servers', serversRouter);
routes.use('/api/tasks', tasksRouter);
routes.use('/api/users', usersRouter);
routes.use('/api/album-artists', albumArtistsRouter);
routes.use('/api/artists', artistsRouter);
routes.use('/api/albums', albumsRouter);
routes.use('/api/songs', songsRouter);
