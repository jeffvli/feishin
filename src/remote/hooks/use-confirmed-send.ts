import { useCallback } from 'react';

import { useConfirmQueueChanges, useSendAcked } from '/@/remote/store';
import { useQueueState, useRemoteLibraryStore } from '/@/remote/store/library';
import {
    ClientClearQueue,
    ClientPlayAlbum,
    ClientPlayPlaylist,
    ClientPlayTrack,
    ClientPlayTrackRadio,
} from '/@/shared/types/remote-types';
import { Play } from '/@/shared/types/types';

type ConfirmableEvent =
    | ClientClearQueue
    | ClientPlayAlbum
    | ClientPlayPlaylist
    | ClientPlayTrack
    | ClientPlayTrackRadio;

// Mirrors the desktop's own isReplaceQueueType() (player-context.tsx) — only
// these two Play types actually discard the current queue. clear-queue has
// no playType to check — emptying the queue *is* the replacement.
const REPLACES_QUEUE = new Set([Play.NOW, Play.SHUFFLE]);

const replacesQueue = (event: ConfirmableEvent): boolean =>
    event.event === 'clear-queue' || REPLACES_QUEUE.has(event.playType ?? Play.NOW);

/**
 * The single place every queue-replacing send goes through — both the
 * direct "tap a row to play it" path (track-row.tsx/album-row.tsx/
 * playlist-row.tsx, implicit Play.NOW) and the long-press action-sheet's
 * explicit Play/Play (shuffled)/Clear Queue options. Without this, either
 * path would reach use-remote-library.tsx's `skipConfirmation: true` calls
 * with no confirmation having happened at all — that flag only skips the
 * desktop's *own* confirm (which can't reach the phone anyway), it doesn't
 * imply the user already agreed to anything.
 *
 * Returns a promise that resolves once the desktop has actually applied the
 * operation (see AckableClientEvent) — callers that care (the long-press
 * action sheets, blocking their spinner on it) can await it; callers that
 * don't (the plain row-tap path) can ignore it, since a declined confirm
 * resolves rather than rejects and every other rejection is pre-caught
 * below, so an ignored return value never surfaces as an unhandled
 * rejection.
 */
export function useConfirmedSend() {
    const sendAcked = useSendAcked();
    const confirmQueueChanges = useConfirmQueueChanges();
    const queueHasItems = useQueueState().items.length > 0;
    const requestConfirm = useRemoteLibraryStore(
        (state) => state.actions.requestQueueReplaceConfirm,
    );

    return useCallback(
        (event: ConfirmableEvent): Promise<void> => {
            let promise: Promise<void>;
            if (replacesQueue(event) && confirmQueueChanges && queueHasItems) {
                promise = new Promise<void>((resolve, reject) => {
                    requestConfirm({
                        // Declining isn't a failure — it's the user
                        // choosing not to proceed, so this resolves quietly
                        // rather than rejecting into an "Action failed"
                        // toast.
                        cancel: () => resolve(),
                        // Returned to the confirm sheet too (see
                        // QueueReplaceConfirmRequest) so it can show its own
                        // loading state - `.then` below is just an extra
                        // listener on the same promise, doesn't consume it.
                        execute: () => {
                            const acked = sendAcked(event);
                            acked.then(resolve, reject);
                            return acked;
                        },
                    });
                });
            } else {
                promise = sendAcked(event);
            }

            // A caller that doesn't await this (every plain row tap) would
            // otherwise log an unhandled-rejection warning the moment a send
            // fails — harmless here since the failure has nowhere else to
            // go, but noisy. Callers that do await/catch this same promise
            // (the action sheets) are unaffected: a promise can carry any
            // number of independent .then/.catch subscribers.
            promise.catch(() => {});

            return promise;
        },
        [sendAcked, confirmQueueChanges, queueHasItems, requestConfirm],
    );
}
