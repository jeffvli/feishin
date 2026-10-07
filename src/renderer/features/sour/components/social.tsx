import { openModal } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { type ReactNode, useEffect, useRef, useState } from 'react';

import styles from './people.module.css';

import { type GroupSong } from '/@/renderer/features/group-play/store/group-play.store';
import { playsSince } from '/@/renderer/features/hermes-plays/store/play-count.store';
import { useHermesUrl } from '/@/renderer/features/hermes-video/store/hermes-video.store';
import { getSongById } from '/@/renderer/features/player/utils';
import { readPicture, sourApi, type SourProfile } from '/@/renderer/features/sour/api/sour-api';
import { ProfileAvatar, SongCover, usePlaySong } from '/@/renderer/features/sour/components/profile-bits';
import { useSourProfiles, useSourStore } from '/@/renderer/features/sour/store/sour.store';
import { useCurrentServer, usePlayerSong } from '/@/renderer/store';
import { addToQueueByData, usePlayerStoreBase } from '/@/renderer/store/player.store';
import { useTimestampStoreBase } from '/@/renderer/store/timestamp.store';
import { Button } from '/@/shared/components/button/button';
import { FileButton } from '/@/shared/components/file-button/file-button';
import { Group } from '/@/shared/components/group/group';
import { Stack } from '/@/shared/components/stack/stack';
import { TextInput } from '/@/shared/components/text-input/text-input';
import { Text } from '/@/shared/components/text/text';
import { Textarea } from '/@/shared/components/textarea/textarea';
import { toast } from '/@/shared/components/toast/toast';
import { Play, PlayerStatus } from '/@/shared/types/types';

// a popup that can hold buttons (Sour Player's own notifications)
export const notify = (title: string, message: ReactNode, autoClose = 8000) =>
    notifications.show({ autoClose, message, title, withBorder: true });

const isDnd = () => {
    const { me } = useSourStore.getState();
    return !!me && !!(window as { __sourDnd?: boolean }).__sourDnd;
};

// ---------- the friend group's page ----------
const FriendGroupPage = () => {
    const url = useHermesUrl();
    const me = useSourStore((state) => state.me);
    const queryClient = useQueryClient();
    const playSong = usePlaySong();
    const group = useQuery({
        enabled: !!url,
        queryFn: () => sourApi.friendGroup(url),
        queryKey: ['friend-group', url],
    });
    const [editing, setEditing] = useState(false);
    const [name, setName] = useState('');
    const [bio, setBio] = useState('');
    const g = group.data;
    if (!g) return <Text isMuted>Loading...</Text>;
    const refresh = () => queryClient.invalidateQueries({ queryKey: ['friend-group', url] });
    const save = (changes: Record<string, unknown>) =>
        me &&
        sourApi
            .saveFriendGroup(url, me, changes)
            .then(refresh)
            .catch((error: Error) => toast.error({ message: error.message }));
    return (
        <Stack gap="md">
            <div className={styles.groupHero}>
                {g.picture ? (
                    <img alt="" className={styles.groupPic} src={`${url}/api/friend-group/picture?v=${g.picture}`} />
                ) : (
                    <div className={styles.groupPic} />
                )}
                <Stack gap={4} miw={0}>
                    <Text fw={800} size="xl">
                        {g.name}
                    </Text>
                    <Text isMuted size="sm">
                        {g.members.length} people - {g.hoursWeek} hours together this week
                    </Text>
                    <Group gap={4}>
                        {g.members.map((m) => (
                            <ProfileAvatar key={m.id} profile={m} size={26} />
                        ))}
                    </Group>
                </Stack>
            </div>
            {g.bio && <Text className={styles.bio}>{g.bio}</Text>}
            {editing ? (
                <Stack gap="xs">
                    <TextInput label="Group name" onChange={(e) => setName(e.currentTarget.value)} value={name} />
                    <Textarea autosize label="About the group" minRows={3} onChange={(e) => setBio(e.currentTarget.value)} value={bio} />
                    <Group gap="xs">
                        <FileButton
                            accept="image/png,image/jpeg,image/webp,image/gif"
                            onChange={(file) =>
                                file &&
                                readPicture(file, 800, 6000000)
                                    .then((picture) => save({ picture }))
                                    .catch((error: Error) => toast.error({ message: error.message }))
                            }
                        >
                            {(props) => (
                                <Button {...props} size="xs" variant="default">
                                    Group picture
                                </Button>
                            )}
                        </FileButton>
                        <Button
                            onClick={() => {
                                save({ bio, name });
                                setEditing(false);
                            }}
                            size="xs"
                            variant="filled"
                        >
                            Save
                        </Button>
                    </Group>
                </Stack>
            ) : (
                <Button
                    onClick={() => {
                        setName(g.name);
                        setBio(g.bio);
                        setEditing(true);
                    }}
                    size="xs"
                    variant="default"
                    w="fit-content"
                >
                    Edit the group page
                </Button>
            )}
            <Text fw={700}>The group's top songs this week</Text>
            {g.topSongs.map((s, i) => (
                <button className={styles.favoriteSong} key={s.id} onClick={() => playSong(s)} type="button">
                    <Text w={18}>{i + 1}</Text>
                    <SongCover size={36} song={s} />
                    <Stack gap={0} miw={0}>
                        <Text fw={600} size="sm" truncate>
                            {s.title}
                        </Text>
                        <Text isMuted size="xs">
                            {s.artist} - {s.plays} plays
                        </Text>
                    </Stack>
                </button>
            ))}
            {!g.topSongs.length && <Text isMuted size="sm">Nothing played this week yet.</Text>}
        </Stack>
    );
};
export const openFriendGroup = () =>
    openModal({ children: <FriendGroupPage />, size: 'lg', title: 'The group' });

