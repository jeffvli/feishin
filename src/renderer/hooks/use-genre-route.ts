import { matchRoutes, useLocation } from 'react-router';
import { GenreTarget, useSettingsStore } from '/@/renderer/store';
import { AppRoute } from '/@/renderer/router/routes';
import { useMemo } from 'react';

export const useGenreRoute = () => {
    const location = useLocation();
    const matchAlbum = matchRoutes(
        [{ path: AppRoute.LIBRARY_GENRES_ALBUMS }, { path: AppRoute.LIBRARY_ALBUMS }],
        location,
    );
    const matchSongs = matchRoutes(
        [{ path: AppRoute.LIBRARY_GENRES_SONGS }, { path: AppRoute.LIBRARY_SONGS }],
        location,
    );

    const baseState = useSettingsStore((state) =>
        state.general.genreTarget === GenreTarget.ALBUM
            ? AppRoute.LIBRARY_GENRES_ALBUMS
            : AppRoute.LIBRARY_GENRES_SONGS,
    );

    return useMemo(() => {
        if (matchAlbum) {
            return AppRoute.LIBRARY_GENRES_ALBUMS;
        }
        if (matchSongs) {
            return AppRoute.LIBRARY_GENRES_SONGS;
        }
        return baseState;
    }, [baseState, matchAlbum, matchSongs]);
};
