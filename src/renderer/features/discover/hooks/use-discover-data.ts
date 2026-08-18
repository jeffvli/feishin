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
    isDiscoverItem,
    mergeDiscoverSources,
    rankSimilar,
    sortByReleaseDate,
} from '/@/renderer/features/discover/utils/lb-adapters';
import { normalizeName } from '/@/renderer/features/discover/utils/library-match';
import { pickVariant } from '/@/renderer/features/discover/utils/phrase-variety';
import { useDiscoverBlockedIds, useSettingsStore } from '/@/renderer/store';
import { logger } from '/@/renderer/utils/logger';

/**
 * How many sources have given up, so the page can say ListenBrainz is unwell rather than
 * silently showing less.
 *
 * Worth reporting because ListenBrainz is not a reliable dependency: it sheds load with 502s
 * and by closing the connection, and a row that failed and a row the filters emptied look
 * identical on screen.
 *
 * How many are still outstanding is no longer counted here. Each row now draws its own
 * placeholders while it waits, which says the same thing in the place the reader is looking,
 * and a page-level total said it in a unit nobody has a use for.
 */
export interface DiscoverProgress {
    /** Sources that gave up after their retries. */
    failed: number;
}

export interface DiscoverRow {
    /** Set only on a `spotlight` row, which renders the album rather than the items. */
    album?: AlbumSpotlight;
    /** Artists render as circles and cannot be previewed. */
    isArtist?: boolean;
    /**
     * True while a source this row is built from has yet to answer.
     *
     * The row is drawn as placeholders rather than as however much of it has arrived. Its
     * sources land seconds apart and each landing changes what the row holds, so a row rendered
     * from a partial set is not a row filling up: it is a different row each time, reordered by
     * the merge and re-cut by the cap, and the reader watches the same strip rewrite itself
     * three times. `items` is empty while this is set.
     */
    isPending?: boolean;
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

/**
 * How many artists reach the row, counted after the owned ones are dropped.
 *
 * Higher than the twenty each of the three separate rows used to show, because it is now one
 * row drawing from all three and a cap that did for one source would cut two of them off
 * entirely. Still well under the merged track row's forty: these are circles with a name under
 * them and a strip of them is scanned rather than read.
 */
const ARTIST_ROW_LIMIT = 30;

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
     *
     * Names travel with the ids, in a map alongside the seed list rather than a second pass
     * over the same statistics, because the row's cards need to say which specific artist led
     * to each suggestion rather than one sentence repeated on every card the lane produces.
     */
    const similarArtistSeedData = useMemo(() => {
        // Held back until both statistics are in. Built from whichever had arrived, the seed
        // list changed from three ids to five a second later, and since the seeds are the query
        // key that is a second similarity request and a discarded answer to the first.
        if (!topArtists.data || !topArtistsAllTime.data) {
            return { names: new Map<string, string>(), seeds: [] as string[] };
        }

        const month = spread(
            topArtists.data.filter((artist) => artist.artist_mbid),
            Math.ceil(SIMILARITY_SEED_COUNT / 2),
        ).map((artist) => ({ mbid: artist.artist_mbid as string, name: artist.artist_name }));

        const monthMbids = new Set(month.map((artist) => artist.mbid));

        const allTime = spread(
            topArtistsAllTime.data.filter(
                (artist) => artist.artist_mbid && !monthMbids.has(artist.artist_mbid),
            ),
            SIMILARITY_SEED_COUNT - month.length,
        ).map((artist) => ({ mbid: artist.artist_mbid as string, name: artist.artist_name }));

        const combined = [...month, ...allTime];

        return {
            names: new Map(combined.map((artist) => [artist.mbid, artist.name])),
            seeds: combined.map((artist) => artist.mbid),
        };
    }, [topArtists.data, topArtistsAllTime.data]);

    const similarArtistSeeds = similarArtistSeedData.seeds;
    const similarArtistSeedNames = similarArtistSeedData.names;

