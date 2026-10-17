import { useEffect, useRef } from 'react';

import { getItemImageUrl } from '/@/renderer/components/item-image/item-image';
import { AndroidUpdatePrompt } from '/@/renderer/features/hermes-update/components/hermes-update-button';
import { usePlayer } from '/@/renderer/features/player/context/player-context';
import { isAndroidApp, onSourMedia, sourMedia } from '/@/renderer/features/sour/mobile/android';
import { usePlayerStore, usePlayerStoreBase, useTimestampStoreBase } from '/@/renderer/store';
import { LibraryItem, QueueSong } from '/@/shared/types/domain-types';
import { PlayerStatus } from '/@/shared/types/types';

// Android: keeps the phone's media notification, lock screen, headset buttons and Android Auto in
// step with the player, and plays what they ask for. Mounted next to the media session hook.

const coverOf = (song?: QueueSong) =>
    song
        ? getItemImageUrl({
              id: song.imageId || undefined,
              imageUrl: song.imageUrl,
              itemType: LibraryItem.SONG,
              type: 'itemCard',
          }) || ''
        : '';

const AndroidMediaInner = () => {
    const player = usePlayer();
    const playerRef = useRef(player);
    playerRef.current = player;

    // the controls (notification, lock screen, car) ask the player to do something
    useEffect(
        () =>
            onSourMedia('action', (e: { action: string; index?: number; position?: number }) => {
                const p = playerRef.current;
                switch (e.action) {
                    case 'next':
                        p.mediaNext(false);
                        break;
                    case 'pause':
                        p.mediaPause();
                        break;
                    case 'play':
                        p.mediaPlay();
                        break;
                    case 'playIndex':
                        if (typeof e.index === 'number') p.mediaPlayByIndex(e.index);
                        break;
                    case 'previous':
                        p.mediaPrevious(false);
                        break;
                    case 'seek':
                        if (typeof e.position === 'number') p.mediaSeekToTimestamp(e.position);
                        break;
                    case 'stop':
                        p.mediaStop();
                        break;
                }
            }),
        [],
    );

    // what's playing, sent whenever the song, play state or (every few seconds) the position changes
    useEffect(() => {
        let last = '';
        let lastQueue = '';
        const send = () => {
            const state = usePlayerStoreBase.getState();
            const song = usePlayerStore.getState().getCurrentSong();
            const playing = state.player.status === PlayerStatus.PLAYING;
            const info = {
                album: song?.album || '',
                art: coverOf(song),
                artist: song?.artistName || '',
                duration: song?.duration ? song.duration / 1000 : 0,
                playing,
                position: useTimestampStoreBase.getState().timestamp || 0,
                title: song?.name || '',
            };
            const key = JSON.stringify({ ...info, position: Math.round(info.position / 5) });
            if (key !== last) {
                last = key;
                sourMedia('update', info).catch(() => undefined);
            }
            // the queue, for Android Auto's Up next list
            const items = usePlayerStore.getState().getQueue().items.slice(0, 200);
            const queueKey = items.map((s) => s._uniqueId).join(',');
            if (queueKey !== lastQueue) {
                lastQueue = queueKey;
                sourMedia('setQueue', {
                    items: items.map((s) => ({
                        art: coverOf(s),
                        artist: s.artistName || '',
                        title: s.name || '',
                    })),
                }).catch(() => undefined);
            }
        };
        send();
        const unsubPlayer = usePlayerStoreBase.subscribe(send);
        const timer = window.setInterval(send, 5000);
        return () => {
            unsubPlayer();
            window.clearInterval(timer);
        };
    }, []);

    return null;
};

export const AndroidMediaHook = () =>
    isAndroidApp() ? (
        <>
            <AndroidMediaInner />
            <AndroidUpdatePrompt />
        </>
    ) : null;
