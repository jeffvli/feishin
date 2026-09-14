import isElectron from 'is-electron';
import debounce from 'lodash/debounce';
import { useEffect, useRef } from 'react';

import { getItemImageUrl } from '/@/renderer/components/item-image/item-image';
import {
    subscribeCurrentTrack,
    subscribePlayerQueue,
    usePlayerStoreBase,
} from '/@/renderer/store/player.store';
import { useRemoteSettings } from '/@/renderer/store/settings.store';
import { LibraryItem, QueueSong } from '/@/shared/types/domain-types';
import { RemoteQueueItem } from '/@/shared/types/remote-types';

const remote = isElectron() ? window.api.remote : null;

const toRemoteQueueItem = (song: QueueSong): RemoteQueueItem => ({
    album: song.album,
    artistName: song.artistName,
    duration: song.duration,
    id: song.id,
    imageUrl:
        getItemImageUrl({
            id: song.id,
            imageUrl: song.imageUrl,
            itemType: LibraryItem.SONG,
            serverId: song._serverId,
            type: 'itemCard',
            useRemoteUrl: true,
        }) ?? null,
    name: song.name,
    uniqueId: song._uniqueId,
});

/**
 * Pushes the current queue (cached + broadcast, not request/response — the
 * queue is live desktop-driven state, see remote-types.ts's ServerQueueState)
 * to the phone whenever it changes or the current track advances.
 */
export const useRemoteQueuePush = () => {
    const isRemoteEnabled = useRemoteSettings().enabled;
    const currentUniqueIdRef = useRef<null | string>(null);

    useEffect(() => {
        if (!isRemoteEnabled || !remote) return;

        // Queue reorders/bulk-adds can fire rapidly — debounce like
        // remote-container.tsx already does for rating changes.
        const pushQueue = debounce(() => {
            const { items } = usePlayerStoreBase.getState().getQueue();
            remote?.updateQueue(currentUniqueIdRef.current, items.map(toRemoteQueueItem));
        }, 250);

        pushQueue();

        const unsubQueue = subscribePlayerQueue(() => {
            pushQueue();
        });
        const unsubCurrentTrack = subscribeCurrentTrack(({ song }) => {
            currentUniqueIdRef.current = song?._uniqueId ?? null;
            pushQueue();
        });

        return () => {
            pushQueue.cancel();
            unsubQueue();
            unsubCurrentTrack();
        };
    }, [isRemoteEnabled]);
};

export const RemoteQueuePushHook = () => {
    useRemoteQueuePush();
    return null;
};
