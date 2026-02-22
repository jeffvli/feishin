import { useEffect, useMemo } from 'react';

import { useListContext } from '/@/renderer/context/list-context';
import { usePlaylistSongListFilters } from '/@/renderer/features/playlists/hooks/use-playlist-song-list-filters';
import { useSearchTermFilter } from '/@/renderer/features/shared/hooks/use-search-term-filter';
import { FILTER_KEYS } from '/@/renderer/features/shared/utils';
import { searchLibraryItems } from '/@/renderer/features/shared/utils';
import { sortSongList } from '/@/shared/api/utils';
import {
    LibraryItem,
    PlaylistSongListResponse,
    Song,
    SongListSort,
    SortOrder,
} from '/@/shared/types/domain-types';

export function applyClientSideSongFilters(songs: Song[], query: Record<string, unknown>): Song[] {
    let result = songs;

    const favorite = query[FILTER_KEYS.SONG.FAVORITE] as boolean | undefined;
    if (favorite === true) {
        result = result.filter((s) => s.userFavorite === true);
    } else if (favorite === false) {
        result = result.filter((s) => s.userFavorite === false);
    }

    const hasRating = query[FILTER_KEYS.SONG.HAS_RATING] as boolean | undefined;
    if (hasRating === true) {
        result = result.filter((s) => s.userRating != null && s.userRating > 0);
    } else if (hasRating === false) {
        result = result.filter((s) => s.userRating == null || s.userRating === 0);
    }

    const albumArtistIdsMode =
        (query[FILTER_KEYS.SONG.ALBUM_ARTIST_IDS_MODE] as 'and' | 'or' | undefined) ?? 'and';
    const albumArtistIds = query[FILTER_KEYS.SONG.ALBUM_ARTIST_IDS] as string[] | undefined;
    if (albumArtistIds?.length) {
        if (albumArtistIdsMode === 'and') {
            result = result.filter((s) =>
                albumArtistIds!.every((id) => s.albumArtists?.some((a) => a.id === id)),
            );
        } else {
            const set = new Set(albumArtistIds);
            result = result.filter((s) => s.albumArtists?.some((a) => a.id && set.has(a.id)));
        }
    }

    const artistIdsMode =
        (query[FILTER_KEYS.SONG.ARTIST_IDS_MODE] as 'and' | 'or' | undefined) ?? 'and';
    const artistIds = query[FILTER_KEYS.SONG.ARTIST_IDS] as string[] | undefined;
    if (artistIds?.length) {
        if (artistIdsMode === 'and') {
            result = result.filter((s) =>
                artistIds!.every((id) => s.artists?.some((a) => a.id === id)),
            );
        } else {
            const set = new Set(artistIds);
            result = result.filter((s) => s.artists?.some((a) => a.id && set.has(a.id)));
        }
    }

    const genreIdsMode =
        (query[FILTER_KEYS.SONG.GENRE_ID_MODE] as 'and' | 'or' | undefined) ?? 'and';
    const genreIds = query[FILTER_KEYS.SONG.GENRE_ID] as string[] | undefined;
    if (genreIds?.length) {
        if (genreIdsMode === 'and') {
            result = result.filter((s) =>
                genreIds!.every((id) => s.genres?.some((g) => g.id === id)),
            );
        } else {
            const set = new Set(genreIds);
            result = result.filter((s) => s.genres?.some((g) => g.id && set.has(g.id)));
        }
    }

    const minYear = query[FILTER_KEYS.SONG.MIN_YEAR] as number | undefined;
    if (minYear != null) {
        result = result.filter((s) => s.releaseYear != null && s.releaseYear >= minYear);
    }

    const maxYear = query[FILTER_KEYS.SONG.MAX_YEAR] as number | undefined;
    if (maxYear != null) {
        result = result.filter((s) => s.releaseYear != null && s.releaseYear <= maxYear);
    }

    return result;
}

export function usePlaylistTrackList(data: PlaylistSongListResponse | undefined): {
    sortedAndFilteredSongs: Song[];
    totalCount: number;
} {
    const { setItemCount, setListData } = useListContext();
    const { searchTerm } = useSearchTermFilter();
    const { query } = usePlaylistSongListFilters();

    const sortedAndFilteredSongs = useMemo(() => {
        const raw = data?.items ?? [];
        const filtered = applyClientSideSongFilters(raw, query as Record<string, unknown>);
        const searched = searchTerm
            ? searchLibraryItems(filtered, searchTerm, LibraryItem.SONG)
            : filtered;
        return sortSongList(
            searched,
            (query.sortBy as SongListSort) ?? SongListSort.ID,
            (query.sortOrder as SortOrder) ?? SortOrder.ASC,
        );
    }, [data?.items, query, searchTerm]);

    const totalCount = sortedAndFilteredSongs.length;

    useEffect(() => {
        setListData?.(sortedAndFilteredSongs);
        setItemCount?.(totalCount);
    }, [query, searchTerm, setListData, setItemCount, sortedAndFilteredSongs, totalCount]);

    return { sortedAndFilteredSongs, totalCount };
}
