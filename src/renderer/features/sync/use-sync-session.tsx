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
import { idsEqual } from '/@/renderer/api/sync/sync-util';
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

// After switching track we must let the new source load before seeking, or the
// seek races the load and is lost (the same reason use-queue-restore defers its
// post-setQueue seek). Only correct the position when the host is meaningfully
// into the track — a freshly-changed track already starts at ~0.
const TRACK_LOAD_SEEK_DELAY_MS = 150;
const TRACK_CHANGE_SEEK_MIN_SEC = 0.5;

// After applying remote state we hold the echo guard briefly so the player-store
// mutations we just made have settled before this client could (if it becomes
// host via pass-control) emit them back out as a fresh transport.
const ECHO_GUARD_RELEASE_MS = 100;

// While following, a follower periodically re-snaps to the host's authoritative
// state. This (a) lands the correct position once a slow-to-load track (e.g. a
// large FLAC) finally becomes seekable — recomputed live, so we jump to where the
// host is *now*, not where it was at join — and (b) makes the follower read-only:
// any local play/pause/seek/skip is reverted so the session stays in sync.
// Detach via "Follow host" to regain manual control.
const RECONCILE_INTERVAL_MS = 500;
// Only the periodic loop uses this larger threshold so steady-state clock jitter
// doesn't trigger constant micro-seeks; it still catches interactions and slow
// loads (both produce large gaps).
const RECONCILE_DRIFT_SEC = 1.5;

// Live expected playback position (seconds) for a transport, projecting forward
// from the server-stamped time using the measured clock offset while playing.
function expectedPositionSec(t: SyncTransport, clockOffsetMs: number): number {
    const ms = t.playing
        ? t.positionMs + (Date.now() + clockOffsetMs - t.serverTimeMs)
        : t.positionMs;
    return Math.max(0, ms / 1000);
}

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
                const expectedSec = expectedPositionSec(t, offset);

                const currentId = playerDataRef.current.currentSong?.id;
                if (t.trackId && t.trackId !== currentId) {
                    const index = Math.max(0, t.queueIndex);
                    const loadedIds = queueRef.current.map((s) => s.id);
                    const sameQueue = idsEqual(loadedIds, t.queue);
                    if (sameQueue) {
                        // Queue is already loaded (e.g. the host skipped within the
                        // shared queue): just switch track, no need to re-resolve
                        // every song's metadata. Don't seek immediately — that races
                        // the new track's load and the seek is lost; defer it, and
                        // only when the host is actually into the track.
                        a.mediaPlayByIndex(index);
                        if (expectedSec > TRACK_CHANGE_SEEK_MIN_SEC) {
                            const target = expectedSec;
                            setTimeout(
                                () => actionsRef.current.mediaSeekToTimestamp(target),
                                TRACK_LOAD_SEEK_DELAY_MS,
                            );
                        }
                    } else {
                        const songs = await resolveSongsByIds(serverIdRef.current, t.queue);
                        if (songs.length) {
                            // setQueue carries the position; use-queue-restore applies
                            // it on QUEUE_RESTORED after the track loads (deferred), so
                            // no immediate seek is needed here.
                            a.setQueue(songs, index, expectedSec);
                            a.mediaPlayByIndex(index);
                        }
                    }
                    // We just (re)positioned to the host's track, so report ~0 drift.
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
    const lastSentQueueRef = useRef<string[]>([]);
    useEffect(() => {
        if (!connected || !isHost) return;

        // Re-send the full queue on the first emit after becoming host.
        lastSentQueueRef.current = [];
        // Becoming host clears any "detached" follow-state, so if control is later
        // handed back we resume following instead of staying silently detached.
        useSyncStore.getState().actions.setFollowing(true);

        const emit = () => {
            if (applyingRemoteRef.current) return;
            const data = playerDataRef.current;
            const queueIds = queueRef.current.map((s) => s.id);
            const positionMs = Math.round(useTimestampStoreBase.getState().timestamp * 1000);
            // Only include the queue when it actually changed; otherwise omit it so
            // the server keeps the current one (saves resending it on every seek).
            const queueChanged = !idsEqual(queueIds, lastSentQueueRef.current);
            if (queueChanged) lastSentQueueRef.current = queueIds;
            sendTransport({
                playing: data.status === PlayerStatus.PLAYING,
                positionMs,
                queueIndex: data.index,
                trackId: data.currentSong?.id ?? '',
                ...(queueChanged ? { queue: queueIds } : {}),
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

    // ---- Followers: periodic reconciliation (catch-up + read-only lock) ----
    // Keeps the follower pinned to the host's authoritative state between inbound
    // transports: lands the right position once a slow track becomes seekable, and
    // reverts any local play/pause/seek/skip so a follower can't desync the room.
    useEffect(() => {
        if (isHost || !connected || !following) return;

        const reconcile = () => {
            if (applyingRemoteRef.current) return; // a full apply is in flight
            const t = useSyncStore.getState().lastTransport;
            if (!t || !t.trackId) return;

            const a = actionsRef.current;
            const data = playerDataRef.current;

            // Wrong track: switch back to the host's. The follower already has the
            // shared queue loaded, so map the id to its index and play it; the
            // position converges on a later tick once the new track is seekable.
            if (data.currentSong?.id !== t.trackId) {
                const idx = queueRef.current.findIndex((s) => s.id === t.trackId);
                if (idx < 0) return; // queue not loaded yet; the apply effect handles it
                applyingRemoteRef.current = true;
                a.mediaPlayByIndex(idx);
                setTimeout(() => {
                    applyingRemoteRef.current = false;
                }, ECHO_GUARD_RELEASE_MS);
                return;
            }

            // Wrong play/pause state: revert to the host's.
            const isPlaying = data.status === PlayerStatus.PLAYING;
            if (t.playing && !isPlaying) a.mediaPlay();
            else if (!t.playing && isPlaying) a.mediaPause();

            // Position drift (local seek, or a slow load that started at 0): snap to
            // the host's live position. Larger threshold than on-receipt correction
            // so steady-state jitter doesn't cause constant micro-seeks.
            if (t.playing) {
                const expected = expectedPositionSec(t, useSyncStore.getState().clockOffsetMs);
                const actual = useTimestampStoreBase.getState().timestamp;
                const driftMs = Math.round((actual - expected) * 1000);
                useSyncStore.getState().actions.reportDrift(driftMs);
                if (Math.abs(actual - expected) > RECONCILE_DRIFT_SEC) {
                    a.mediaSeekToTimestamp(expected);
                }
            }
        };

        const id = setInterval(reconcile, RECONCILE_INTERVAL_MS);
        return () => clearInterval(id);
    }, [isHost, connected, following]);
};

// Mountable wrapper, following Feishin's hook-as-component convention
// (e.g. RemoteHook in features/remote/hooks/use-remote.tsx).
export const SyncSessionHook = () => {
    useSyncSession();
    return null;
};