// ---------- weekly leaderboard ----------
export const LeaderboardList = ({ limit }: { limit?: number }) => {
    const url = useHermesUrl();
    const rows = useQuery({
        enabled: !!url,
        queryFn: () => sourApi.leaderboard(url),
        queryKey: ['leaderboard', url],
        refetchInterval: 60000,
    });
    const list = (rows.data ?? []).slice(0, limit ?? 20);
    if (!list.length) return <Text isMuted size="sm">Nobody has listened this week yet.</Text>;
    return (
        <Stack gap={6}>
            {list.map((r, i) => (
                <Group gap="sm" key={r.id} wrap="nowrap">
                    <Text fw={700} w={18}>
                        {i + 1}
                    </Text>
                    <ProfileAvatar profile={r} size={26} />
                    <Text flex={1} size="sm" truncate>
                        {r.name}
                    </Text>
                    <Text isMuted size="xs">
                        {r.hours} h - {r.requests} requests - {r.skips} skips
                    </Text>
                </Group>
            ))}
        </Stack>
    );
};
export const openLeaderboard = () =>
    openModal({
        children: (
            <Stack gap="sm">
                <Text isMuted size="sm">
                    This week, just for fun. It starts over every Monday.
                </Text>
                <LeaderboardList />
            </Stack>
        ),
        size: 'md',
        title: 'Leaderboard',
    });

