import { useLocation } from 'react-router';
import { GenreTarget, useSettingsStore } from '/@/renderer/store';
import { AppRoute } from '/@/renderer/router/routes';
import { useMemo } from 'react';

const ALBUM_REGEX = /albums$/;
const SONG_REGEX = /songs$/;

export const useGenreRoute = () => {
    const { pathname } = useLocation();
    const matchAlbum = ALBUM_REGEX.test(pathname);
    const matchSongs = SONG_REGEX.test(pathname);

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
