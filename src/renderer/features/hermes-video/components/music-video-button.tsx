import { closeAllModals, openModal } from '@mantine/modals';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { create } from 'zustand';

import styles from './music-video-button.module.css';

import {
    type MusicVideo,
    useMusicVideo,
} from '/@/renderer/features/hermes-video/hooks/use-music-video';
import { useHermesUrl } from '/@/renderer/features/hermes-video/store/hermes-video.store';
import { useSourStore } from '/@/renderer/features/sour/store/sour.store';
import { usePlayerSong } from '/@/renderer/store';
import { usePlayerStoreBase } from '/@/renderer/store/player.store';
import { useTimestampStoreBase } from '/@/renderer/store/timestamp.store';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Button } from '/@/shared/components/button/button';
import { Group } from '/@/shared/components/group/group';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';
import { toast } from '/@/shared/components/toast/toast';
import { PlayerStatus } from '/@/shared/types/types';

interface SyncedVideoProps {
    artist: string;
    compact?: boolean;
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
const SyncedVideo = ({ artist, compact, title, video: saved }: SyncedVideoProps) => {
    // "Live version": a live performance instead of the official video (not synced to the song)
    const [live, setLive] = useState<MusicVideo['live']>(null);
    const video: MusicVideo = live ? { ...saved, offset: 0, videoId: live.videoId } : saved;
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

    const toggleLive = async () => {
        if (live) {
            setLive(null);
            return;
        }
        if (saved.live) {
            setLive(saved.live);
            return;
        }
        try {
            const res = await fetch(`${url}/api/videos/live`, {
                body: JSON.stringify({ artist, title }),
                headers: { 'content-type': 'application/json' },
                method: 'POST',
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(json.error || 'No live performance found');
            setLive(json);
        } catch (error) {
            toast.error({ message: (error as Error).message });
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
            {!compact && (
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
                    <Button onClick={toggleLive} size="compact-sm" variant={live ? 'filled' : 'default'}>
                        {live ? 'Official video' : 'Live version'}
                    </Button>
                    <Button
                        onClick={() => {
                            closeAllModals();
                            useVideoWindow.setState({ floating: true, watch: null });
                        }}
                        size="compact-sm"
                    >
                        Pop out
                    </Button>
                </Group>
            </Group>
            )}
        </>
    );
};

// the floating video window (pop out, auto-open, or a video picked on the video wall)
export const useVideoWindow = create<{
    floating: boolean;
    watch: null | { title: string; videoId: string };
}>(() => ({ floating: false, watch: null }));

// Follows the player: switches video when the song changes, closes when the new song has none.
const MusicVideoWindow = ({ compact }: { compact?: boolean }) => {
    const song = usePlayerSong();
    const { data: video, isFetching } = useMusicVideo(song?.artistName, song?.name);

    useEffect(() => {
        if (!isFetching && !video) {
            if (compact) useVideoWindow.setState({ floating: false });
            else closeAllModals();
        }
    }, [compact, isFetching, video]);

    if (!song || !video) return null;

    return (
        <SyncedVideo
            artist={song.artistName}
            compact={compact}
            key={video.videoId}
            title={song.name}
            video={video}
        />
    );
};

let videoOpen = false;
// opens the music video for the song that's playing (once; used by the button and watch parties)
export const openMusicVideo = () => {
    if (videoOpen || useVideoWindow.getState().floating) return;
    videoOpen = true;
    openModal({
        centered: true,
        children: <MusicVideoWindow />,
        onClose: () => {
            videoOpen = false;
        },
        size: '80vw',
        title: 'Music video',
    });
};

// small always-visible video in the corner of the app
export const FloatingVideo = () => {
    const { floating, watch } = useVideoWindow();
    if (!floating) return null;
    return (
        <div className={styles.floating}>
            <Group gap={4} justify="flex-end">
                {!watch && (
                    <ActionIcon
                        icon="expand"
                        onClick={() => {
                            useVideoWindow.setState({ floating: false });
                            openMusicVideo();
                        }}
                        size="xs"
                        tooltip={{ label: 'Make bigger' }}
                        variant="subtle"
                    />
                )}
                <ActionIcon
                    icon="x"
                    onClick={() => useVideoWindow.setState({ floating: false, watch: null })}
                    size="xs"
                    tooltip={{ label: 'Close' }}
                    variant="subtle"
                />
            </Group>
            {watch ? (
                <div className={styles.frame}>
                    <iframe
                        allow="autoplay; encrypted-media; fullscreen"
                        allowFullScreen
                        referrerPolicy="strict-origin-when-cross-origin"
                        src={`https://www.youtube-nocookie.com/embed/${watch.videoId}?autoplay=1&rel=0&playsinline=1`}
                        title={watch.title}
                    />
                </div>
            ) : (
                <MusicVideoWindow compact />
            )}
        </div>
    );
};

// opens the floating video by itself when a song with a video starts (Settings > Sour Player)
export const AutoVideo = () => {
    const song = usePlayerSong();
    const auto = useSourStore((state) => state.look.autoVideo);
    const { data: video } = useMusicVideo(song?.artistName, song?.name);
    useEffect(() => {
        if (auto && video && !videoOpen) useVideoWindow.setState({ floating: true, watch: null });
    }, [auto, video]);
    return null;
};

// every song that has a music video, to watch any of them
const VideoWall = () => {
    const url = useHermesUrl();
    const list = useQuery({
        enabled: !!url,
        queryFn: async () => {
            const res = await fetch(`${url}/api/videos`);
            const json = await res.json().catch(() => null);
            if (!Array.isArray(json)) throw new Error("That address doesn't answer like Hermes Music");
            return json as { artist: string; song: string; title: string; videoId: string }[];
        },
        queryKey: ['video-wall', url],
    });
    if (!list.data?.length) return <Text isMuted>No music videos yet - add some with /video on the request page.</Text>;
    return (
        <div className={styles.wall}>
            {list.data.map((v) => (
                <button
                    className={styles.wallItem}
                    key={v.videoId}
                    onClick={() => {
                        closeAllModals();
                        useVideoWindow.setState({ floating: true, watch: { title: v.title, videoId: v.videoId } });
                    }}
                    type="button"
                >
                    <img alt="" src={`https://i.ytimg.com/vi/${v.videoId}/mqdefault.jpg`} />
                    <Stack gap={0}>
                        <Text fw={600} size="sm" truncate>
                            {v.song}
                        </Text>
                        <Text isMuted size="xs" truncate>
                            {v.artist}
                        </Text>
                    </Stack>
                </button>
            ))}
        </div>
    );
};
export const openVideoWall = () =>
    openModal({ children: <VideoWall />, size: 'xl', title: 'Video wall' });

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
                openMusicVideo();
            }}
            size="sm"
            tooltip={{ label: t('player.musicVideo'), openDelay: 0 }}
            variant="subtle"
        />
    );
};
