import { generatePath } from 'react-router';

import { AppRoute } from '/@/renderer/router/routes';
import { LibraryItem } from '/@/shared/types/domain-types';

export const getTitlePath = (itemType: LibraryItem, id: string) => {
    switch (itemType) {
        case LibraryItem.ALBUM:
            return generatePath(AppRoute.LIBRARY_ALBUMS_DETAIL, { albumId: id });
        case LibraryItem.ALBUM_ARTIST:
            return generatePath(AppRoute.LIBRARY_ALBUM_ARTISTS_DETAIL, { albumArtistId: id });
        case LibraryItem.ARTIST:
            return generatePath(AppRoute.LIBRARY_ARTISTS_DETAIL, { artistId: id });
        case LibraryItem.GENRE:
            return generatePath(AppRoute.LIBRARY_GENRES_ALBUMS, { genreId: id });
        case LibraryItem.PLAYLIST:
            return generatePath(AppRoute.PLAYLISTS_DETAIL_SONGS, { playlistId: id });
        default:
            return null;
    }
};
