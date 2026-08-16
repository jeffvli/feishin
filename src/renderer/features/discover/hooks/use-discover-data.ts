import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import {
    fetchRecordingMetadata,
    listenbrainzQueries,
} from '/@/renderer/features/discover/api/listenbrainz-api';
import { LbPlaylistSummary } from '/@/renderer/features/discover/api/listenbrainz-types';
import { useArtistImages } from '/@/renderer/features/discover/hooks/use-artist-images';
import {
    filterOwnedItems,
    useLibraryIndex,
} from '/@/renderer/features/discover/hooks/use-library-index';
import {
    DiscoverItem,
    filterFreshReleasesByArtists,
    fromArtistStat,
    fromFreshRelease,
    fromPlaylistTrack,
    fromRecommendation,
    fromRecordingStat,
    fromReleaseStat,
    fromSimilarArtist,
    fromSimilarRecording,
    rankSimilar,
} from '/@/renderer/features/discover/utils/lb-adapters';

/**
 * How far along the page is, so the spinner can say something rather than just spin.
 *
 * Worth reporting because ListenBrainz is not a fast or a reliable dependency: a cold request
 * can take twenty seconds, and the service sheds load with 502s. Without this the page is
 * indistinguishable from a hang.
 */
export interface DiscoverProgress {
    /** Sources that gave up after their retries. */
    failed: number;
    /** Sources still waiting, including those retrying after a failure. */
    loading: number;
    ready: number;
    total: number;
}

export interface DiscoverRow {
    /** Artists render as circles and cannot be previewed. */
    isArtist?: boolean;
    items: DiscoverItem[];
    key: string;
    /** How many card rows the carousel stacks. See `FEATURE_ROWS`. */
    rowCount: number;
    title: string;
}

/**
 * Rows given a double-height block instead of a single strip.
 *
 * The weekly playlists are the ones worth the extra room: they are curated, they are the only
 * rows that change on a schedule, and they arrive with fifty tracks where the rest cap at
 * twenty. Giving every row two rows would just be a wall, so this is a short list on purpose.
 */
const FEATURE_ROWS = new Set(['weekly-exploration', 'weekly-jams']);

/** Below this a second row would sit half empty, which looks like a rendering fault. */
const MIN_ITEMS_FOR_TWO_ROWS = 10;

/**
 * How many top entries seed a similarity call.
 *
 * Seeds are sent in one batched request, and each returns around 100 results that overlap
 * heavily, so more seeds buy breadth rather than volume. Five is enough to stop the row being
 * a portrait of a single artist.
 */
const SIMILARITY_SEED_COUNT = 5;

