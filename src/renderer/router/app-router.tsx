import { lazy, Suspense } from 'react';
import {
  Route,
  createRoutesFromElements,
  RouterProvider,
  createHashRouter,
} from 'react-router-dom';
import { AppRoute } from './routes';
import { RouteErrorBoundary } from '/@/renderer/features/action-required';
import AlbumDetailRoute from '/@/renderer/features/albums/routes/album-detail-route';
import AlbumArtistListRoute from '/@/renderer/features/artists/routes/album-artist-list-route';
import HomeRoute from '/@/renderer/features/home/routes/home-route';
import { DefaultLayout } from '/@/renderer/layouts';
import { AppOutlet } from '/@/renderer/router/app-outlet';
import { TitlebarOutlet } from '/@/renderer/router/titlebar-outlet';

const NowPlayingRoute = lazy(
  () => import('/@/renderer/features/now-playing/routes/now-playing-route'),
);

const AlbumListRoute = lazy(() => import('/@/renderer/features/albums/routes/album-list-route'));

const SongListRoute = lazy(() => import('/@/renderer/features/songs/routes/song-list-route'));

const ActionRequiredRoute = lazy(
  () => import('/@/renderer/features/action-required/routes/action-required-route'),
);

const InvalidRoute = lazy(
  () => import('/@/renderer/features/action-required/routes/invalid-route'),
);

export const AppRouter = () => {
  const router = createHashRouter(
    createRoutesFromElements(
      <>
        <Route element={<TitlebarOutlet />}>
          <Route
            element={<AppOutlet />}
            errorElement={<RouteErrorBoundary />}
          >
            <Route element={<DefaultLayout />}>
              <Route
                index
                element={<HomeRoute />}
              />
              <Route
                element={<HomeRoute />}
                path={AppRoute.HOME}
              />
              <Route
                element={<NowPlayingRoute />}
                path={AppRoute.NOW_PLAYING}
              />
              <Route
                element={<AlbumListRoute />}
                path={AppRoute.LIBRARY_ALBUMS}
              />
              <Route
                element={<AlbumDetailRoute />}
                path={AppRoute.LIBRARY_ALBUMS_DETAIL}
              />
              <Route
                element={<SongListRoute />}
                path={AppRoute.LIBRARY_SONGS}
              />
              <Route
                element={<AlbumArtistListRoute />}
                path={AppRoute.LIBRARY_ALBUMARTISTS}
              />
              <Route
                element={<InvalidRoute />}
                path="*"
              />
            </Route>
          </Route>
        </Route>
        <Route element={<TitlebarOutlet />}>
          <Route element={<DefaultLayout shell />}>
            <Route
              element={<ActionRequiredRoute />}
              path={AppRoute.ACTION_REQUIRED}
            />
          </Route>
        </Route>
      </>,
    ),
  );

  return (
    <Suspense fallback={<></>}>
      <RouterProvider router={router} />
    </Suspense>
  );
};