    /*
     * Bands to expand through their members, named rather than just identified.
     *
     * The name is carried because the row's whole value is being able to say "Also in Deftones".
     * A bare id would leave the card as unexplained as everything else was.
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

    // Reactive rather than snapshotted like `seenBefore` below: a dismissal has to remove its
    // item from the row the moment it happens, not on the next visit.
    const blockedIds = useDiscoverBlockedIds();
    const blocked = useMemo(() => new Set(blockedIds), [blockedIds]);

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
    const cornerSeedData = useMemo(() => {
        // Held back until the id lookup is in, for the same reason as the similarity seeds
        // above. Most library artists carry no MusicBrainz id of their own, so a seed list
        // built before the lookup answers holds the one or two that do, and that list is the
        // query key: the row fetched a one-seed answer, discarded it, and fetched again.
        if (!artistMbids.data) {
            return { names: new Map<string, string>(), seeds: [] as string[] };
        }

        const genres = new Set<string>();
        const seeds: string[] = [];
        // The artist's own name, alongside its id, so the row's cards can say which specific
        // neglected artist led to a suggestion rather than one sentence on every card the lane
        // produces. Built in the same pass that resolves and selects the seeds themselves, so
        // the two can never disagree about which artists ended up seeding the row.
        const names = new Map<string, string>();
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
            names.set(mbid, artist.name);

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

        return { names, seeds };
    }, [libraryIndex.neglectedArtists, libraryIndex.isReady, artistMbids.data, artistMbidByName]);

    const cornerSeeds = cornerSeedData.seeds;
    const cornerSeedNames = cornerSeedData.names;

    const cornerArtists = useQuery(listenbrainzQueries.similarArtists(cornerSeeds));

    /*
     * Which sources each row is built from, so a row can be drawn as placeholders until they
     * are all in rather than rewritten as each one lands.
     *
     * The lookups a row's own query is keyed on are listed alongside it, because a query whose
     * key has not been computed yet is disabled rather than loading and reports itself as
     * finished. `createdFor` supplies five of the merged row's lanes; the two top-artist
     * statistics supply the similarity seeds; the library index and the id lookup supply the
     * corner seeds.
     */
    const mergedPending =
        !libraryIndex.isReady ||
        isWaiting(createdFor) ||
        isWaiting(jams) ||
        isWaiting(exploration) ||
        isWaiting(daily) ||
        isWaiting(missedFirst) ||
        isWaiting(missedSecond) ||
        isWaiting(recommendations) ||
        isWaiting(recommendationMetadata) ||
        isWaiting(topRecordings) ||
        isWaiting(similarRecordings) ||
        isWaiting(similarUsers) ||
        isWaiting(peerRecordings) ||
        isWaiting(excludedRecordings);

    const freshPending = !libraryIndex.isReady || isWaiting(freshReleases);

    const similarArtistsPending =
        !libraryIndex.isReady ||
        isWaiting(topArtists) ||
        isWaiting(topArtistsAllTime) ||
        isWaiting(similarArtists);

    const relatedBandsPending =
        !libraryIndex.isReady || isWaiting(topArtistsAllTime) || isWaiting(relatedBands);

