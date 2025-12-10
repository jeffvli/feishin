import { AxiosHeaders } from 'axios';
import isElectron from 'is-electron';
import orderBy from 'lodash/orderBy';
import shuffle from 'lodash/shuffle';
import semverCoerce from 'semver/functions/coerce';
import semverGte from 'semver/functions/gte';
import { z } from 'zod';

import {
    Album,
    AlbumArtist,
    AlbumArtistListSort,
    AlbumListSort,
    ArtistListSort,
    LibraryItem,
    ServerListItem,
    Song,
    SongListSort,
    SortOrder,
} from '/@/shared/types/domain-types';
import { ServerFeature } from '/@/shared/types/features-types';

// Since ts-rest client returns a strict response type, we need to add the headers to the body object
export const resultWithHeaders = <ItemType extends z.ZodTypeAny>(itemSchema: ItemType) => {
    return z.object({
        data: itemSchema,
        headers: z.instanceof(AxiosHeaders),
    });
};

export const resultSubsonicBaseResponse = <ItemType extends z.ZodRawShape>(
    itemSchema: ItemType,
) => {
    return z.object({
        'subsonic-response': z
            .object({
                status: z.string(),
                version: z.string(),
            })
            .extend(itemSchema),
    });
};

export const hasFeature = (server: null | ServerListItem, feature: ServerFeature): boolean => {
    if (!server || !server.features) {
        return false;
    }

    return (server.features[feature]?.length || 0) > 0;
};

export const hasFeatureWithVersion = (
    server: null | ServerListItem,
    feature: ServerFeature,
    version: number,
): boolean => {
    if (!server || !server.features) {
        return false;
    }

    return (server.features[feature] ?? []).includes(version);
};

export type VersionInfo = ReadonlyArray<
    [string, Partial<Record<ServerFeature, readonly number[]>>]
>;

/**
 * Returns the available server features given the version string.
 * @param versionInfo a list, in DECREASING VERSION order, of the features supported by the server.
 *  The first version match will automatically consider the rest matched.
 * @example
 * ```
 * // The CORRECT way to order
 * const VERSION_INFO: VersionInfo = [
 *   ['0.49.3', { [ServerFeature.SHARING_ALBUM_SONG]: [1] }],
 *   ['0.48.0', { [ServerFeature.PLAYLISTS_SMART]: [1] }],
 * ];
 * // INCORRECT way to order
 * const VERSION_INFO: VersionInfo = [
 *   ['0.48.0', { [ServerFeature.PLAYLISTS_SMART]: [1] }],
 *   ['0.49.3', { [ServerFeature.SHARING_ALBUM_SONG]: [1] }],
 * ];
 *  ```
 * @param version the version string (SemVer)
 * @returns a Record containing the matched features (if any) and their versions
 */
export const getFeatures = (
    versionInfo: VersionInfo,
    version: string,
): Partial<Record<ServerFeature, number[]>> => {
    const cleanVersion = semverCoerce(version);
    const features: Partial<Record<ServerFeature, number[]>> = {};
    let matched = cleanVersion === null;

    for (const [version, supportedFeatures] of versionInfo) {
        if (!matched) {
            matched = semverGte(cleanVersion!, version);
        }

        if (matched) {
            for (const [feature, feat] of Object.entries(supportedFeatures)) {
                if (feature in features) {
                    features[feature].push(...feat);
                } else {
                    features[feature] = [...feat];
                }
            }
        }
    }

    return features;
};

export const getClientType = (): string => {
    if (isElectron()) {
        return 'Desktop Client';
    }
    const agent = navigator.userAgent;
    switch (true) {
        case agent.toLowerCase().indexOf('edge') > -1:
            return 'Microsoft Edge';
        case agent.toLowerCase().indexOf('edg/') > -1:
            return 'Edge Chromium'; // Match also / to avoid matching for the older Edge
        case agent.toLowerCase().indexOf('opr') > -1:
            return 'Opera';
        case agent.toLowerCase().indexOf('chrome') > -1:
            return 'Chrome';
        case agent.toLowerCase().indexOf('trident') > -1:
            return 'Internet Explorer';
        case agent.toLowerCase().indexOf('firefox') > -1:
            return 'Firefox';
        case agent.toLowerCase().indexOf('safari') > -1:
            return 'Safari';
        default:
            return 'PC';
    }
};

