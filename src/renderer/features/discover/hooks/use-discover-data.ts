import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
    fetchRecordingMetadata,
    listenbrainzQueries,
} from '/@/renderer/features/discover/api/listenbrainz-api';
import { LbPlaylistSummary } from '/@/renderer/features/discover/api/listenbrainz-types';
import { musicbrainzQueries } from '/@/renderer/features/discover/api/musicbrainz-api';
import { useAlbumImages } from '/@/renderer/features/discover/hooks/use-album-images';
import { useArtistImages } from '/@/renderer/features/discover/hooks/use-artist-images';
import {
    filterOwnedItems,
    useLibraryIndex,
} from '/@/renderer/features/discover/hooks/use-library-index';
import {
    filterHeardItems,
    useListenIndex,
} from '/@/renderer/features/discover/hooks/use-listen-index';
import {
    AlbumSpotlight,
    pickAlbumSpotlight,
} from '/@/renderer/features/discover/utils/album-spotlight';
import { hasExcludedGenre } from '/@/renderer/features/discover/utils/genre-filter';
import {
    bySeed,
    DiscoverItem,
    fromFreshRelease,
    fromPlaylistTrack,
    fromRecommendation,
    fromRecordingStat,
    fromRelatedBand,
    fromSimilarArtist,
    fromSimilarRecording,
    mergeDiscoverSources,
    rankSimilar,
    sortByReleaseDate,
} from '/@/renderer/features/discover/utils/lb-adapters';
import { normalizeName } from '/@/renderer/features/discover/utils/library-match';
import { useSettingsStore } from '/@/renderer/store';
import { logger } from '/@/renderer/utils/logger';

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
}

