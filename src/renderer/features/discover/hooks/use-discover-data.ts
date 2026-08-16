import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import {
    fetchRecordingMetadata,
    listenbrainzQueries,
} from '/@/renderer/features/discover/api/listenbrainz-api';
import { LbPlaylistSummary } from '/@/renderer/features/discover/api/listenbrainz-types';
import {
    DiscoverItem,
    filterFreshReleasesByArtists,
    fromArtistStat,
    fromFreshRelease,
    fromPlaylistTrack,
    fromRecommendation,
    fromRecordingStat,
    fromReleaseStat,
} from '/@/renderer/features/discover/utils/lb-adapters';

export interface DiscoverRow {
    /** Artists render as circles and cannot be previewed. */
    isArtist?: boolean;
    items: DiscoverItem[];
    key: string;
    title: string;
}

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

    const freshReleases = useQuery({
        ...listenbrainzQueries.freshReleases(username),
        enabled: enabled && (topArtists.data?.length ?? 0) > 0,
    });

    const rows = useMemo<DiscoverRow[]>(() => {
        const result: DiscoverRow[] = [];

        const push = (key: string, title: string, items: DiscoverItem[], isArtist?: boolean) => {
            if (items.length > 0) {
                result.push({ isArtist, items, key, title });
            }
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
        push(
            'fresh-releases',
            t('page.discover.freshReleases'),
            filterFreshReleasesByArtists(freshReleases.data ?? [], topArtists.data ?? []).map(
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
        jams.data,
        exploration.data,
        recommendationMbids,
        recommendationMetadata.data,
        freshReleases.data,
        topArtists.data,
        topRecordings.data,
        topReleases.data,
    ]);

    const queries = [createdFor, jams, exploration, topArtists, topReleases, topRecordings];

    return {
        // Every row fetches independently, so a slow or failing source never blanks the page.
        isError: queries.every((query) => query.isError),
        isPending: rows.length === 0 && queries.some((query) => query.isPending),
        rows,
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