export const SEPARATOR_STRING = ' · ';

export const sortSongList = (songs: Song[], sortBy: SongListSort, sortOrder: SortOrder) => {
    let results: Song[] = songs;

    const order = sortOrder === SortOrder.ASC ? 'asc' : 'desc';

    switch (sortBy) {
        case SongListSort.ALBUM:
            results = orderBy(
                results,
                [(v) => v.album?.toLowerCase(), 'discNumber', 'trackNumber'],
                [order, 'asc', 'asc'],
            );
            break;

        case SongListSort.ALBUM_ARTIST:
            results = orderBy(
                results,
                [(v) => v.albumArtists[0]?.name.toLowerCase(), 'discNumber', 'trackNumber'],
                [order, order, 'asc', 'asc'],
            );
            break;

        case SongListSort.ARTIST:
            results = orderBy(
                results,
                [(v) => v.artistName?.toLowerCase(), 'discNumber', 'trackNumber'],
                [order, order, 'asc', 'asc'],
            );
            break;

        case SongListSort.BPM:
            results = orderBy(results, ['bpm'], [order]);
            break;

        case SongListSort.CHANNELS:
            results = orderBy(results, ['channels'], [order]);
            break;

        case SongListSort.COMMENT:
            results = orderBy(results, ['comment'], [order]);
            break;

        case SongListSort.DURATION:
            results = orderBy(results, ['duration'], [order]);
            break;

        case SongListSort.FAVORITED:
            results = orderBy(results, ['userFavorite', (v) => v.name.toLowerCase()], [order]);
            break;

        case SongListSort.GENRE:
            results = orderBy(
                results,
                [
                    (v) => v.genres?.[0]?.name.toLowerCase(),
                    (v) => v.album?.toLowerCase(),
                    'discNumber',
                    'trackNumber',
                ],
                [order, order, 'asc', 'asc'],
            );
            break;

        case SongListSort.ID:
            results = [...results];

            if (order === 'desc') {
                results.reverse();
            }
            break;

        case SongListSort.NAME:
            results = orderBy(results, [(v) => v.name.toLowerCase()], [order]);
            break;

        case SongListSort.PLAY_COUNT:
            results = orderBy(results, ['playCount'], [order]);
            break;

        case SongListSort.RANDOM:
            results = shuffle(results);
            break;

        case SongListSort.RATING:
            results = orderBy(results, ['userRating', (v) => v.name.toLowerCase()], [order]);
            break;

        case SongListSort.RECENTLY_ADDED:
            results = orderBy(results, ['createdAt'], [order]);
            break;

        case SongListSort.RECENTLY_PLAYED:
            results = orderBy(results, ['lastPlayedAt'], [order]);
            break;

        case SongListSort.RELEASE_DATE:
            results = orderBy(results, ['releaseDate'], [order]);
            break;

        case SongListSort.YEAR:
            results = orderBy(
                results,
                ['releaseYear', (v) => v.album?.toLowerCase(), 'discNumber', 'track'],
                [order, 'asc', 'asc', 'asc'],
            );
            break;

        default:
            break;
    }

    return results;
};