// ---------- weekly recap and year in review (from plays on this computer) ----------
const Recap = ({ days, title }: { days: number; title: string }) => {
    const playSong = usePlaySong();
    const list = playsSince(days);
    const minutes = Math.round(
        list.reduce((t, x) => t + x.count * ((x.entry.duration ?? 180000) / 60000), 0),
    );
    const artists = new Map<string, number>();
    for (const x of list) artists.set(x.entry.artist, (artists.get(x.entry.artist) ?? 0) + x.count);
    const topArtists = [...artists.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    const [slide, setSlide] = useState(0);
    if (!list.length) return <Text isMuted>No plays on this computer yet - check back after some listening.</Text>;
    const slides: ReactNode[] = [
        <Stack align="center" gap={4} key="minutes">
            <Text className={styles.recapBig}>{minutes.toLocaleString()}</Text>
            <Text>minutes of music</Text>
            <Text isMuted size="sm">
                {list.reduce((t, x) => t + x.count, 0)} plays, {list.length} different songs
            </Text>
        </Stack>,
        <Stack align="center" gap={4} key="artist">
            <Text isMuted size="sm">
                Your top artist
            </Text>
            <Text className={styles.recapBig}>{topArtists[0]?.[0]}</Text>
            <Text isMuted size="sm">
                then {topArtists.slice(1).map((a) => a[0]).join(', ') || 'nobody else'}
            </Text>
        </Stack>,
        <Stack gap={6} key="songs">
            <Text fw={700}>Your top songs</Text>
            {list.slice(0, 5).map((x, i) => (
                <button
                    className={styles.favoriteSong}
                    key={x.entry.id}
                    onClick={() =>
                        playSong({
                            album: x.entry.album,
                            artist: x.entry.artist,
                            duration: x.entry.duration ?? 0,
                            id: x.entry.id,
                            imageId: x.entry.imageId,
                            title: x.entry.name,
                        })
                    }
                    type="button"
                >
                    <Text w={18}>{i + 1}</Text>
                    <Stack gap={0} miw={0}>
                        <Text fw={600} size="sm" truncate>
                            {x.entry.name}
                        </Text>
                        <Text isMuted size="xs">
                            {x.entry.artist} - {x.count} plays
                        </Text>
                    </Stack>
                </button>
            ))}
        </Stack>,
    ];
    return (
        <Stack gap="md">
            <Text className={styles.eyebrow}>{title}</Text>
            <div className={styles.recapSlide}>{slides[slide]}</div>
            <Group justify="space-between">
                <Button disabled={slide === 0} onClick={() => setSlide(slide - 1)} variant="default">
                    Back
                </Button>
                <Text isMuted size="xs">
                    {slide + 1} / {slides.length}
                </Text>
                <Button disabled={slide === slides.length - 1} onClick={() => setSlide(slide + 1)} variant="filled">
                    Next
                </Button>
            </Group>
        </Stack>
    );
};
export const openRecap = () =>
    openModal({ children: <Recap days={7} title="Your week" />, size: 'md', title: 'Weekly recap' });
export const openYearInReview = () =>
    openModal({
        children: <Recap days={365} title="Your year" />,
        size: 'md',
        title: 'Year in review',
    });

// ---------- Blend: a mix of two people's most played songs ----------
export const useBlend = () => {
    const queryClient = useQueryClient();
    const serverId = useCurrentServer()?.id;
    return async (a?: SourProfile, b?: SourProfile) => {
        if (!serverId) return;
        const left = a?.stats?.topSongs ?? [];
        const right = b?.stats?.topSongs ?? [];
        const mix: GroupSong[] = [];
        for (let i = 0; i < Math.max(left.length, right.length) && mix.length < 40; i++) {
            for (const s of [left[i], right[i]]) if (s && !mix.some((m) => m.id === s.id)) mix.push(s);
        }
        if (!mix.length) {
            toast.info({ message: 'Not enough listening yet to blend - play some music first' });
            return;
        }
        const found = await Promise.all(
            mix.map((s) => getSongById({ id: s.id, queryClient, serverId }).catch(() => null)),
        );
        const songs = found.flatMap((r) => r?.items ?? []);
        await addToQueueByData(Play.NOW, songs);
        toast.success({
            message: `Playing a blend of ${songs.length} songs (Save the queue as a playlist to keep it)`,
        });
    };
};

// ---------- listen along: play what a friend is playing, at the same spot ----------
export const ListenAlong = () => {
    const url = useHermesUrl();
    const following = useSourStore((state) => state.listenAlong);
    const setStore = useSourStore((state) => state.set);
    const playSong = usePlaySong();
    const lastSong = useRef<null | string>(null);
    const profiles = useSourProfiles().data ?? [];
    const friend = profiles.find((p) => p.id === following);

    useEffect(() => {
        if (!url || !following) return undefined;
        lastSong.current = null;
        const tick = async () => {
            const p = await sourApi.profile(url, following).catch(() => null);
            if (!p || !p.online || !p.listening) {
                setStore({ listenAlong: null });
                toast.info({ message: `${p?.name ?? 'Your friend'} stopped listening` });
                return;
            }
            const elapsed = p.playing ? (Date.now() - p.positionAt) / 1000 : 0;
            const target = p.position + elapsed;
            const player = usePlayerStoreBase.getState();
            if (player.getCurrentSong()?.id !== p.listening.id && lastSong.current !== p.listening.id) {
                lastSong.current = p.listening.id;
                await playSong(p.listening, target);
                return;
            }
            const playing = player.player.status === PlayerStatus.PLAYING;
            if (p.playing && !playing) player.mediaPlay();
            if (!p.playing && playing) player.mediaPause();
            const now = useTimestampStoreBase.getState().timestamp;
            if (Math.abs(now - target) > 5) player.mediaSeekToTimestamp(target);
        };
        tick();
        const timer = setInterval(tick, 5000);
        return () => clearInterval(timer);
    }, [following, playSong, setStore, url]);

    if (!following || !friend) return null;
    return (
        <Button
            onClick={() => setStore({ listenAlong: null })}
            rightSection={<span>&times;</span>}
            size="compact-xs"
            variant="light"
        >
            With {friend.name}
        </Button>
    );
};

// ---------- background: pings, wall notes, finished requests, milestones, resume ----------
interface RequestRow {
    id: string;
    profile?: string;
    query: string;
    status: string;
    title?: string;
}

export const SocialWatcher = () => {
    const url = useHermesUrl();
    const me = useSourStore((state) => state.me);
    const profiles = useSourProfiles().data ?? [];
    const mine = profiles.find((p) => p.id === me?.id);
    const playSong = usePlaySong();
    const current = usePlayerSong();
    const statuses = useRef(new Map<string, string>());
    const offeredResume = useRef(false);
    (window as { __sourDnd?: boolean }).__sourDnd = !!mine?.custom?.dnd;

    // pings and new wall notes
    useEffect(() => {
        if (!url || !me) return undefined;
        const check = () => {
            const { lastInbox, set } = useSourStore.getState();
            sourApi
                .inbox(url, me, lastInbox)
                .then((box) => {
                    set({ lastInbox: Date.now() });
                    if (isDnd()) return;
                    for (const ping of box.pings) notify('Wake up!', `${ping.fromName} pinged you`);
                    for (const n of box.notes) {
                        notify(
                            n.song ? `${n.fromName} dedicated a song to you` : `${n.fromName} wrote on your wall`,
                            n.song ? (
                                <Group gap="xs">
                                    <Text size="sm">{n.song.title}</Text>
                                    <Button onClick={() => n.song && playSong(n.song)} size="compact-xs">
                                        Play
                                    </Button>
                                </Group>
                            ) : (
                                n.text
                            ),
                        );
                    }
                })
                .catch(() => {});
        };
        check();
        const timer = setInterval(check, 60000);
        return () => clearInterval(timer);
    }, [me, playSong, url]);

    // group milestones (shown once)
    useEffect(() => {
        if (!url) return undefined;
        const check = () =>
            sourApi
                .milestones(url)
                .then((list) => {
                    const { seenMilestones, set } = useSourStore.getState();
                    const fresh = list.filter((m) => !seenMilestones.includes(m.id));
                    if (!fresh.length) return;
                    // the first time, just remember the old ones instead of celebrating them all
                    if (seenMilestones.length) for (const m of fresh) notify('Group milestone', m.text, 12000);
                    set({ seenMilestones: [...seenMilestones, ...fresh.map((m) => m.id)] });
                })
                .catch(() => {});
        check();
        const timer = setInterval(check, 5 * 60000);
        return () => clearInterval(timer);
    }, [url]);

    // your requests: a popup when one finishes downloading
    useEffect(() => {
        if (!url || !me) return undefined;
        const check = () =>
            fetch(`${url}/api/requests`)
                .then((r) => r.json())
                .then((list: RequestRow[]) => {
                    if (!Array.isArray(list)) return;
                    for (const r of list) {
                        if (r.profile !== me.id) continue;
                        const before = statuses.current.get(r.id);
                        statuses.current.set(r.id, r.status);
                        if (before && before !== 'done' && r.status === 'done' && !isDnd()) {
                            notify('Request ready', `${r.title || r.query} is in the library (after the next scan)`);
                        }
                        if (before && before !== 'failed' && r.status === 'failed' && !isDnd()) {
                            notify('Request failed', r.title || r.query);
                        }
                    }
                })
                .catch(() => {});
        check();
        const timer = setInterval(check, 30000);
        return () => clearInterval(timer);
    }, [me, url]);

    // pick up where you left off on another computer
    useEffect(() => {
        if (!url || !me || offeredResume.current || current) return;
        offeredResume.current = true;
        sourApi
            .me(url, me)
            .then((p) => {
                const r = p.resume;
                if (!r || r.device === deviceId() || Date.now() - r.at > 86400000) return;
                notify(
                    'Pick up where you left off?',
                    <Group gap="xs">
                        <Text size="sm">
                            {r.song.title} on your other computer
                        </Text>
                        <Button onClick={() => playSong(r.song, r.position)} size="compact-xs">
                            Resume
                        </Button>
                    </Group>,
                    20000,
                );
            })
            .catch(() => {});
    }, [current, me, playSong, url]);

    return null;
};

// a random name for this computer (to tell "your other computer" apart for resume)
export const deviceId = () => {
    try {
        let id = localStorage.getItem('sour-device');
        if (!id) {
            id = Math.random().toString(36).slice(2, 10);
            localStorage.setItem('sour-device', id);
        }
        return id;
    } catch {
        return 'unknown';
    }
};