export interface DiscoverRow {
    /** Set only on a `spotlight` row, which renders the album rather than the items. */
    album?: AlbumSpotlight;
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
export type DiscoverRowLayout = 'feature' | 'spotlight' | 'strip';

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
const TWO_ROW_KEYS = new Set<string>();

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
 * heavily, so more seeds buy breadth rather than volume.
 *
 * Five only buys that breadth because the results are ranked per seed and then interleaved. On
 * the pooled ordering this replaced, the count made no difference at all: scores are not
 * comparable between seeds, so the most played seed took nineteen of twenty cards however many
 * seeds were sent. See `bySeed`.
 */
const SIMILARITY_SEED_COUNT = 5;

/**
 * `count` evenly spaced picks from `items`, always including the first.
 *
 * Taking the head instead is what made the similar-artist row read as one genre. The statistics
 * it seeds from are ranked by play count, and the top of that ranking is whatever the listener
 * has been on lately: five consecutive entries are usually five records off the same shelf.
 * Spreading over the whole list keeps the most played seed and reaches the rest of the twenty,
 * which is a wider account of the same month rather than a different one.
 */
function spread<T>(items: T[], count: number): T[] {
    if (items.length <= count) {
        return items;
    }

    const step = items.length / count;

    return Array.from({ length: count }, (_, index) => items[Math.floor(index * step)]);
}

/** How many similar listeners to read. Each is one request. */
const PEER_COUNT = 8;

/**
 * How many years of Top Missed Recordings to pull. Each is a request.
 *
 * Ten exist. Two is a hundred tracks before any filtering, which already exceeds what the merged
 * row shows, and the rest of the allowance is needed by the metadata batches.
 */
const MISSED_YEARS = 2;

/**
 * How deep to read each top-artist statistic before spreading seeds across it.
 *
 * Wider than the default twenty because the all-time list is the one expected to be varied, and
 * spreading over a longer list is what reaches past the few artists that dominate a decade.
 */
const TOP_ARTIST_COUNT = 40;

/** How many similar artists reach the row, counted after the owned ones are dropped. */
const ARTIST_ROW_LIMIT = 20;

/**
 * How far down each peer's list the category check reaches.
 *
 * Genres cost a request per 25 recordings and the peers together return several hundred, so
 * this is bounded. It is not a compromise on the case it exists for: a record reaches the row
 * by ranking high for its peer, and one listener playing a single thing repeatedly is by
 * definition the top of their list.
 */
const GENRE_CHECK_PER_PEER = 15;

export function useDiscoverData(username: string) {
    const { t } = useTranslation();
    const enabled = Boolean(username);

    const createdFor = useQuery({
        ...listenbrainzQueries.playlistsCreatedFor(username),
        enabled,
    });

    const jamsMbid = playlistMbid(findLatest(createdFor.data, 'Weekly Jams'));
    const explorationMbid = playlistMbid(findLatest(createdFor.data, 'Weekly Exploration'));

    /*
     * Daily Jams, which is the only source on this page that differs between two visits in a week.
     *
     * Everything else is computed weekly or cached for a day, so a listener opening Discover on
     * Wednesday sees exactly what they saw on Monday. That is the difference between a page worth
     * returning to and a page worth reading once.
     */
    const dailyMbid = playlistMbid(findLatest(createdFor.data, 'Daily Jams'));

    /*
     * Top Missed Recordings, which ListenBrainz builds and this page was ignoring.
     *
     * In their words it "features recordings that were listened to by users similar to you" and
     * "aims to introduce you to new music". Missed is the operative word: it is defined as what
     * comparable listeners played and this one did not, so unlike every other source here it is
     * new by construction rather than new after filtering.
     *
     * One exists per year back to 2016 and taking all of them would spend ten requests out of an
     * allowance of thirty per ten seconds, which is what starved the metadata batches before.
     * Two years is a hundred candidates, already more than the row can show.
     */
    const missedMbids = useMemo(
        () =>
            (createdFor.data ?? [])
                .filter((entry) => entry.playlist.title.startsWith('Top Missed Recordings'))
                .slice(0, MISSED_YEARS)
                .map((entry) => playlistMbid(entry)),
        [createdFor.data],
    );

    const jams = useQuery(listenbrainzQueries.playlist(jamsMbid));
    const exploration = useQuery(listenbrainzQueries.playlist(explorationMbid));
    const daily = useQuery(listenbrainzQueries.playlist(dailyMbid));
    const missedFirst = useQuery(listenbrainzQueries.playlist(missedMbids[0] ?? ''));
    const missedSecond = useQuery(listenbrainzQueries.playlist(missedMbids[1] ?? ''));

    // Fetched for its similarity seeds rather than for a row of its own: "artists you play"
    // is a fact the user already knows, and one they cannot act on for anything unowned.
    const topArtists = useQuery({ ...listenbrainzQueries.topArtists(username), enabled });

    /*
     * The same statistic over the whole history rather than the last month.
     *
     * Every similarity row on the page was seeded from `range=month`, so all of them describe
     * the same four weeks and come back with the same neighbourhood. Measured on a real account
     * that neighbourhood was 88% to 99% one genre while the listening it came from was 82%.
     * A listener's decade is more varied than their month, and reaching it costs one request.
     */
    const topArtistsAllTime = useQuery({
        ...listenbrainzQueries.topArtists(username, 'all_time', TOP_ARTIST_COUNT),
        enabled,
    });
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

    const freshReleases = useQuery({ ...listenbrainzQueries.freshReleases(username), enabled });

    // Fills in the MusicBrainz ids the library server does not have. Only the library-seeded
    // row needs this; everything else is seeded from ListenBrainz, which answers in ids.
    const artistMbids = useQuery({
        ...listenbrainzQueries.artistMbidsByName(username),
        enabled,
    });

    /*
     * Reversed before the map is built, so the first entry for a name wins rather than the last.
     *
     * Two different artists can normalize to the same name, measured at one pair in nine hundred
     * on a real account. The list arrives ordered by play count, so the earlier of the two is
     * the one the listener actually plays, and that is the one worth seeding from.
     */
    const artistMbidByName = useMemo(
        () => new Map([...(artistMbids.data ?? [])].reverse()),
        [artistMbids.data],
    );

    /*
     * Seeds drawn from both time windows rather than from the month alone.
     *
     * Half from each, so the row keeps describing what the listener is on now while also
     * reaching what they have loved for years. Deduplicated, because an artist played steadily
     * for a decade appears at the top of both lists and would otherwise take two of five seats.
     */
    const similarArtistSeeds = useMemo(() => {
        const month = spread(
            (topArtists.data ?? [])
                .map((artist) => artist.artist_mbid)
                .filter((mbid): mbid is string => Boolean(mbid)),
            Math.ceil(SIMILARITY_SEED_COUNT / 2),
        );

        const allTime = spread(
            (topArtistsAllTime.data ?? [])
                .map((artist) => artist.artist_mbid)
                .filter((mbid): mbid is string => Boolean(mbid))
                .filter((mbid) => !month.includes(mbid)),
            SIMILARITY_SEED_COUNT - month.length,
        );

        return [...month, ...allTime];
    }, [topArtists.data, topArtistsAllTime.data]);

    /*
     * Bands to expand through their members, named rather than just identified.
     *
     * The name is carried because the row's whole value is being able to say "via Chino Moreno,
     * who is in Deftones". A bare id would leave the card as unexplained as everything else was.
     */
    const relatedSeeds = useMemo(
        () =>
            spread(
                (topArtistsAllTime.data ?? []).filter((artist) => artist.artist_mbid),
                SIMILARITY_SEED_COUNT,
            ).map((artist) => ({ mbid: artist.artist_mbid as string, name: artist.artist_name })),
        [topArtistsAllTime.data],
    );

    const relatedBands = useQuery(musicbrainzQueries.relatedBands(relatedSeeds));

    const similarRecordingSeeds = useMemo(
        () =>
            spread(
                (topRecordings.data ?? [])
                    .map((recording) => recording.recording_mbid)
                    .filter((mbid): mbid is string => Boolean(mbid)),
                SIMILARITY_SEED_COUNT,
            ),
        [topRecordings.data],
    );

    // Listeners with comparable taste, and what they have been playing. The only source on the
    // page that is not derived from this user's own history, so the only one that can offer
    // something they have never encountered rather than something adjacent to what they own.
    const similarUsers = useQuery({ ...listenbrainzQueries.similarUsers(username), enabled });

    const peerNames = useMemo(
        () => (similarUsers.data ?? []).slice(0, PEER_COUNT).map((peer) => peer.user_name),
        [similarUsers.data],
    );

    const peerRecordings = useQuery(listenbrainzQueries.similarListeners(peerNames));

    /*
     * The head of each peer's list, which is the part that can actually reach the row.
     *
     * Bounded rather than exhaustive because genres cost a request per 25 recordings and the
     * peers between them return several hundred. The bound is not a compromise on the case that
     * matters: a record gets into this row by ranking high for its peer, and the failure this
     * exists to stop is somebody playing one thing on repeat, which is the top of the list by
     * definition. The nursery rhyme that prompted it was that peer's single most played
     * recording of the month.
     */
    const peerHeadMbids = useMemo(
        () => [
            ...new Set(
                (peerRecordings.data ?? []).flatMap((tracks) =>
                    tracks
                        .slice(0, GENRE_CHECK_PER_PEER)
                        .map((track) => track.recording_mbid)
                        .filter((mbid): mbid is string => Boolean(mbid)),
                ),
            ),
        ],
        [peerRecordings.data],
    );

    const excludedRecordings = useQuery(listenbrainzQueries.excludedRecordings(peerHeadMbids));

    const excluded = useMemo(
        () => new Set(excludedRecordings.data ?? []),
        [excludedRecordings.data],
    );

    // Undefined while the check is outstanding, which the merge below reads as "not yet".
    const peerFiltered =
        peerHeadMbids.length > 0 && excludedRecordings.isPending ? undefined : peerRecordings.data;

    const similarArtists = useQuery(listenbrainzQueries.similarArtists(similarArtistSeeds));
    const similarRecordings = useQuery(
        listenbrainzQueries.similarRecordings(similarRecordingSeeds),
    );

    const libraryIndex = useLibraryIndex(enabled);
    const listenIndex = useListenIndex(username);

    /*
     * Seeds from the parts of the library its owner stopped visiting, one per genre.
     *
     * Every other source on this page is seeded from recent listening, and measured on a real
     * account they answer with less variety than that listening had: the user's own month was
     * 82% rock, what came back was 88% to 99%. Nothing available escapes that, because every
     * ListenBrainz surface is computed from the same history, so the only way out is to point
     * the same similarity model somewhere else.
     *
     * The library is where to point it. It is several times more varied than any month of it,
     * it was chosen deliberately rather than sampled, and a record bought and left unplayed is
     * a direction its owner already expressed an interest in.
     *
     * One seed per genre, because the neglected list is ordered by neglect and the top of it
     * would otherwise be five artists off the same forgotten shelf. Seeding needs a MusicBrainz
     * id, which most library servers do not have, so the ones without are looked up by name in
     * the listener's own statistics before the genre spread is applied.
     */
    const cornerSeeds = useMemo(() => {
        const genres = new Set<string>();
        const seeds: string[] = [];
        let resolved = 0;

        for (const artist of libraryIndex.neglectedArtists) {
            // The server's id where there is one, and otherwise the listener's own statistics,
            // which name the same artist and do carry ids. Neither may know it, and an artist
            // with no id cannot be a seed, so it is passed over rather than counted.
            const mbid = artist.mbid ?? artistMbidByName.get(normalizeName(artist.name));

            if (!mbid) {
                continue;
            }

            resolved += 1;

            // An artist with no genre is kept but cannot be grouped, so it stands for itself
            // rather than blocking every other ungenred artist behind it.
            const genre = artist.genre ?? mbid;

            if (genres.has(genre)) {
                continue;
            }

            genres.add(genre);
            seeds.push(mbid);

            if (seeds.length >= SIMILARITY_SEED_COUNT) {
                break;
            }
        }

        // How far each stage got. A short row here has three causes that look identical on
        // screen, and the interesting one is the middle number: it is how many of the library's
        // neglected artists could be named to ListenBrainz at all.
        if (libraryIndex.isReady) {
            logger.info(
                `Discover corners: ${libraryIndex.neglectedArtists.length} neglected artists, ` +
                    `${resolved} with an mbid, ${seeds.length} seeds`,
            );
        }

        return seeds;
    }, [libraryIndex.neglectedArtists, libraryIndex.isReady, artistMbidByName]);

    const cornerArtists = useQuery(listenbrainzQueries.similarArtists(cornerSeeds));

    /**
     * Which items had been shown before this visit began.
     *
     * Snapshotted once, because the route marks everything on screen as seen and would
     * otherwise erase the distinction before the first sort could use it. A stale snapshot is
     * the harmless direction: it only means an item stays at the front for one more visit.
     */
    const [seenBefore] = useState(
        () => new Set(useSettingsStore.getState().general.discoverSeenIds),
    );

    const rows = useMemo<DiscoverRow[]>(() => {
        const result: DiscoverRow[] = [];

        const push = (
            key: string,
            title: string,
            items: DiscoverItem[],
            options?: { isArtist?: boolean; limit?: number },
        ) => {
            // Both filters, then the cap. Owning a record and having heard one are separate
            // questions and the page has to survive both, but neither has anything to do with
            // whether a suggestion was any good, so a cap applied first would spend the whole
            // budget on entries that are about to be hidden. Measured on a real account: the
            // merged list is 138 entries and the head of it is almost entirely already known.
            const owned = filterOwnedItems(items, libraryIndex);
            const unheard = filterHeardItems(owned, listenIndex);
            const fresh = newFindsFirst(unheard, seenBefore).slice(0, options?.limit);

            // A short row has several possible causes that look identical on screen, and the
            // counts are the only way to tell which one it was. Logged for every row on every
            // build: they are four integers, and without them diagnosing this costs a rebuild.
            logger.info(
                `Discover row "${key}": ${items.length} suggested, ` +
                    `${owned.length} unowned, ${unheard.length} unheard, ${fresh.length} shown`,
            );

            if (fresh.length < MIN_ROW_ITEMS) {
                return fresh;
            }

            const isTall = TWO_ROW_KEYS.has(key) && fresh.length >= MIN_ITEMS_FOR_TWO_ROWS;

            // Artists are circles with no track to preview, so the hero card does not suit them
            // however the row is otherwise configured.
            const layout = options?.isArtist ? 'strip' : (ROW_LAYOUTS[key] ?? 'strip');

            result.push({
                isArtist: options?.isArtist,
                items: fresh,
                key,
                layout,
                rowCount: isTall ? 2 : 1,
                title,
            });

            return fresh;
        };

        // Every track source answers the same question, so they are one row. The order is the
        // interleave order: collaborative filtering first because it is the least derivative of
        // what the user already listens to, play counts last because they are the most.
        //
        // Each lane carries a label, printed on the card. Without one the row was a dozen
        // sources rendered identically, so a suggestion that looked wrong gave a reader no way
        // to tell a bad recommendation from a bug, and gave a maintainer nothing to grep for.
        const peerLabels = (peerFiltered ?? []).map(() => t('page.discover.viaPeers'));

        const merged = push(
            'new-to-you',
            t('page.discover.newToYou'),
            mergeDiscoverSources(
                [
                    recommendationMetadata.data
                        ? recommendationMbids
                              // Free here: the metadata this row already fetches now carries genres,
                              // so the same category exclusion applied to peers costs no request.
                              .filter(
                                  (mbid) => !hasExcludedGenre(recommendationMetadata.data?.[mbid]),
                              )
                              .map((mbid) => fromRecommendation(mbid, recommendationMetadata.data))
                              .filter((item): item is DiscoverItem => item !== null)
                        : [],
                    (jams.data ?? []).map(fromPlaylistTrack),
                    (exploration.data ?? []).map(fromPlaylistTrack),
                    (daily.data ?? []).map(fromPlaylistTrack),
                    (missedFirst.data ?? []).map(fromPlaylistTrack),
                    (missedSecond.data ?? []).map(fromPlaylistTrack),
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
                    // Spread rather than concatenated: one entry per peer means the interleave
                    // alternates between listeners, so no single peer's fixation fills the row.
                    // A peer's month is not always one listener, so records in an excluded
                    // category are dropped here rather than being allowed to lead the row.
                    //
                    // Held back entirely until the check has answered, rather than shown and then
                    // corrected. It resolves in one round trip and is cached for a week, so this
                    // costs a moment on a cold load; without it the excluded record is on screen
                    // for that moment, and ranking first for its peer is exactly what puts it at
                    // the front of the row.
                    ...(peerFiltered ?? []).map((tracks) =>
                        tracks
                            .filter(
                                (track) =>
                                    !track.recording_mbid || !excluded.has(track.recording_mbid),
                            )
                            .map(fromRecordingStat),
                    ),
                ],
                [
                    t('page.discover.viaRecommended'),
                    t('page.discover.viaJams'),
                    t('page.discover.viaExploration'),
                    t('page.discover.viaDaily'),
                    t('page.discover.viaMissed'),
                    t('page.discover.viaMissed'),
                    t('page.discover.viaSimilarTracks'),
                    t('page.discover.viaTopTracks'),
                    ...peerLabels,
                ],
            ),
            { limit: MERGED_ITEM_LIMIT },
        );

        // Derived from what the merged row kept rather than from the raw sources, so the count
        // means "suggestions that survived both filters", which is the only version of it that
        // says anything. Its tracks are then dropped from the strip: the two blocks sit within
        // a screen of each other and the same three covers appearing in both reads as a fault.
        const spotlight = pickAlbumSpotlight(merged);

        if (spotlight) {
            const spotlit = new Set(spotlight.tracks.map((track) => track.id));
            const strip = result.find((row) => row.key === 'new-to-you');

            if (strip) {
                strip.items = strip.items.filter((item) => !spotlit.has(item.id));
            }

            result.push({
                album: spotlight,
                items: spotlight.tracks,
                key: 'spotlight',
                layout: 'spotlight',
                rowCount: 1,
                title: t('page.discover.spotlight'),
            });
        }
        push(
            'fresh-releases',
            t('page.discover.freshReleases'),
            sortByReleaseDate(freshReleases.data ?? []).map(fromFreshRelease),
        );
        push(
            'similar-artists',
            t('page.discover.similarArtists'),
            mergeDiscoverSources(
                bySeed(
                    (similarArtists.data ?? []).filter(
                        (entry) => !similarArtistSeeds.includes(entry.artist_mbid),
                    ),
                    similarArtistSeeds,
                ).map((entries) =>
                    rankSimilar(entries, (entry) => entry.artist_mbid).map(fromSimilarArtist),
                ),
            ),
            { isArtist: true, limit: ARTIST_ROW_LIMIT },
        );

        // Not a similarity model at all: these are bands whose members are in a band the
        // listener already plays. Co-occurrence cannot reach them, because the whole point is
        // that hardly anyone plays the side project and the parent band together.
        push(
            'related-bands',
            t('page.discover.relatedBands'),
            (relatedBands.data ?? []).map(fromRelatedBand),
            { isArtist: true, limit: ARTIST_ROW_LIMIT },
        );

        // Same machinery as the row above, pointed at the library instead of at the month. What
        // comes back is filtered against the library like everything else, so the row is only
        // ever artists with nothing in it: the collection chooses the direction, never the cards.
        push(
            'library-corners',
            t('page.discover.libraryCorners'),
            mergeDiscoverSources(
                bySeed(
                    (cornerArtists.data ?? []).filter(
                        (entry) => !cornerSeeds.includes(entry.artist_mbid),
                    ),
                    cornerSeeds,
                ).map((entries) =>
                    rankSimilar(entries, (entry) => entry.artist_mbid).map(fromSimilarArtist),
                ),
            ),
            { isArtist: true, limit: ARTIST_ROW_LIMIT },
        );

        return result;
    }, [
        t,
        daily.data,
        missedFirst.data,
        missedSecond.data,
        relatedBands.data,
        libraryIndex,
        listenIndex,
        seenBefore,
        jams.data,
        exploration.data,
        recommendationMbids,
        recommendationMetadata.data,
        similarArtists.data,
        similarArtistSeeds,
        similarRecordings.data,
        similarRecordingSeeds,
        freshReleases.data,
        peerFiltered,
        topRecordings.data,
        excluded,
        cornerArtists.data,
        cornerSeeds,
    ]);

    // Looked up after filtering, so no request is spent on an artist that is about to be hidden.
    const artistRows = useMemo(
        () => rows.filter((row) => row.isArtist).map((row) => row.items),
        [rows],
    );

    const artistItems = useMemo(() => artistRows.flat(), [artistRows]);

    const artistImages = useArtistImages(artistRows);

    /*
     * Sorted, so the key describes which artists are on the page rather than what order they
     * landed in.
     *
     * The rows settle over several renders as their sources answer, and each reordering was
     * producing a fresh query key and therefore a fresh request for artists already asked
     * about. Those repeats were most of what was spending the rate limit.
     */
    const artistGenreMbids = useMemo(
        () => [...new Set(artistItems.map((item) => item.id))].sort(),
        [artistItems],
    );

    /*
     * The genre to print under each artist name.
     *
     * Requested only for artists that survived filtering, like the images above, and only for
     * artist rows, so this is a request or two for the whole page. The similarity endpoint
     * offers a disambiguation comment instead, which is absent for most of these artists and
     * reads "American rock band" on a row of American rock bands when it is not.
     */
    const artistGenres = useQuery(listenbrainzQueries.artistGenres(artistGenreMbids));

    const genreOf = useMemo(() => new Map(artistGenres.data ?? []), [artistGenres.data]);

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
        if (artistImages.size === 0 && albumImages.size === 0 && genreOf.size === 0) {
            return rows;
        }

        return rows.map((row) => {
            const items = row.items.map((item) => {
                // A resolved name lookup wins over the Cover Art Archive URL the item was built
                // with, because that URL is served by archive.org, which has been timing out
                // rather than answering. A slow failure leaves the card blank for as long as the
                // browser's connect timeout, where a lookup either has the cover or does not.
                const imageUrl = row.isArtist
                    ? artistImages.get(item.id)
                    : albumImages.get(item.id);

                // The name is already the card's title, so repeating it underneath says
                // nothing. A genre is what a reader scanning unfamiliar names can use.
                const subtitle = row.isArtist ? (genreOf.get(item.id) ?? item.subtitle) : undefined;
                const next = subtitle ? { ...item, subtitle } : item;

                return imageUrl ? { ...next, imageUrl } : next;
            });

            // The spotlight keeps its own cover, so it has to be repaired alongside the tracks
            // or it stays pointed at the archive.org URL the others were just moved off.
            const album = row.album
                ? { ...row.album, imageUrl: items.find((item) => item.imageUrl)?.imageUrl ?? null }
                : undefined;

            return { ...row, album, items };
        });
    }, [rows, artistImages, albumImages, genreOf]);

    // The sources the page is actually built from. `createdFor` is excluded: it is a lookup
    // that feeds the two playlist queries rather than a row of its own, so counting it would
    // report a source the reader never sees.
    /*
     * `relatedBands` is deliberately absent.
     *
     * Everything counted here is ListenBrainz, and the progress line the count feeds says so
     * when it is slow. MusicBrainz is a different service with a different failure meaning, and
     * it is paced at a request per second by design, so counting it would report a healthy walk
     * as a stalled page and blame the wrong dependency when it broke. Its own failures are
     * logged where they happen.
     */
    const queries = [
        jams,
        exploration,
        daily,
        missedFirst,
        missedSecond,
        topArtistsAllTime,
        cornerArtists,
        recommendationMetadata,
        similarArtists,
        similarRecordings,
        freshReleases,
        topArtists,
        peerRecordings,
        similarUsers,
        topRecordings,
    ];

    // Counted on every render rather than memoized: it is two integers over a dozen sources, and
    // the dependency would be the query statuses themselves, which is the whole computation.
    //
    // The library index counts as a source and the listen index no longer does. The difference
    // is what each one does while it is missing: without the library index every row would be
    // music the user already owns, so `filterOwnedItems` withholds them entirely and the page
    // really is waiting. A missing listen history only makes the rows generous, and the page
    // now renders and says so instead of waiting.
    const total = queries.length + 1;
    let ready = libraryIndex.isReady ? 1 : 0;

    const progress: DiscoverProgress = { failed: 0, loading: 0 };

    for (const query of queries) {
        if (query.isError) {
            progress.failed += 1;
        } else if (query.isSuccess) {
            ready += 1;
        }
    }

    progress.loading = total - ready - progress.failed;

    return {
        history: {
            indexedCount: listenIndex.indexedCount,
            isComplete: listenIndex.isComplete,
            isReady: listenIndex.isReady,
            isUnavailable: listenIndex.isUnavailable,
            listenCount: listenIndex.listenCount,
            oldestTs: listenIndex.oldestTs,
            trackKeyCount: listenIndex.trackKeyCount,
        },
        // Every row fetches independently, so a slow or failing source never blanks the page.
        isError: queries.every((query) => query.isError),
        // Nothing renders before the library index is in hand, because a row built without it
        // is a list of music the user already owns. The listen history is not waited on: rows
        // render against however much of it has been read and re-filter as the rest arrives.
        isPending: rowsWithImages.length === 0 && progress.loading > 0,
        library: {
            albumCount: libraryIndex.albumKeys.size,
            isReady: libraryIndex.isReady,
            trackCount: libraryIndex.trackKeys.size,
        },
        // Only what the page still needs in order to say something true: how many sources are
        // outstanding, and how many gave up. The history walk reports itself separately, in
        // `history` above, because it is the one wait measured in minutes.
        progress,
        rows: rowsWithImages,
    };
}