    const cornersPending =
        !libraryIndex.isReady || isWaiting(artistMbids) || isWaiting(cornerArtists);

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
            options?: { isArtist?: boolean; limit?: number; pending?: boolean },
        ) => {
            // Drawn as placeholders until every source is in, rather than as whatever has
            // arrived. Returned empty so a caller deriving from this row, the spotlight, waits
            // on the same condition instead of picking an album out of a partial set.
            if (options?.pending) {
                result.push({
                    isArtist: options.isArtist,
                    isPending: true,
                    items: [],
                    key,
                    layout: options.isArtist ? 'strip' : (ROW_LAYOUTS[key] ?? 'strip'),
                    rowCount: 1,
                    title,
                });

                return [];
            }

            // Dismissed first, ahead of both filters below: a user's own "never again" is a
            // stronger signal than anything derived from the library or listen history, and
            // checking it first means it costs nothing on top of them.
            const notBlocked = items.filter((item) => !blocked.has(item.id));

            // Both filters, then the cap. Owning a record and having heard one are separate
            // questions and the page has to survive both, but neither has anything to do with
            // whether a suggestion was any good, so a cap applied first would spend the whole
            // budget on entries that are about to be hidden. Measured on a real account: the
            // merged list is 138 entries and the head of it is almost entirely already known.
            const owned = filterOwnedItems(notBlocked, libraryIndex);
            const unheard = filterHeardItems(owned, listenIndex);
            const fresh = newFindsFirst(unheard, seenBefore).slice(0, options?.limit);

            // A short row has several possible causes that look identical on screen, and the
            // counts are the only way to tell which one it was. Logged for every row on every
            // build: they are five integers, and without them diagnosing this costs a rebuild.
            logger.info(
                `Discover row "${key}": ${items.length} suggested, ` +
                    `${notBlocked.length} not dismissed, ${owned.length} unowned, ` +
                    `${unheard.length} unheard, ${fresh.length} shown`,
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
        // Each non-peer lane carries a label, printed on the card. Without one the row was a
        // dozen sources rendered identically, so a suggestion that looked wrong gave a reader no
        // way to tell a bad recommendation from a bug, and gave a maintainer nothing to grep for.
        // Peers are the exception: a peer's account is not named on the card, so a lane label
        // would be the same anonymous sentence on every peer's tracks. Each item stamps its own
        // pick from the pool instead, keyed off its own id, so adjacent cards from different
        // peers still read differently from each other.
        const peerPool = [
            t('page.discover.viaPeers1'),
            t('page.discover.viaPeers2'),
            t('page.discover.viaPeers3'),
            t('page.discover.viaPeers4'),
        ];

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
                    (jams.data ?? []).map(fromPlaylistTrack).filter(isDiscoverItem),
                    (exploration.data ?? []).map(fromPlaylistTrack).filter(isDiscoverItem),
                    (daily.data ?? []).map(fromPlaylistTrack).filter(isDiscoverItem),
                    (missedFirst.data ?? []).map(fromPlaylistTrack).filter(isDiscoverItem),
                    (missedSecond.data ?? []).map(fromPlaylistTrack).filter(isDiscoverItem),
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
                    // A track ListenBrainz could not map is dropped with them, because the
                    // category check is a lookup by recording id and an unmapped track is one
                    // the check cannot run on at all. That is not an edge case here, it is the
                    // shape of the problem: the record that prompted this filter, a Brazilian
                    // children's song a peer had on repeat, is not in MusicBrainz under any
                    // spelling, and neither is its artist. The suggestions least likely to be
                    // catalogued are exactly the ones most likely to be somebody's child's
                    // playlist, so passing the unmapped ones through unchecked let the filter
                    // miss the case it exists for. Measured across 24 peers, 11% of their
                    // recordings are unmapped, and the row is capped well below what survives.
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
                                    Boolean(track.recording_mbid) &&
                                    !excluded.has(track.recording_mbid as string),
                            )
                            .map(fromRecordingStat)
                            .map((item) => ({
                                ...item,
                                source: pickVariant(item.id, peerPool),
                            })),
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
                    ...(peerFiltered ?? []).map(() => null),
                ],
            ),
            { limit: MERGED_ITEM_LIMIT, pending: mergedPending },
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
            { pending: freshPending },
        );
        /*
         * Every artist suggestion in one row, whatever reached it.
         *
         * Three rows of circular cards read as one undifferentiated block whichever order they
         * were in, and splitting them said only which ListenBrainz surface answered, which is a
         * fact about ListenBrainz rather than about the music. The same argument already put
         * every track source into `new-to-you`, and the same machinery does it here: the lanes
         * are interleaved rather than concatenated, so the row alternates between them instead
         * of running one out before starting the next.
         *
         * Ordered by how far each reaches from what the listener already plays. Side projects
         * first, because co-occurrence cannot find them at all; the library's own neglected
         * corners next; plain similarity last, since it is the most derivative of the three and
         * also the longest, so it fills whatever the others leave.
         *
         * Every lane stamps its own `source` on each item as it is built, rather than one label
         * applied to the whole lane by `mergeDiscoverSources`. A `similarArtists` lane covers up
         * to five different seed artists, and a single label on the whole lane could only ever
         * say one sentence regardless of which of those five produced a given card, which is
         * exactly what made every similar-artist card and every corner card read identically. A
         * few wordings share the pool too, chosen deterministically from the card's own id so a
         * given card reads the same way on every visit rather than reshuffling on each render.
         * Because every item already carries its `source`, the merge below passes no labels at
         * all: `mergeDiscoverSources` only overwrites a lane's items when a label is given, so
         * passing one here, even a correctly varied one, would replace what the item already
         * carries.
         */
        const otherBandLane = (relatedBands.data ?? []).map((band) => {
            const item = fromRelatedBand(band);

            return {
                ...item,
                source: pickVariant(item.id, [
                    t('page.discover.viaOtherBands1', { band: band.seedName }),
                    t('page.discover.viaOtherBands2', { band: band.seedName }),
                    t('page.discover.viaOtherBands3', { band: band.seedName }),
                ]),
            };
        });

        const cornerLanes = bySeed(
            (cornerArtists.data ?? []).filter((entry) => !cornerSeeds.includes(entry.artist_mbid)),
            cornerSeeds,
        ).map(({ entries, seedMbid }) => {
            const name = seedMbid ? cornerSeedNames.get(seedMbid) : undefined;

            return rankSimilar(entries, (entry) => entry.artist_mbid)
                .map(fromSimilarArtist)
                .map((item) => ({
                    ...item,
                    source: name
                        ? pickVariant(item.id, [
                              t('page.discover.viaOwnShelves1', { artist: name }),
                              t('page.discover.viaOwnShelves2', { artist: name }),
                              t('page.discover.viaOwnShelves3', { artist: name }),
                          ])
                        : t('page.discover.viaOwnShelvesFallback'),
                }));
        });

        const similarLanes = bySeed(
            (similarArtists.data ?? []).filter(
                (entry) => !similarArtistSeeds.includes(entry.artist_mbid),
            ),
            similarArtistSeeds,
        ).map(({ entries, seedMbid }) => {
            const name = seedMbid ? similarArtistSeedNames.get(seedMbid) : undefined;

            return rankSimilar(entries, (entry) => entry.artist_mbid)
                .map(fromSimilarArtist)
                .map((item) => ({
                    ...item,
                    source: name
                        ? pickVariant(item.id, [
                              t('page.discover.viaSimilarArtists1', { artist: name }),
                              t('page.discover.viaSimilarArtists2', { artist: name }),
                              t('page.discover.viaSimilarArtists3', { artist: name }),
                          ])
                        : t('page.discover.viaSimilarArtistsFallback'),
                }));
        });

        push(
            'artists',
            t('page.discover.artists'),
            mergeDiscoverSources([otherBandLane, ...cornerLanes, ...similarLanes]),
            {
                isArtist: true,
                limit: ARTIST_ROW_LIMIT,
                pending: similarArtistsPending || relatedBandsPending || cornersPending,
            },
        );

        return result;
    }, [
        t,
        mergedPending,
        freshPending,
        similarArtistsPending,
        relatedBandsPending,
        cornersPending,
        daily.data,
        missedFirst.data,
        missedSecond.data,
        relatedBands.data,
        libraryIndex,
        listenIndex,
        seenBefore,
        blocked,
        jams.data,
        exploration.data,
        recommendationMbids,
        recommendationMetadata.data,
        similarArtists.data,
        similarArtistSeeds,
        similarArtistSeedNames,
        similarRecordings.data,
        similarRecordingSeeds,
        freshReleases.data,
        peerFiltered,
        topRecordings.data,
        excluded,
        cornerArtists.data,
        cornerSeeds,
        cornerSeedNames,
    ]);

    // Looked up after filtering, so no request is spent on an artist that is about to be hidden.
    const artistRows = useMemo(
        () => rows.filter((row) => row.isArtist).map((row) => row.items),
        [rows],
    );

    /*
     * The artists whose genre is worth asking for, which is not all of them.
     *
     * Only the ones whose second line is a stand-in. A side project's card already says which
     * member of which band led there, and a genre would not add a line, it would replace that
     * one. Not asking is also a request or two saved.
     */
    const artistItems = useMemo(
        () =>
            rows
                .filter((row) => row.isArtist)
                .flatMap((row) => row.items)
                .filter((item) => item.isSubtitlePlaceholder || !item.subtitle),
        [rows],
    );

    const artistImages = useArtistImages(artistRows);

    /*
     * Sorted, and withheld until every artist row has settled.
     *
     * The whole set is the query key here, so any change to it is a different query: a fresh
     * request for artists already asked about, and an abort of the batch still in flight for
     * the previous set. Sorting removed the reorderings; waiting removes the three separate
     * sets the three artist rows would otherwise produce as they land one after another.
     */
    const artistGenreMbids = useMemo(
        () =>
            similarArtistsPending || relatedBandsPending || cornersPending
                ? []
                : [...new Set(artistItems.map((item) => item.id))].sort(),
        [artistItems, similarArtistsPending, relatedBandsPending, cornersPending],
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
                // nothing. A genre is what a reader scanning unfamiliar names can use, but only
                // where the line it would take is a stand-in: a card that says which member of
                // which band led here is already saying the more useful thing.
                const genre = row.isArtist ? genreOf.get(item.id) : undefined;
                const subtitle = item.isSubtitlePlaceholder || !item.subtitle ? genre : undefined;
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
    // that feeds the playlist queries rather than a row of its own, so counting it would
    // report a source the reader never sees.
    /*
     * `relatedBands` is deliberately absent.
     *
     * Everything counted here is ListenBrainz, and the line this count feeds names it. A
     * MusicBrainz failure means something different and would blame the wrong dependency. Its
     * own failures are logged where they happen, and the row it feeds shows placeholders while
     * it walks like any other.
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

    // Counted on every render rather than memoized: it is one integer over a dozen sources, and
    // the dependency would be the query statuses themselves, which is the whole computation.
    const progress: DiscoverProgress = {
        failed: queries.filter((query) => query.isError).length,
    };

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
 * Whether a source has yet to answer at all.
 *
 * Not `isPending`, which stays true for ever on a query that is deliberately disabled: the two
 * `Top Missed` lanes have no playlist to ask for on an account that has none, and half the page
 * would have waited on them permanently. Not `isFetching` either, which turns true again for a
 * background revalidation and would redraw a finished row as placeholders. Waiting means the
 * query is actually in flight, or queued behind the rate limiter, and has produced nothing yet.
 */
function isWaiting(query: {
    fetchStatus: 'fetching' | 'idle' | 'paused';
    isError: boolean;
    isSuccess: boolean;
}): boolean {
    return !query.isSuccess && !query.isError && query.fetchStatus !== 'idle';
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
