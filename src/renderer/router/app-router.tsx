import { lazy, Suspense } from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';

import { AppRoute } from './routes';

import ArtistListRoute from '/@/renderer/features/artists/routes/artist-list-route';
import { AddToPlaylistContextModal } from '/@/renderer/features/playlists';
import { ShareItemContextModal } from '/@/renderer/features/sharing';
import { DefaultLayout } from '/@/renderer/layouts/default-layout';
import { AppOutlet } from '/@/renderer/router/app-outlet';
import { TitlebarOutlet } from '/@/renderer/router/titlebar-outlet';
import { BaseContextModal, ModalsProvider } from '/@/shared/components/modal/modal';

const NowPlayingRoute = lazy(
    () => import('/@/renderer/features/now-playing/routes/now-playing-route'),
);

const AlbumListRoute = lazy(() => import('/@/renderer/features/albums/routes/album-list-route'));

const SongListRoute = lazy(() => import('/@/renderer/features/songs/routes/song-list-route'));

const PlaylistDetailSongListRoute = lazy(
    () => import('/@/renderer/features/playlists/routes/playlist-detail-song-list-route'),
);

const PlaylistListRoute = lazy(
    () => import('/@/renderer/features/playlists/routes/playlist-list-route'),
);

const ActionRequiredRoute = lazy(
    () => import('/@/renderer/features/action-required/routes/action-required-route'),
);

const InvalidRoute = lazy(
    () => import('/@/renderer/features/action-required/routes/invalid-route'),
);

const HomeRoute = lazy(() => import('/@/renderer/features/home/routes/home-route'));

const AlbumArtistListRoute = lazy(
    () => import('/@/renderer/features/artists/routes/album-artist-list-route'),
);

const AlbumArtistDetailRoute = lazy(
    () => import('/@/renderer/features/artists/routes/album-artist-detail-route'),
);

const AlbumArtistDetailTopSongsListRoute = lazy(
    () => import('../features/artists/routes/album-artist-detail-top-songs-list-route'),
);

const AlbumDetailRoute = lazy(
    () => import('/@/renderer/features/albums/routes/album-detail-route'),
);

const DummyAlbumDetailRoute = lazy(
    () => import('/@/renderer/features/albums/routes/dummy-album-detail-route'),
);

const GenreListRoute = lazy(() => import('/@/renderer/features/genres/routes/genre-list-route'));

const SettingsRoute = lazy(() => import('/@/renderer/features/settings/routes/settings-route'));

const SearchRoute = lazy(() => import('/@/renderer/features/search/routes/search-route'));

const RouteErrorBoundary = lazy(
    () => import('/@/renderer/features/action-required/components/route-error-boundary'),
);

