/* eslint-disable sort-keys-fix/sort-keys-fix */
import { Routes, Route } from 'react-router-dom';
import { LibraryAlbumsRoute } from '@/renderer/features/library/routes/LibraryAlbumsRoute';
import { LibraryArtistsRoute } from '@/renderer/features/library/routes/LibraryArtistsRoute';
import { LibraryRoute } from '@/renderer/features/library/routes/LibraryRoute';
import { AuthOutlet } from '@/renderer/router/auth-outlet';
import { PrivateOutlet } from '@/renderer/router/private-outlet';
import { LoginRoute } from '../features/auth';
import { DashboardRoute } from '../features/dashboard';
import { AuthLayout, DefaultLayout } from '../layouts';
import { AppRoute } from './routes';

export const AppRouter = () => {
  return (
    <Routes>
      <Route element={<AuthOutlet redirectTo={AppRoute.HOME} />}>
        <Route element={<AuthLayout />}>
          <Route element={<LoginRoute />} path={AppRoute.LOGIN} />
        </Route>
      </Route>
      <Route
        element={<PrivateOutlet redirectTo={AppRoute.LOGIN} />}
        path={AppRoute.HOME}
      >
        <Route element={<DefaultLayout />}>
          <Route element={<DashboardRoute />} path={AppRoute.HOME} />
          <Route element={<></>} path={AppRoute.SEARCH} />

          <Route element={<LibraryRoute />} path={AppRoute.LIBRARY} />
          <Route
            element={<DashboardRoute />}
            path={AppRoute.LIBRARY_ALBUMARTISTS}
          />
          <Route
            element={<LibraryAlbumsRoute />}
            path={AppRoute.LIBRARY_ALBUMS}
          />
          <Route
            element={<LibraryAlbumsRoute />}
            path={AppRoute.LIBRARY_ALBUMS}
          />
          <Route
            element={<LibraryArtistsRoute />}
            path={AppRoute.LIBRARY_ARTISTS}
          />
          <Route element={<></>} path={AppRoute.LIBRARY_ARTISTS} />
        </Route>
        <Route element={<></>} path={AppRoute.PLAYING} />
      </Route>
    </Routes>
  );
};