export function useDiscoverData(username: string) {
    const { t } = useTranslation();
    const enabled = Boolean(username);

    const createdFor = useQuery({
        ...listenbrainzQueries.playlistsCreatedFor(username),
        enabled,
    });

    const jamsMbid = playlistMbid(findLatest(createdFor.data, 'Weekly Jams'));
    const explorationMbid = playlistMbid(findLatest(createdFor.data, 'Weekly Exploration'));

    const jams = useQuery(listenbrainzQueries.playlist(jamsMbid));
    const exploration = useQuery(listenbrainzQueries.playlist(explorationMbid));

    const topArtists = useQuery({ ...listenbrainzQueries.topArtists(username), enabled });
    const topReleases = useQuery({ ...listenbrainzQueries.topReleases(username), enabled });
    const topRecordings = useQuery({ ...listenbrainzQueries.topRecordings(username), enabled });
    const recommendations = useQuery({ ...listenbrainzQueries.recommendations(username), enabled });

    // Recommendations arrive as bare MBIDs, so a second call supplies everything renderable,
    // including the Apple Music links that let previews resolve exactly.
    const recommendationMbids = useMemo(
        () => recommendations.data?.map((entry) => entry.recording_mbid) ?? [],
        [recommendations.data],
    );

    const recommendationMetadata = useQuery({
        enabled: recommendationMbids.length > 0,
        gcTime: 1000 * 60 * 60 * 24,
        queryFn: ({ signal }) => fetchRecordingMetadata(recommendationMbids, signal),
        queryKey: ['listenbrainz', 'recording-metadata', recommendationMbids],
        staleTime: 1000 * 60 * 60,
    });

    /**
     * A deliberately wide artist seed, used only to narrow the global fresh-release feed.
     *
     * This is not the same slice as the visible "top artists" row. Matching the feed against a
     * month's top 20 artists found exactly 1 of 3,093 releases; all-time top 1,000 finds 140 of
     * 8,300. The row is worth having only at the wider setting.
     */
    const artistSeed = useQuery({
        ...listenbrainzQueries.topArtists(username, 'all_time', 1000),
        enabled,
    });

    const freshReleases = useQuery({
        ...listenbrainzQueries.freshReleases(username),
        enabled: enabled && (artistSeed.data?.length ?? 0) > 0,
    });

    const similarArtistSeeds = useMemo(
        () =>
            (topArtists.data ?? [])
                .map((artist) => artist.artist_mbid)
                .filter((mbid): mbid is string => Boolean(mbid))
                .slice(0, SIMILARITY_SEED_COUNT),
        [topArtists.data],
    );

    const similarRecordingSeeds = useMemo(
        () =>
            (topRecordings.data ?? [])
                .map((recording) => recording.recording_mbid)
                .filter((mbid): mbid is string => Boolean(mbid))
                .slice(0, SIMILARITY_SEED_COUNT),
        [topRecordings.data],
    );

    const similarArtists = useQuery(listenbrainzQueries.similarArtists(similarArtistSeeds));
    const similarRecordings = useQuery(
        listenbrainzQueries.similarRecordings(similarRecordingSeeds),
    );

    const libraryIndex = useLibraryIndex(enabled);

    const rows = useMemo<DiscoverRow[]>(() => {
        const result: DiscoverRow[] = [];

        const push = (key: string, title: string, items: DiscoverItem[], isArtist?: boolean) => {
            const owned = filterOwnedItems(items, libraryIndex);

            if (owned.length === 0) {
                return;
            }

            const rowCount =
                FEATURE_ROWS.has(key) && owned.length >= MIN_ITEMS_FOR_TWO_ROWS ? 2 : 1;

            result.push({ isArtist, items: owned, key, rowCount, title });
        };

        push(
            'weekly-jams',
            t('page.discover.weeklyJams'),
            (jams.data ?? []).map(fromPlaylistTrack),
        );
        push(
            'weekly-exploration',
            t('page.discover.weeklyExploration'),
            (exploration.data ?? []).map(fromPlaylistTrack),
        );
        push(
            'recommended',
            t('page.discover.recommended'),
            recommendationMetadata.data
                ? recommendationMbids
                      .map((mbid) => fromRecommendation(mbid, recommendationMetadata.data))
                      .filter((item): item is DiscoverItem => item !== null)
                : [],
        );
        // The seeds come back among their own results, and an artist is not a suggestion of
        // itself. Library dedupe would usually catch these, but only for what the user owns.
        push(
            'similar-tracks',
            t('page.discover.similarTracks'),
            rankSimilar(
                (similarRecordings.data ?? []).filter(
                    (entry) => !similarRecordingSeeds.includes(entry.recording_mbid),
                ),
                (entry) => entry.recording_mbid,
            ).map(fromSimilarRecording),
        );
        push(
            'similar-artists',
            t('page.discover.similarArtists'),
            rankSimilar(
                (similarArtists.data ?? []).filter(
                    (entry) => !similarArtistSeeds.includes(entry.artist_mbid),
                ),
                (entry) => entry.artist_mbid,
            ).map(fromSimilarArtist),
            true,
        );
        push(
            'fresh-releases',
            t('page.discover.freshReleases'),
            filterFreshReleasesByArtists(freshReleases.data ?? [], artistSeed.data ?? []).map(
                fromFreshRelease,
            ),
        );
        push(
            'top-tracks',
            t('page.discover.topTracks'),
            (topRecordings.data ?? []).map(fromRecordingStat),
        );
        push(
            'top-releases',
            t('page.discover.topReleases'),
            (topReleases.data ?? []).map(fromReleaseStat),
        );
        push(
            'top-artists',
            t('page.discover.topArtists'),
            (topArtists.data ?? []).map(fromArtistStat),
            true,
        );

        return result;
    }, [
        t,
        libraryIndex,
        jams.data,
        exploration.data,
        recommendationMbids,
        recommendationMetadata.data,
        similarArtists.data,
        similarArtistSeeds,
        similarRecordings.data,
        similarRecordingSeeds,
        freshReleases.data,
        artistSeed.data,
        topArtists.data,
        topRecordings.data,
        topReleases.data,
    ]);

    // Looked up after filtering, so no request is spent on an artist that is about to be hidden.
    const artistItems = useMemo(
        () => rows.filter((row) => row.isArtist).flatMap((row) => row.items),
        [rows],
    );

    const artistImages = useArtistImages(artistItems);

    const rowsWithImages = useMemo<DiscoverRow[]>(() => {
        if (artistImages.size === 0) {
            return rows;
        }

        return rows.map((row) => {
            if (!row.isArtist) {
                return row;
            }

            return {
                ...row,
                items: row.items.map((item) => {
                    const imageUrl = artistImages.get(item.id);

                    return imageUrl ? { ...item, imageUrl } : item;
                }),
            };
        });
    }, [rows, artistImages]);

    // The sources the page is actually built from. `createdFor` is excluded: it is a lookup
    // that feeds the two playlist queries rather than a row of its own, so counting it would
    // report a source the reader never sees.
    const queries = [
        jams,
        exploration,
        recommendationMetadata,
        similarArtists,
        similarRecordings,
        freshReleases,
        topArtists,
        topReleases,
        topRecordings,
    ];

    // Counted on every render rather than memoized: it is four integers over ten sources, and
    // the dependency would be the query statuses themselves, which is the whole computation.
    // The library index counts as a source because the page genuinely waits on it.
    const progress: DiscoverProgress = {
        failed: 0,
        loading: 0,
        ready: libraryIndex.isReady ? 1 : 0,
        total: queries.length + 1,
    };

    for (const query of queries) {
        if (query.isError) {
            progress.failed += 1;
        } else if (query.isSuccess) {
            progress.ready += 1;
        }
    }

    progress.loading = progress.total - progress.ready - progress.failed;

    return {
        // Every row fetches independently, so a slow or failing source never blanks the page.
        isError: queries.every((query) => query.isError),
        // The first library scan is the slow one and is worth naming, because it is the only
        // wait the user cannot attribute to ListenBrainz being slow.
        isIndexing: !libraryIndex.isReady,
        // Nothing renders before the library index arrives, because a row built without it
        // would be a list of music the user already owns, which is the opposite of the point.
        isPending: rowsWithImages.length === 0 && progress.loading > 0,
        progress,
        rows: rowsWithImages,
    };
}

/** ListenBrainz returns generated playlists newest first, so the first match is this week's. */
function findLatest(playlists: LbPlaylistSummary[] | undefined, prefix: string) {
    return playlists?.find((entry) => entry.playlist.title.startsWith(prefix));
}

/** The MBID is the last path segment of a `https://listenbrainz.org/playlist/{mbid}` URL. */
function playlistMbid(summary: LbPlaylistSummary | undefined): null | string {
    return summary?.playlist.identifier.split('/').pop() ?? null;
}
