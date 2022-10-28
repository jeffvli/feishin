/* eslint-disable sort-keys-fix/sort-keys-fix */
import { Routes, Route } from 'react-router-dom';
import { AlbumListRoute } from '@/renderer/features/albums';
import { LoginRoute } from '@/renderer/features/auth';
import { DashboardRoute } from '@/renderer/features/dashboard';
import { NowPlayingRoute } from '@/renderer/features/now-playing';
import { AuthLayout, DefaultLayout } from '@/renderer/layouts';
import { AuthOutlet } from '@/renderer/router/auth-outlet';
import { PrivateOutlet } from '@/renderer/router/private-outlet';
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
          <Route element={<NowPlayingRoute />} path={AppRoute.NOW_PLAYING} />
          <Route element={<AlbumListRoute />} path={AppRoute.LIBRARY_ALBUMS} />
          <Route element={<></>} path={AppRoute.LIBRARY_ARTISTS} />
        </Route>
        <Route element={<></>} path={AppRoute.PLAYING} />
      </Route>
    </Routes>
  );
};
