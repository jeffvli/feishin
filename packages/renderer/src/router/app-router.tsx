import loadable from '@loadable/component';
import {
  Route,
  createBrowserRouter,
  createRoutesFromElements,
  RouterProvider,
} from 'react-router-dom';
import { DefaultLayout } from '/@/layouts';
import { AppOutlet } from '/@/router/app-outlet';
import { AppRoute } from './routes';
import { RouteErrorBoundary } from '/@/features/action-required';

const DashboardRoute = loadable(() => import('/@/features/dashboard'), {
  resolveComponent: (components) => components.DashboardRoute,
});

const NowPlayingRoute = loadable(() => import('/@/features/now-playing'), {
  resolveComponent: (components) => components.NowPlayingRoute,
});

const AlbumListRoute = loadable(() => import('/@/features/albums'), {
  resolveComponent: (components) => components.AlbumListRoute,
});

const ActionRequiredRoute = loadable(() => import('/@/features/action-required'), {
  resolveComponent: (components) => components.ActionRequiredRoute,
});

const InvalidRoute = loadable(() => import('/@/features/action-required'), {
  resolveComponent: (components) => components.InvalidRoute,
});

export const AppRouter = () => {
  const router = createBrowserRouter(
    createRoutesFromElements(
      <>
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
        <Route element={<DefaultLayout shell />}>
          <Route
            element={<ActionRequiredRoute />}
            path={AppRoute.ACTION_REQUIRED}
          />
        </Route>
      </>,
    ),
  );

  return <RouterProvider router={router} />;
};
