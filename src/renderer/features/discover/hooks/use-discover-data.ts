import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import {
    fetchRecordingMetadata,
    listenbrainzQueries,
} from '/@/renderer/features/discover/api/listenbrainz-api';
import { LbPlaylistSummary } from '/@/renderer/features/discover/api/listenbrainz-types';
import { useAlbumImages } from '/@/renderer/features/discover/hooks/use-album-images';
import { useArtistImages } from '/@/renderer/features/discover/hooks/use-artist-images';
import {
    filterOwnedItems,
    useLibraryIndex,
} from '/@/renderer/features/discover/hooks/use-library-index';
import {
    DiscoverItem,
    filterFreshReleasesByArtists,
    fromFreshRelease,
    fromPlaylistTrack,
    fromRecommendation,
    fromRecordingStat,
    fromSimilarArtist,
    fromSimilarRecording,
    mergeDiscoverSources,
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
    layout: DiscoverRowLayout;
    /** How many card rows a strip stacks. Ignored by the other layouts. */
    rowCount: number;
    title: string;
}

/**
 * How a row presents itself.
 *
 * Three rows of identical card strips would read as one undifferentiated wall, so the layout is
 * a property of the row rather than a global choice. `feature` is large hero cards, `strip` is
 * the standard carousel.
 */
export type DiscoverRowLayout = 'feature' | 'strip';

/**
 * The layout each row asks for, where it wants something other than a plain strip.
 *
 * Fresh releases earn the hero treatment because they are the only row that is genuinely news:
 * a handful of albums, each with real cover art, that did not exist last week. The merged
 * suggestion row is deliberately not a hero, because a hero carousel shows three items at a
 * time and that row exists to be browsed by the dozen.
 */
const ROW_LAYOUTS: Record<string, DiscoverRowLayout> = {
    'fresh-releases': 'feature',
};

/**
 * Rows given a double-height block instead of a single strip.
 *
 * The merged row is the one worth the extra room: it is where every track suggestion lands, so
 * it arrives with an order of magnitude more items than anything else on the page. Giving every
 * row two rows would just be a wall, so this is a short list on purpose.
 */
const TWO_ROW_KEYS = new Set(['new-to-you']);

/** Below this a second row would sit half empty, which looks like a rendering fault. */
const MIN_ITEMS_FOR_TWO_ROWS = 10;

/**
 * Below this a row is not worth its own heading.
 *
 * A carousel holding one card does not read as a short list, it reads as a layout that broke.
 * Library filtering is what makes this necessary: a source can start with fifty tracks and
 * survive with one, and that one is better folded away than announced.
 */
const MIN_ROW_ITEMS = 3;

/**
 * How many merged suggestions survive to the row, counted after the owned ones are dropped.
 *
 * Five sources of up to fifty each is more than anyone scrolls, and every card past the fold
 * still costs a DOM node and an artwork request. This is roughly three screens of a two-row
 * strip, which is a browse rather than an inventory.
 */
const MERGED_ITEM_LIMIT = 40;

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

    // Fetched for its similarity seeds rather than for a row of its own: "artists you play"
    // is a fact the user already knows, and one they cannot act on for anything unowned.
    const topArtists = useQuery({ ...listenbrainzQueries.topArtists(username), enabled });
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

        const push = (
            key: string,
            title: string,
            items: DiscoverItem[],
            options?: { isArtist?: boolean; limit?: number },
        ) => {
            // Capped after filtering rather than before. Whether a suggestion is any good and
            // whether the user already owns it are unrelated, so a cap applied first would spend
            // the whole budget on tracks that are about to be hidden. Measured on a real account:
            // the merged list is 138 entries and the head of it is almost entirely owned.
            const unowned = filterOwnedItems(items, libraryIndex).slice(0, options?.limit);

            if (unowned.length < MIN_ROW_ITEMS) {
                return;
            }

            const isTall = TWO_ROW_KEYS.has(key) && unowned.length >= MIN_ITEMS_FOR_TWO_ROWS;

            // Artists are circles with no track to preview, so the hero card does not suit them
            // however the row is otherwise configured.
            const layout = options?.isArtist ? 'strip' : (ROW_LAYOUTS[key] ?? 'strip');

            result.push({
                isArtist: options?.isArtist,
                items: unowned,
                key,
                layout,
                rowCount: isTall ? 2 : 1,
                title,
            });
        };

        // Every track source answers the same question, so they are one row. The order is the
        // interleave order: collaborative filtering first because it is the least derivative of
        // what the user already listens to, play counts last because they are the most.
        push(
            'new-to-you',
            t('page.discover.newToYou'),
            mergeDiscoverSources([
                recommendationMetadata.data
                    ? recommendationMbids
                          .map((mbid) => fromRecommendation(mbid, recommendationMetadata.data))
                          .filter((item): item is DiscoverItem => item !== null)
                    : [],
                (jams.data ?? []).map(fromPlaylistTrack),
                (exploration.data ?? []).map(fromPlaylistTrack),
                // The seeds come back among their own results, and a track is not a suggestion
                // of itself. Library filtering would usually catch these, but only for what the
                // user owns, and a seed can be something they merely played somewhere else.
                rankSimilar(
                    (similarRecordings.data ?? []).filter(
                        (entry) => !similarRecordingSeeds.includes(entry.recording_mbid),
                    ),
                    (entry) => entry.recording_mbid,
                ).map(fromSimilarRecording),
                (topRecordings.data ?? []).map(fromRecordingStat),
            ]),
            { limit: MERGED_ITEM_LIMIT },
        );
        push(
            'fresh-releases',
            t('page.discover.freshReleases'),
            filterFreshReleasesByArtists(freshReleases.data ?? [], artistSeed.data ?? []).map(
                fromFreshRelease,
            ),
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
            { isArtist: true },
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
        topRecordings.data,
    ]);

    // Looked up after filtering, so no request is spent on an artist that is about to be hidden.
    const artistItems = useMemo(
        () => rows.filter((row) => row.isArtist).flatMap((row) => row.items),
        [rows],
    );

    const artistImages = useArtistImages(artistItems);

    /**
     * Hero rows first, because the album lookup is capped.
     *
     * A missing cover is most conspicuous on a large card, so when the cap bites it should bite
     * the small ones.
     */
    const albumItems = useMemo(
        () =>
            [...rows]
                .filter((row) => !row.isArtist)
                .sort((a, b) => Number(b.layout === 'feature') - Number(a.layout === 'feature'))
                .flatMap((row) => row.items),
        [rows],
    );

    const albumImages = useAlbumImages(albumItems);

    const rowsWithImages = useMemo<DiscoverRow[]>(() => {
        if (artistImages.size === 0 && albumImages.size === 0) {
            return rows;
        }

        return rows.map((row) => ({
            ...row,
            items: row.items.map((item) => {
                // A resolved name lookup wins over the Cover Art Archive URL the item was built
                // with, because that URL is served by archive.org, which has been timing out
                // rather than answering. A slow failure leaves the card blank for as long as the
                // browser's connect timeout, where a lookup either has the cover or does not.
                const imageUrl = row.isArtist
                    ? artistImages.get(item.id)
                    : albumImages.get(item.id);

                return imageUrl ? { ...item, imageUrl } : item;
            }),
        }));
    }, [rows, artistImages, albumImages]);

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
