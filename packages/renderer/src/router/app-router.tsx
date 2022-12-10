import { lazy, Suspense } from 'react';
import {
  Route,
  createRoutesFromElements,
  RouterProvider,
  createHashRouter,
} from 'react-router-dom';
import { DefaultLayout } from '/@/layouts';
import { AppOutlet } from '/@/router/app-outlet';
import { AppRoute } from './routes';
import { RouteErrorBoundary } from '/@/features/action-required';
import { TitlebarOutlet } from '/@/router/titlebar-outlet';

const DashboardRoute = lazy(() => import('/@/features/dashboard/routes/DashboardRoute'));

const NowPlayingRoute = lazy(() => import('/@/features/now-playing/routes/now-playing-route'));

const AlbumListRoute = lazy(() => import('/@/features/albums/routes/album-list-route'));

const ActionRequiredRoute = lazy(
  () => import('/@/features/action-required/routes/action-required-route'),
);

const InvalidRoute = lazy(() => import('/@/features/action-required/routes/invalid-route'));

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
                element={<DashboardRoute />}
              />
              <Route
                element={<DashboardRoute />}
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
                element={<></>}
                path={AppRoute.LIBRARY_ARTISTS}
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
