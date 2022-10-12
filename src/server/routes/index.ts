import { Router } from 'express';
import { helpers } from '../helpers';
import { authenticate } from '../middleware';
import { router as albumArtistsRouter } from './album-artists.route';
import { router as albumsRouter } from './albums.route';
import { router as artistsRouter } from './artists.route';
import { router as authRouter } from './auth.route';
import { router as serversRouter } from './servers.route';
import { router as songsRouter } from './songs.route';
import { router as tasksRouter } from './tasks.route';
import { router as usersRouter } from './users.route';

export const routes = Router({ mergeParams: true });

routes.use('/api/auth', authRouter);

routes.use(authenticate, (_req, _res, next) => {
  next();
});

routes.use('/api/tasks', tasksRouter);
routes.use('/api/users', usersRouter);
routes.use('/api/servers', serversRouter);

routes.param('serverId', (req, _res, next, serverId) => {
  helpers.shared.checkServerPermissions(req.auth, { serverId });
  next();
});

routes.use('/api/servers/:serverId/album-artists', albumArtistsRouter);
routes.use('/api/servers/:serverId/artists', artistsRouter);
routes.use('/api/servers/:serverId/albums', albumsRouter);
routes.use('/api/servers/:serverId/songs', songsRouter);
