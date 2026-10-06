import { closeAllModals, openModal } from '@mantine/modals';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import styles from './music-video-button.module.css';

import {
    type MusicVideo,
    useMusicVideo,
} from '/@/renderer/features/hermes-video/hooks/use-music-video';
import { useHermesUrl } from '/@/renderer/features/hermes-video/store/hermes-video.store';
import { usePlayerSong } from '/@/renderer/store';
import { usePlayerStoreBase } from '/@/renderer/store/player.store';
import { useTimestampStoreBase } from '/@/renderer/store/timestamp.store';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Button } from '/@/shared/components/button/button';
import { Group } from '/@/shared/components/group/group';
import { Text } from '/@/shared/components/text/text';
import { toast } from '/@/shared/components/toast/toast';
import { PlayerStatus } from '/@/shared/types/types';

interface SyncedVideoProps {
    artist: string;
    title: string;
    video: MusicVideo;
}

interface YouTubeMessage {
    event?: string;
    info?: { currentTime?: number; duration?: number; playerState?: number };
}

// Plays the music video muted and in step with the song, like YouTube Music: the song keeps
// playing from the music server and the video follows play, pause and seek. Streamed with
// YouTube's embedded player (privacy-enhanced domain); nothing is downloaded.
// "offset" = seconds into the video where the song starts.
const SyncedVideo = ({ artist, title, video }: SyncedVideoProps) => {
    const url = useHermesUrl();
    const queryClient = useQueryClient();
    const frame = useRef<HTMLIFrameElement>(null);
    const yt = useRef({ at: 0, duration: 0, playing: false, time: 0 });
    const offsetRef = useRef(video.offset ?? 0);
    const [nudge, setNudge] = useState(0);
    const [saving, setSaving] = useState(false);
    const [skipping, setSkipping] = useState(false);
    const offset = (video.offset ?? 0) + nudge;

    useEffect(() => {
        offsetRef.current = offset;
    }, [offset]);

    useEffect(() => {
        const send = (message: Record<string, unknown>) =>
            frame.current?.contentWindow?.postMessage(JSON.stringify(message), '*');
        const command = (func: string, args: unknown[] = []) =>
            send({ args, event: 'command', func });

        const onMessage = (event: MessageEvent) => {
            if (event.source !== frame.current?.contentWindow) return;
            let data: YouTubeMessage;
            try {
                data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
            } catch {
                return;
            }
            if (data.event !== 'infoDelivery' || !data.info) return;
            const { currentTime, duration, playerState } = data.info;
            if (typeof currentTime === 'number') {
                yt.current.time = currentTime;
                yt.current.at = performance.now();
            }
            if (typeof duration === 'number') yt.current.duration = duration;
            if (typeof playerState === 'number') yt.current.playing = playerState === 1;
        };
        window.addEventListener('message', onMessage);

        // ask the player to report its time; repeated because the player may not be ready yet
        const listen = setInterval(() => {
            send({ channel: 'widget', event: 'listening', id: 'hermes-video' });
            command('mute');
        }, 1000);

        let songTs = -1;
        let songAt = 0;
        let lastSeek = 0;
        const sync = setInterval(() => {
            const now = performance.now();
            const ts = useTimestampStoreBase.getState().timestamp;
            const playing = usePlayerStoreBase.getState().player.status === PlayerStatus.PLAYING;
            // the song position only updates about twice a second; estimate in between
            if (ts !== songTs) {
                songTs = ts;
                songAt = now;
            }
            const target = songTs + (playing ? (now - songAt) / 1000 : 0) + offsetRef.current;
            const v = yt.current;
            const videoTime = v.time + (v.playing ? (now - v.at) / 1000 : 0);
            if (target < 0 || (v.duration && target > v.duration)) {
                if (v.playing) command('pauseVideo');
                return;
            }
            if (Math.abs(videoTime - target) > 0.4 && now - lastSeek > 1500) {
                command('seekTo', [target, true]);
                yt.current = { ...v, at: now, time: target };
                lastSeek = now;
            }
            if (playing && !v.playing) command('playVideo');
            if (!playing && v.playing) command('pauseVideo');
        }, 250);

        return () => {
            window.removeEventListener('message', onMessage);
            clearInterval(listen);
            clearInterval(sync);
        };
    }, []);

    const save = async () => {
        if (!url) return;
        setSaving(true);
        try {
            const res = await fetch(`${url}/api/videos/offset`, {
                body: JSON.stringify({ artist, offset, title }),
                headers: { 'content-type': 'application/json' },
                method: 'POST',
            });
            if (!res.ok) throw new Error(`Hermes Music returned ${res.status}`);
            queryClient.setQueryData(['hermes-video', url, artist, title], { ...video, offset });
            setNudge(0);
            toast.success({ message: 'Video timing saved' });
        } catch (error) {
            toast.error({ message: (error as Error).message });
        } finally {
            setSaving(false);
        }
    };

    // not the right video: Hermes Music moves on to the next candidate and checks it by sound
    const wrongVideo = async () => {
        if (!url) return;
        setSkipping(true);
        try {
            const res = await fetch(`${url}/api/videos/wrong`, {
                body: JSON.stringify({ artist, title }),
                headers: { 'content-type': 'application/json' },
                method: 'POST',
            });
            if (!res.ok) throw new Error(`Hermes Music returned ${res.status}`);
            const result = (await res.json()) as { removed?: boolean };
            toast.info({
                message: result.removed
                    ? 'No other video matches this song, so it was removed'
                    : 'Trying the next video',
            });
            await queryClient.invalidateQueries({ queryKey: ['hermes-video', url, artist, title] });
        } catch (error) {
            toast.error({ message: (error as Error).message });
        } finally {
            setSkipping(false);
        }
    };

    const params = 'enablejsapi=1&mute=1&autoplay=1&controls=0&rel=0&playsinline=1&disablekb=1';

    return (
        <>
            <div className={styles.frame}>
                <iframe
                    allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                    allowFullScreen
                    ref={frame}
                    referrerPolicy="strict-origin-when-cross-origin"
                    src={`https://www.youtube-nocookie.com/embed/${video.videoId}?${params}`}
                    title={video.title || 'Music video'}
                />
            </div>
            <Group justify="space-between" mt="sm">
                <Text isMuted size="sm">
                    {`${artist} - ${title} - timing ${offset >= 0 ? '+' : ''}${offset.toFixed(1)}s`}
                </Text>
                <Group gap="xs">
                    <Button disabled={skipping} onClick={wrongVideo} size="compact-sm">
                        Wrong video
                    </Button>
                    <Button onClick={() => setNudge((n) => n - 0.5)} size="compact-sm">
                        -0.5s
                    </Button>
                    <Button onClick={() => setNudge((n) => n + 0.5)} size="compact-sm">
                        +0.5s
                    </Button>
                    <Button
                        disabled={!nudge || saving}
                        onClick={save}
                        size="compact-sm"
                        variant="filled"
                    >
                        Save timing
                    </Button>
                </Group>
            </Group>
        </>
    );
};

// Follows the player: switches video when the song changes, closes when the new song has none.
const MusicVideoWindow = () => {
    const song = usePlayerSong();
    const { data: video, isFetching } = useMusicVideo(song?.artistName, song?.name);

    useEffect(() => {
        if (!isFetching && !video) closeAllModals();
    }, [isFetching, video]);

    if (!song || !video) return null;

    return (
        <SyncedVideo artist={song.artistName} key={video.videoId} title={song.name} video={video} />
    );
};

// Shows up in the player bar only when Hermes Music has a music video for the current song.
export const MusicVideoButton = () => {
    const { t } = useTranslation();
    const song = usePlayerSong();
    const { data: video } = useMusicVideo(song?.artistName, song?.name);

    if (!song || !video) return null;

    return (
        <ActionIcon
            icon="musicVideo"
            iconProps={{ size: 'lg' }}
            onClick={(e) => {
                e.stopPropagation();
                openModal({
                    centered: true,
                    children: <MusicVideoWindow />,
                    size: '80vw',
                    title: t('player.musicVideo'),
                });
            }}
            size="sm"
            tooltip={{ label: t('player.musicVideo'), openDelay: 0 }}
            variant="subtle"
        />
    );
};