export const sortSongsByFetchedOrder = (
    songs: Song[],
    fetchedIds: string[],
    itemType: LibraryItem,
): Song[] => {
    // For folders, songs are already in the correct order
    if (itemType === LibraryItem.FOLDER) {
        return songs;
    }

    // Group songs by the fetched ID they belong to
    const songsByFetchedId = new Map<string, Song[]>();

    for (const song of songs) {
        let matchedId: string | undefined;

        switch (itemType) {
            case LibraryItem.ALBUM:
                matchedId = fetchedIds.find((id) => song.albumId === id);
                break;
            case LibraryItem.ALBUM_ARTIST:
                matchedId = fetchedIds.find((id) =>
                    song.albumArtists.some((artist) => artist.id === id),
                );
                break;
            case LibraryItem.ARTIST:
                matchedId = fetchedIds.find((id) =>
                    song.artists.some((artist) => artist.id === id),
                );
                break;
            case LibraryItem.GENRE:
                matchedId = fetchedIds.find((id) => song.genres.some((genre) => genre.id === id));
                break;
            case LibraryItem.PLAYLIST:
                // For playlists, we might need to track which playlist each song came from
                // This is a simplified approach - you may need to adjust based on your data structure
                matchedId = fetchedIds.find((id) => song.playlistItemId === id);
                break;
            default:
                break;
        }

        if (matchedId) {
            if (!songsByFetchedId.has(matchedId)) {
                songsByFetchedId.set(matchedId, []);
            }
            songsByFetchedId.get(matchedId)!.push(song);
        }
    }

    // Sort each group by discNumber and trackNumber
    for (const [fetchedId, groupSongs] of songsByFetchedId.entries()) {
        const sortedGroup = orderBy(groupSongs, ['discNumber', 'trackNumber'], ['asc', 'asc']);
        songsByFetchedId.set(fetchedId, sortedGroup);
    }

    // Combine groups in the order of fetchedIds
    const result: Song[] = [];
    for (const fetchedId of fetchedIds) {
        const groupSongs = songsByFetchedId.get(fetchedId);
        if (groupSongs) {
            result.push(...groupSongs);
        }
    }

    // Add any songs that didn't match any fetched ID at the end
    const matchedIds = new Set(result.map((s) => s.id));
    const unmatchedSongs = songs.filter((s) => !matchedIds.has(s.id));
    if (unmatchedSongs.length > 0) {
        const sortedUnmatched = orderBy(
            unmatchedSongs,
            ['discNumber', 'trackNumber'],
            ['asc', 'asc'],
        );
        result.push(...sortedUnmatched);
    }

    return result;
};

export const sortAlbumArtistList = (
    artists: AlbumArtist[],
    sortBy: AlbumArtistListSort | ArtistListSort,
    sortOrder: SortOrder,
) => {
    const order = sortOrder === SortOrder.ASC ? 'asc' : 'desc';

    let results = artists;

    switch (sortBy) {
        case AlbumArtistListSort.ALBUM_COUNT:
            results = orderBy(artists, ['albumCount', (v) => v.name.toLowerCase()], [order, 'asc']);
            break;

        case AlbumArtistListSort.FAVORITED:
            results = orderBy(artists, ['starred'], [order]);
            break;

        case AlbumArtistListSort.NAME:
            results = orderBy(artists, [(v) => v.name.toLowerCase()], [order]);
            break;

        case AlbumArtistListSort.RATING:
            results = orderBy(artists, ['userRating'], [order]);
            break;

        default:
            break;
    }

    return results;
};
export const sortAlbumList = (albums: Album[], sortBy: AlbumListSort, sortOrder: SortOrder) => {
    let results = albums;

    const order = sortOrder === SortOrder.ASC ? 'asc' : 'desc';

    switch (sortBy) {
        case AlbumListSort.ALBUM_ARTIST:
            results = orderBy(
                results,
                ['albumArtist', (v) => v.name.toLowerCase()],
                [order, 'asc'],
            );
            break;
        case AlbumListSort.DURATION:
            results = orderBy(results, ['duration'], [order]);
            break;
        case AlbumListSort.FAVORITED:
            results = orderBy(results, ['starred'], [order]);
            break;
        case AlbumListSort.NAME:
            results = orderBy(results, [(v) => v.name.toLowerCase()], [order]);
            break;
        case AlbumListSort.PLAY_COUNT:
            results = orderBy(results, ['playCount'], [order]);
            break;
        case AlbumListSort.RANDOM:
            results = shuffle(results);
            break;
        case AlbumListSort.RATING:
            results = orderBy(results, ['userRating'], [order]);
            break;
        case AlbumListSort.RECENTLY_ADDED:
            results = orderBy(results, ['createdAt'], [order]);
            break;
        case AlbumListSort.RECENTLY_PLAYED:
            results = orderBy(results, ['lastPlayedAt'], [order]);
            break;
        case AlbumListSort.SONG_COUNT:
            results = orderBy(results, ['songCount'], [order]);
            break;
        case AlbumListSort.YEAR:
            results = orderBy(results, ['releaseYear'], [order]);
            break;
        default:
            break;
    }

    return results;
};