export const AppRouter = () => {
    const router = (
        <HashRouter future={{ v7_startTransition: true }}>
            <ModalsProvider
                modals={{
                    addToPlaylist: AddToPlaylistContextModal,
                    base: BaseContextModal,
                    shareItem: ShareItemContextModal,
                }}
            >
                <Routes>
                    <Route element={<TitlebarOutlet />}>
                        <Route
                            element={<AppOutlet />}
                            errorElement={<RouteErrorBoundary />}
                        >
                            <Route element={<DefaultLayout />}>
                                <Route
                                    element={<HomeRoute />}
                                    errorElement={<RouteErrorBoundary />}
                                    index
                                />
                                <Route
                                    element={<HomeRoute />}
                                    errorElement={<RouteErrorBoundary />}
                                    path={AppRoute.HOME}
                                />
                                <Route
                                    element={<SearchRoute />}
                                    errorElement={<RouteErrorBoundary />}
                                    path={AppRoute.SEARCH}
                                />
                                <Route
                                    element={<SettingsRoute />}
                                    errorElement={<RouteErrorBoundary />}
                                    path={AppRoute.SETTINGS}
                                />
                                <Route
                                    element={<NowPlayingRoute />}
                                    errorElement={<RouteErrorBoundary />}
                                    path={AppRoute.NOW_PLAYING}
                                />
                                <Route path={AppRoute.LIBRARY_GENRES}>
                                    <Route
                                        element={<GenreListRoute />}
                                        errorElement={<RouteErrorBoundary />}
                                        index
                                    />
                                    <Route
                                        element={<AlbumListRoute />}
                                        path={AppRoute.LIBRARY_GENRES_ALBUMS}
                                    />
                                    <Route
                                        element={<SongListRoute />}
                                        path={AppRoute.LIBRARY_GENRES_SONGS}
                                    />
                                </Route>
                                <Route
                                    element={<AlbumListRoute />}
                                    errorElement={<RouteErrorBoundary />}
                                    path={AppRoute.LIBRARY_ALBUMS}
                                />
                                <Route
                                    element={<AlbumDetailRoute />}
                                    errorElement={<RouteErrorBoundary />}
                                    path={AppRoute.LIBRARY_ALBUMS_DETAIL}
                                />
                                <Route
                                    element={<ArtistListRoute />}
                                    errorElement={<RouteErrorBoundary />}
                                    path={AppRoute.LIBRARY_ARTISTS}
                                />
                                <Route path={AppRoute.LIBRARY_ARTISTS_DETAIL}>
                                    <Route
                                        element={<AlbumArtistDetailRoute />}
                                        index
                                    />
                                    <Route
                                        element={<AlbumListRoute />}
                                        path={AppRoute.LIBRARY_ARTISTS_DETAIL_DISCOGRAPHY}
                                    />
                                    <Route
                                        element={<SongListRoute />}
                                        path={AppRoute.LIBRARY_ARTISTS_DETAIL_SONGS}
                                    />
                                    <Route
                                        element={<AlbumArtistDetailTopSongsListRoute />}
                                        path={AppRoute.LIBRARY_ARTISTS_DETAIL_TOP_SONGS}
                                    />
                                </Route>
                                <Route
                                    element={<DummyAlbumDetailRoute />}
                                    errorElement={<RouteErrorBoundary />}
                                    path={AppRoute.FAKE_LIBRARY_ALBUM_DETAILS}
                                />
                                <Route
                                    element={<SongListRoute />}
                                    errorElement={<RouteErrorBoundary />}
                                    path={AppRoute.LIBRARY_SONGS}
                                />
                                <Route
                                    element={<PlaylistListRoute />}
                                    errorElement={<RouteErrorBoundary />}
                                    path={AppRoute.PLAYLISTS}
                                />
                                <Route
                                    element={<PlaylistDetailSongListRoute />}
                                    errorElement={<RouteErrorBoundary />}
                                    path={AppRoute.PLAYLISTS_DETAIL_SONGS}
                                />
                                <Route
                                    errorElement={<RouteErrorBoundary />}
                                    path={AppRoute.LIBRARY_ALBUM_ARTISTS}
                                >
                                    <Route
                                        element={<AlbumArtistListRoute />}
                                        index
                                    />
                                    <Route path={AppRoute.LIBRARY_ALBUM_ARTISTS_DETAIL}>
                                        <Route
                                            element={<AlbumArtistDetailRoute />}
                                            index
                                        />
                                        <Route
                                            element={<AlbumListRoute />}
                                            path={AppRoute.LIBRARY_ALBUM_ARTISTS_DETAIL_DISCOGRAPHY}
                                        />
                                        <Route
                                            element={<SongListRoute />}
                                            path={AppRoute.LIBRARY_ALBUM_ARTISTS_DETAIL_SONGS}
                                        />
                                        <Route
                                            element={<AlbumArtistDetailTopSongsListRoute />}
                                            path={AppRoute.LIBRARY_ALBUM_ARTISTS_DETAIL_TOP_SONGS}
                                        />
                                    </Route>
                                </Route>
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
                </Routes>
            </ModalsProvider>
        </HashRouter>
    );

    return <Suspense fallback={<></>}>{router}</Suspense>;
};