/** ListenBrainz returns generated playlists newest first, so the first match is this week's. */
function findLatest(playlists: LbPlaylistSummary[] | undefined, prefix: string) {
    return playlists?.find((entry) => entry.playlist.title.startsWith(prefix));
}

/**
 * Anything not shown on a previous visit, first.
 *
 * The nearest thing to sorting by when something was discovered. Most sources carry no date at
 * all: collaborative filtering, similarity and play counts each return a bare ranked list, and
 * the weekly playlists date the playlist rather than the tracks in it. What is knowable is
 * whether this client has shown an item before, and since ListenBrainz regenerates the weekly
 * playlists wholesale and the recommendation set turns over on its own schedule, "not seen
 * before" is exactly the set of genuinely new finds.
 *
 * A stable partition rather than a sort, so the interleave the sources were merged in survives
 * inside each half.
 */
function newFindsFirst(items: DiscoverItem[], seenBefore: Set<string>): DiscoverItem[] {
    const fresh: DiscoverItem[] = [];
    const familiar: DiscoverItem[] = [];

    for (const item of items) {
        (seenBefore.has(item.id) ? familiar : fresh).push(item);
    }

    return [...fresh, ...familiar];
}

/** The MBID is the last path segment of a `https://listenbrainz.org/playlist/{mbid}` URL. */
function playlistMbid(summary: LbPlaylistSummary | undefined): null | string {
    return summary?.playlist.identifier.split('/').pop() ?? null;
}
