// useSyncSession — the glue between the listen-together session and Feishin's
// player. Mount it once (e.g. in audio-players.tsx). It:
//   * applies inbound roomState to the player (followers), with clock-corrected
//     drift handling and queue resolution, guarded against feedback; and
//   * emits the host's transport whenever local playback changes (debounced).
//
// Modeled on src/renderer/features/player/audio-player/hooks/use-player-events.ts.

import debounce from 'lodash/debounce';
import { useEffect, useRef } from 'react';

import { api } from '/@/renderer/api';
import {
    subscribeCurrentTrack,
    subscribePlayerQueue,
    subscribePlayerSeekToTimestamp,
    subscribePlayerStatus,
    useCurrentServerId,
    usePlayerActions,
    usePlayerData,
    usePlayerQueue,
    useTimestampStoreBase,
} from '/@/renderer/store';
import {
    useIsSyncHost,
    useSyncActions,
    useSyncConnected,
    useSyncFollowing,
    useSyncStore,
} from '/@/renderer/store/sync.store';
import { Song } from '/@/shared/types/domain-types';
import { SyncTransport } from '/@/shared/types/sync-types';
import { PlayerStatus } from '/@/shared/types/types';

const DRIFT_THRESHOLD_SEC = 0.25;

// After applying remote state we hold the echo guard briefly so the player-store
// mutations we just made have settled before this client could (if it becomes
// host via pass-control) emit them back out as a fresh transport.
const ECHO_GUARD_RELEASE_MS = 100;

async function resolveSongsByIds(serverId: string, ids: string[]): Promise<Song[]> {
    if (!serverId || ids.length === 0) return [];
    const results = await Promise.all(
        ids.map((id) =>
            api.controller
                .getSongDetail({ apiClientProps: { serverId }, query: { id } })
                .catch(() => undefined),
        ),
    );
    return results.filter((s): s is Song => !!s);
}

export const useSyncSession = (): void => {
    const isHost = useIsSyncHost();
    const connected = useSyncConnected();
    const following = useSyncFollowing();
    const seq = useSyncStore((s) => s.seq);
    const { sendTransport } = useSyncActions();
    const serverId = useCurrentServerId();

    const actions = usePlayerActions();
    const queue = usePlayerQueue();
    const playerData = usePlayerData();

    const actionsRef = useRef(actions);
    actionsRef.current = actions;
    const queueRef = useRef(queue);
    queueRef.current = queue;
    const playerDataRef = useRef(playerData);
    playerDataRef.current = playerData;
    const serverIdRef = useRef(serverId);
    serverIdRef.current = serverId;

    const applyingRemoteRef = useRef(false);
    const lastAppliedSeqRef = useRef(-1);
    const prevFollowingRef = useRef(true);

    // ---- Followers: apply inbound roomState ----
    useEffect(() => {
        if (isHost) return;

        // Detect a detach→resume transition so re-enabling "follow" re-applies the
        // latest transport even when seq hasn't advanced since we detached.
        const justResumed = following && !prevFollowingRef.current;
        prevFollowingRef.current = following;

        if (!following) return;
        if (seq < 0) return;
        if (!justResumed && seq <= lastAppliedSeqRef.current) return;
        const transport = useSyncStore.getState().lastTransport;
        if (!transport) return;
        lastAppliedSeqRef.current = seq;

        const apply = async (t: SyncTransport) => {
            applyingRemoteRef.current = true;
            try {
                const a = actionsRef.current;
                const offset = useSyncStore.getState().clockOffsetMs;
                const expectedMs = t.playing
                    ? t.positionMs + (Date.now() + offset - t.serverTimeMs)
                    : t.positionMs;
                const expectedSec = Math.max(0, expectedMs / 1000);

                const currentId = playerDataRef.current.currentSong?.id;
                if (t.trackId && t.trackId !== currentId) {
                    const index = Math.max(0, t.queueIndex);
                    const loadedIds = queueRef.current.map((s) => s.id);
                    const sameQueue =
                        loadedIds.length === t.queue.length &&
                        loadedIds.every((id, i) => id === t.queue[i]);
                    if (sameQueue) {
                        // Queue is already loaded (e.g. the host skipped within the
                        // shared queue): just switch track + seek, no need to
                        // re-resolve every song's metadata.
                        a.mediaPlayByIndex(index);
                        a.mediaSeekToTimestamp(expectedSec);
                    } else {
                        const songs = await resolveSongsByIds(serverIdRef.current, t.queue);
                        if (songs.length) {
                            a.setQueue(songs, index, expectedSec);
                            a.mediaPlayByIndex(index);
                        }
                    }
                    // We just (re)seeked to the host's position, so report ~0 drift.
                    useSyncStore.getState().actions.reportDrift(0);
                } else {
                    const currentSec = useTimestampStoreBase.getState().timestamp;
                    const driftMs = Math.round((currentSec - expectedSec) * 1000);
                    useSyncStore.getState().actions.reportDrift(driftMs);
                    if (Math.abs(currentSec - expectedSec) > DRIFT_THRESHOLD_SEC) {
                        a.mediaSeekToTimestamp(expectedSec);
                    }
                }

                // mediaPlay/mediaPause are idempotent, so enforce unconditionally.
                if (t.playing) a.mediaPlay();
                else a.mediaPause();
            } finally {
                // Release the guard after the store settles so our own programmatic
                // changes don't bounce back out as a host transport.
                setTimeout(() => {
                    applyingRemoteRef.current = false;
                }, ECHO_GUARD_RELEASE_MS);
            }
        };

        void apply(transport);
    }, [seq, isHost, following]);

    // ---- Host: emit transport on local playback changes ----
    useEffect(() => {
        if (!connected || !isHost) return;

        const emit = () => {
            if (applyingRemoteRef.current) return;
            const data = playerDataRef.current;
            const queueIds = queueRef.current.map((s) => s.id);
            const positionMs = Math.round(useTimestampStoreBase.getState().timestamp * 1000);
            sendTransport({
                playing: data.status === PlayerStatus.PLAYING,
                positionMs,
                queue: queueIds,
                queueIndex: data.index,
                trackId: data.currentSong?.id ?? '',
            });
        };

        const debounced = debounce(emit, 150);
        const unsubscribers = [
            subscribePlayerStatus(() => debounced()),
            subscribePlayerSeekToTimestamp(() => debounced()),
            subscribeCurrentTrack(() => debounced()),
            subscribePlayerQueue(() => debounced()),
        ];
        emit(); // push current state immediately on becoming host

        return () => {
            debounced.cancel();
            unsubscribers.forEach((unsub) => unsub?.());
        };
    }, [connected, isHost, sendTransport]);
};

// Mountable wrapper, following Feishin's hook-as-component convention
// (e.g. RemoteHook in features/remote/hooks/use-remote.tsx).
export const SyncSessionHook = () => {
    useSyncSession();
    return null;
};
