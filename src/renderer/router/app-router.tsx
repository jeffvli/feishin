import { lazy, Suspense } from 'react';
import { HashRouter, Route, Routes } from 'react-router';

import { ShuffleAllContextModal } from '/@/renderer/features/player/components/shuffle-all-modal';
import { AddToPlaylistContextModal } from '/@/renderer/features/playlists/components/add-to-playlist-context-modal';
import { SaveAndReplaceContextModal } from '/@/renderer/features/playlists/components/save-and-replace-context-modal';
import { UpdatePlaylistContextModal } from '/@/renderer/features/playlists/components/update-playlist-form';
import { SettingsContextModal } from '/@/renderer/features/settings/components/settings-modal';
import { RouterErrorBoundary } from '/@/renderer/features/shared/components/router-error-boundary';
import { ShareItemContextModal } from '/@/renderer/features/sharing/components/share-item-context-modal';
import { AuthenticationOutlet } from '/@/renderer/layouts/authentication-outlet';
import { ResponsiveLayout } from '/@/renderer/layouts/responsive-layout';
import { AppOutlet } from '/@/renderer/router/app-outlet';
import { AppRoute } from '/@/renderer/router/routes';
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

const LoginRoute = lazy(() => import('/@/renderer/features/login/routes/login-route'));

const NoNetworkRoute = lazy(
    () => import('/@/renderer/features/action-required/routes/no-network-route'),
);

const HomeRoute = lazy(() => import('/@/renderer/features/home/routes/home-route'));

const ArtistListRoute = lazy(() => import('/@/renderer/features/artists/routes/artist-list-route'));

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

const GenreDetailRoute = lazy(
    () => import('/@/renderer/features/genres/routes/genre-detail-route'),
);

const FolderListRoute = lazy(() => import('/@/renderer/features/folders/routes/folder-list-route'));

const RadioListRoute = lazy(() => import('/@/renderer/features/radio/routes/radio-list-route'));

const SearchRoute = lazy(() => import('/@/renderer/features/search/routes/search-route'));

const FavoritesRoute = lazy(() => import('/@/renderer/features/favorites/routes/favorites-route'));

const SettingsRoute = lazy(() => import('/@/renderer/features/settings/routes/settings-route'));

export const AppRouter = () => {
    const router = (
        <HashRouter>
            <ModalsProvider
                modals={{
                    addToPlaylist: AddToPlaylistContextModal,
                    base: BaseContextModal,
                    saveAndReplace: SaveAndReplaceContextModal,
                    settings: SettingsContextModal,
                    shareItem: ShareItemContextModal,
                    shuffleAll: ShuffleAllContextModal,
                    updatePlaylist: UpdatePlaylistContextModal,
                }}
            >
                <RouterErrorBoundary>
                    <Routes>
                        <Route element={<AuthenticationOutlet />}>
                            <Route element={<TitlebarOutlet />}>
                                <Route element={<AppOutlet />}>
                                    <Route element={<ResponsiveLayout />}>
                                        <Route element={<HomeRoute />} index />
                                        <Route element={<HomeRoute />} path={AppRoute.HOME} />
                                        <Route element={<SearchRoute />} path={AppRoute.SEARCH} />
                                        <Route
                                            element={<FavoritesRoute />}
                                            path={AppRoute.FAVORITES}
                                        />
                                        <Route
                                            element={<SettingsRoute />}
                                            path={AppRoute.SETTINGS}
                                        />
                                        <Route
                                            element={<NowPlayingRoute />}
                                            path={AppRoute.NOW_PLAYING}
                                        />
                                        <Route path={AppRoute.LIBRARY_GENRES}>
                                            <Route element={<GenreListRoute />} index />
                                            <Route
                                                element={<GenreDetailRoute />}
                                                path={AppRoute.LIBRARY_GENRES_DETAIL}
                                            />
                                        </Route>
                                        <Route
                                            element={<AlbumListRoute />}
                                            path={AppRoute.LIBRARY_ALBUMS}
                                        />
                                        <Route
                                            element={<AlbumDetailRoute />}
                                            path={AppRoute.LIBRARY_ALBUMS_DETAIL}
                                        />
                                        <Route
                                            element={<ArtistListRoute />}
                                            path={AppRoute.LIBRARY_ARTISTS}
                                        />
                                        <Route path={AppRoute.LIBRARY_ARTISTS_DETAIL}>
                                            <Route element={<AlbumArtistDetailRoute />} index />
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
                                            path={AppRoute.FAKE_LIBRARY_ALBUM_DETAILS}
                                        />
                                        <Route
                                            element={<SongListRoute />}
                                            path={AppRoute.LIBRARY_SONGS}
                                        />
                                        <Route
                                            element={<FolderListRoute />}
                                            path={AppRoute.LIBRARY_FOLDERS}
                                        />
                                        <Route
                                            element={<PlaylistListRoute />}
                                            path={AppRoute.PLAYLISTS}
                                        />
                                        <Route element={<RadioListRoute />} path={AppRoute.RADIO} />
                                        <Route
                                            element={<PlaylistDetailSongListRoute />}
                                            path={AppRoute.PLAYLISTS_DETAIL_SONGS}
                                        />
                                        <Route path={AppRoute.LIBRARY_ALBUM_ARTISTS}>
                                            <Route element={<AlbumArtistListRoute />} index />
                                            <Route path={AppRoute.LIBRARY_ALBUM_ARTISTS_DETAIL}>
                                                <Route element={<AlbumArtistDetailRoute />} index />
                                                <Route
                                                    element={<AlbumListRoute />}
                                                    path={
                                                        AppRoute.LIBRARY_ALBUM_ARTISTS_DETAIL_DISCOGRAPHY
                                                    }
                                                />
                                                <Route
                                                    element={<SongListRoute />}
                                                    path={
                                                        AppRoute.LIBRARY_ALBUM_ARTISTS_DETAIL_SONGS
                                                    }
                                                />
                                                <Route
                                                    element={<AlbumArtistDetailTopSongsListRoute />}
                                                    path={
                                                        AppRoute.LIBRARY_ALBUM_ARTISTS_DETAIL_TOP_SONGS
                                                    }
                                                />
                                            </Route>
                                        </Route>
                                        <Route element={<InvalidRoute />} path="*" />
                                    </Route>
                                </Route>
                            </Route>
                        </Route>
                        <Route element={<TitlebarOutlet />}>
                            <Route element={<ResponsiveLayout shell />}>
                                <Route
                                    element={<ActionRequiredRoute />}
                                    path={AppRoute.ACTION_REQUIRED}
                                />
                                <Route element={<LoginRoute />} path={AppRoute.LOGIN} />
                                <Route element={<NoNetworkRoute />} path={AppRoute.NO_NETWORK} />
                            </Route>
                        </Route>
                    </Routes>
                </RouterErrorBoundary>
            </ModalsProvider>
        </HashRouter>
    );

    return <Suspense fallback={<></>}>{router}</Suspense>;
};
