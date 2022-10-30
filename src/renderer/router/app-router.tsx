/* eslint-disable sort-keys-fix/sort-keys-fix */
import { Routes, Route, Link } from 'react-router-dom';
import { ActionRequiredRoute } from '@/renderer/features/action-required';
import { AlbumListRoute } from '@/renderer/features/albums';
import { LoginRoute } from '@/renderer/features/auth';
import { DashboardRoute } from '@/renderer/features/dashboard';
import { NowPlayingRoute } from '@/renderer/features/now-playing';
import { AuthLayout, DefaultLayout } from '@/renderer/layouts';
import { AppOutlet } from '@/renderer/router/app-outlet';
import { AuthOutlet } from '@/renderer/router/auth-outlet';
import { AppRoute } from './routes';

export const AppRouter = () => {
  return (
    <Routes>
      <Route element={<AuthOutlet redirectTo={AppRoute.HOME} />}>
        <Route element={<AuthLayout />}>
          <Route element={<LoginRoute />} path={AppRoute.LOGIN} />
        </Route>
      </Route>
      <Route element={<AppOutlet redirectTo={AppRoute.LOGIN} />}>
        <Route element={<DefaultLayout />}>
          <Route index element={<DashboardRoute />} />
          <Route element={<DashboardRoute />} path={AppRoute.HOME} />
          <Route element={<NowPlayingRoute />} path={AppRoute.NOW_PLAYING} />
          <Route element={<AlbumListRoute />} path={AppRoute.LIBRARY_ALBUMS} />
          <Route element={<></>} path={AppRoute.LIBRARY_ARTISTS} />
          <Route element={<Link to={AppRoute.HOME}>Go home</Link>} path="*" />
        </Route>
        <Route element={<></>} path={AppRoute.PLAYING} />
      </Route>
      <Route element={<DefaultLayout shell />}>
        <Route
          element={<ActionRequiredRoute />}
          path={AppRoute.ACTION_REQUIRED}
        />
      </Route>
    </Routes>
  );
};
