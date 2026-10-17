import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

import { getItemImageUrl } from '/@/renderer/components/item-image/item-image';
import { AndroidUpdatePrompt } from '/@/renderer/features/hermes-update/components/hermes-update-button';
import { lyricsQueries } from '/@/renderer/features/lyrics/api/lyrics-api';
import { usePlayer } from '/@/renderer/features/player/context/player-context';
import { isAndroidApp, onSourMedia, sourMedia } from '/@/renderer/features/sour/mobile/android';
import { PhoneFeatures } from '/@/renderer/features/sour/mobile/phone-features';
import { DrivingMode } from '/@/renderer/features/sour/mobile/phone-panels';
import { usePhoneStore } from '/@/renderer/features/sour/mobile/phone-store';
import { toLines } from '/@/renderer/features/sour/stage/sour-stage';
import { useSourProfiles, useSourStore } from '/@/renderer/features/sour/store/sour.store';
import {
    usePlayerSong,
    usePlayerStore,
    usePlayerStoreBase,
    useTimestampStoreBase,
} from '/@/renderer/store';
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
    // the line being sung (lock screen lyrics) and what friends play (the widget)
    const song = usePlayerSong();
    const { data: lyricData } = useQuery(
        lyricsQueries.songLyrics(
            {
                options: { enabled: !!song?.id },
                query: { songId: song?.id || '' },
                serverId: song?._serverId || '',
            },
            song,
        ),
    );
    const lyrics = useRef<{
        lines: { startMs: number; text: string }[];
        offset: number;
        synced: boolean;
    }>({
        lines: [],
        offset: 0,
        synced: false,
    });
    lyrics.current = {
        ...toLines((lyricData?.selected as null | undefined | { lyrics?: unknown })?.lyrics),
        offset: lyricData?.selectedOffsetMs ?? 0,
    };
    const profiles = useSourProfiles().data;
    const me = useSourStore((s) => s.me);
    const friends = useRef('');
    const listening = (profiles ?? []).find((p) => p.id !== me?.id && p.online && p.listening);
    friends.current = listening ? `${listening.name}: ${listening.listening?.title}` : '';
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
        const currentLyric = () => {
            const { lines, offset, synced } = lyrics.current;
            if (!synced || !usePhoneStore.getState().settings.lockLyrics) return '';
            const nowMs = (useTimestampStoreBase.getState().timestamp || 0) * 1000 + offset;
            let text = '';
            for (const line of lines) if (line.startMs <= nowMs + 150) text = line.text;
            return text;
        };
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
                friends: friends.current,
                lyric: currentLyric(),
                playing,
                position: useTimestampStoreBase.getState().timestamp || 0,
                title: song?.name || '',
            };
            const key = JSON.stringify({ ...info, position: Math.round(info.position / 5) });
            // (a new lyric line counts as a change, so the lock screen follows the song)
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
        const timer = window.setInterval(send, 1000);
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
            <PhoneFeatures />
            <DrivingMode />
        </>
    ) : null;
