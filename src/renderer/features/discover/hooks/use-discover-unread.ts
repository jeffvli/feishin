import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import { listenbrainzQueries } from '/@/renderer/features/discover/api/listenbrainz-api';
import { LbPlaylistSummary } from '/@/renderer/features/discover/api/listenbrainz-types';
import { fromPlaylistTrack } from '/@/renderer/features/discover/utils/lb-adapters';
import {
    useDiscoverSeenIds,
    useDiscoverSettings,
    useSettingsStore,
    useSettingsStoreActions,
} from '/@/renderer/store';

/**
 * Ids are kept rather than a timestamp because ListenBrainz regenerates the weekly playlists
 * wholesale, and a track that reappears next week is not new. Capped so the persisted settings
 * cannot grow without bound.
 */
const MAX_SEEN_IDS = 1000;

/**
 * How many items in this week's generated playlists the user has not seen yet.
 *
 * Deliberately limited to the two weekly playlists. They are the only genuinely periodic
 * ListenBrainz feed, and they are small, whereas `explore/fresh-releases` is several megabytes
 * and must not be fetched merely to render a sidebar badge.
 */
export function useDiscoverUnreadCount(): number {
    const { badge, enabled, username } = useDiscoverSettings();
    const seenIds = useDiscoverSeenIds();

    const active = Boolean(badge && enabled && username);

    const createdFor = useQuery({
        ...listenbrainzQueries.playlistsCreatedFor(username),
        enabled: active,
    });

    const jamsMbid = playlistMbid(findLatest(createdFor.data, 'Weekly Jams'));
    const explorationMbid = playlistMbid(findLatest(createdFor.data, 'Weekly Exploration'));

    const jams = useQuery({
        ...listenbrainzQueries.playlist(jamsMbid),
        enabled: active && Boolean(jamsMbid),
    });

    const exploration = useQuery({
        ...listenbrainzQueries.playlist(explorationMbid),
        enabled: active && Boolean(explorationMbid),
    });

    return useMemo(() => {
        if (!active) {
            return 0;
        }

        const seen = new Set(seenIds);

        return [...(jams.data ?? []), ...(exploration.data ?? [])]
            .map((track) => fromPlaylistTrack(track).id)
            .filter((id) => !seen.has(id)).length;
    }, [active, seenIds, jams.data, exploration.data]);
}

/** Records the ids currently on screen, which is what clears the badge. */
export function useMarkDiscoverSeen() {
    const { setSettings } = useSettingsStoreActions();

    return useCallback(
        (ids: string[]) => {
            if (ids.length === 0) {
                return;
            }

            const previous = useSettingsStore.getState().general.discoverSeenIds;
            const merged = [...new Set([...ids, ...previous])];

            if (merged.length === previous.length) {
                return;
            }

            setSettings({ general: { discoverSeenIds: merged.slice(-MAX_SEEN_IDS) } });
        },
        [setSettings],
    );
}

function findLatest(playlists: LbPlaylistSummary[] | undefined, prefix: string) {
    return playlists?.find((entry) => entry.playlist.title.startsWith(prefix));
}

function playlistMbid(summary: LbPlaylistSummary | undefined): null | string {
    return summary?.playlist.identifier.split('/').pop() ?? null;
}
