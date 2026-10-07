import { useQuery, useQueryClient } from '@tanstack/react-query';
import { type ReactNode, useState } from 'react';

import styles from './home-sections.module.css';

import { groupApi } from '/@/renderer/features/group-play/api/group-play-api';
import {
    type GroupSong,
    useGroupPlayStore,
} from '/@/renderer/features/group-play/store/group-play.store';
import { playsSince, usePlayCountStore } from '/@/renderer/features/hermes-plays/store/play-count.store';
import { useHermesUrl } from '/@/renderer/features/hermes-video/store/hermes-video.store';
import { getSongById } from '/@/renderer/features/player/utils';
import { songsQueries } from '/@/renderer/features/songs/api/songs-api';
import { favoriteKind, sourApi } from '/@/renderer/features/sour/api/sour-api';
import { openProfile } from '/@/renderer/features/sour/components/people';
import {
    activity,
    ProfileAvatar,
    SongCover,
    usePlaySong,
} from '/@/renderer/features/sour/components/profile-bits';
import { LeaderboardList, useBlend } from '/@/renderer/features/sour/components/social';
import { useSourProfiles, useSourStore } from '/@/renderer/features/sour/store/sour.store';
import { HomeItem, useCurrentServer } from '/@/renderer/store';
import { addToQueueByData } from '/@/renderer/store/player.store';
import { Button } from '/@/shared/components/button/button';
import { Group } from '/@/shared/components/group/group';
import { Select } from '/@/shared/components/select/select';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';
import { toast } from '/@/shared/components/toast/toast';
import { Played } from '/@/shared/types/domain-types';
import { Play } from '/@/shared/types/types';

// Home sections that come from the friend group (Hermes Music) or this computer's plays.
export const SOUR_HOME_ITEMS = new Set<string>([
    HomeItem.BLEND,
    HomeItem.FRIENDS_PLAYING,
    HomeItem.GROUP_TOP,
    HomeItem.JUMP_BACK_IN,
    HomeItem.LEADERBOARD,
    HomeItem.SHARED_FAVORITES,
    HomeItem.SMART_PLAYLISTS,
    HomeItem.SONG_OF_THE_DAY,
    HomeItem.SOUR_RADIO,
    HomeItem.YOUR_REQUESTS,
]);

const Box = ({ children, title }: { children: ReactNode; title: string }) => (
    <section className={styles.box}>
        <Text className={styles.label}>{title}</Text>
        {children}
    </section>
);

const SongRow = ({ extra, song }: { extra?: string; song: GroupSong }) => {
    const playSong = usePlaySong();
    return (
        <button className={styles.row} onClick={() => playSong(song)} type="button">
            <SongCover size={36} song={song} />
            <Stack gap={0} miw={0}>
                <Text fw={600} size="sm" truncate>
                    {song.title}
                </Text>
                <Text isMuted size="xs" truncate>
                    {song.artist}
                    {extra ? ` - ${extra}` : ''}
                </Text>
            </Stack>
        </button>
    );
};

// join a group or station from Home and open the Group Play panel
const useJoin = () => {
    const url = useHermesUrl();
    const me = useSourStore((state) => state.me);
    return async (code: string) => {
        const { actions, userName } = useGroupPlayStore.getState();
        try {
            const res = await groupApi.join(url, code, userName.trim() || 'Guest', me?.id ?? null);
            actions.setSession({ code, member: res.member, role: 'member' });
            actions.setState(res.state);
            useGroupPlayStore.setState({ panelOpen: true });
        } catch (error) {
            toast.error({ message: (error as Error).message });
        }
    };
};

const RadioCard = () => {
    const url = useHermesUrl();
    const join = useJoin();
    const inGroup = useGroupPlayStore((state) => state.code);
    const list = useQuery({
        enabled: !!url,
        queryFn: () => groupApi.list(url),
        queryKey: ['group-play-list', url],
        refetchInterval: 10000,
    });
    const radio = list.data?.find((g) => g.code === 'RADIO');
    if (!radio) return null;
    return (
        <section className={styles.radio}>
            {radio.nowPlaying ? (
                <SongCover
                    size={64}
                    song={{ album: '', artist: radio.nowPlaying.artist, duration: 0, id: 'radio', imageId: radio.nowPlaying.imageId, title: radio.nowPlaying.title }}
                />
            ) : (
                <div className={styles.placeholder} />
            )}
            <Stack flex={1} gap={0} miw={0}>
                <Text className={styles.label}>Sour Radio - live</Text>
                <Text fw={700} size="lg" truncate>
                    {radio.nowPlaying?.title ?? 'Waiting for listeners'}
                </Text>
                <Text isMuted size="sm" truncate>
                    {radio.nowPlaying?.artist ?? 'Join and it starts playing'} - {radio.listening} listening
                </Text>
            </Stack>
            <Button
                onClick={() =>
                    inGroup === 'RADIO' ? useGroupPlayStore.setState({ panelOpen: true }) : join('RADIO')
                }
                variant="filled"
            >
                {inGroup === 'RADIO' ? 'Open' : 'Join'}
            </Button>
        </section>
    );
};

const FriendsPlaying = () => {
    const me = useSourStore((state) => state.me);
    const setStore = useSourStore((state) => state.set);
    const join = useJoin();
    const friends = (useSourProfiles().data ?? []).filter((p) => p.online && p.id !== me?.id);
    return (
        <Box title="Friends are playing">
            {!friends.length && (
                <Text isMuted size="sm">
                    Nobody else is online right now.
                </Text>
            )}
            <div className={styles.friends}>
                {friends.map((p) => (
                    <div className={styles.friend} key={p.id}>
                        <button className={styles.friendInfo} onClick={() => openProfile(p)} type="button">
                            <ProfileAvatar online profile={p} size={34} />
                            <Stack gap={0} miw={0}>
                                <Text fw={600} size="sm" truncate>
                                    {p.name}
                                </Text>
                                <Text isMuted size="xs" truncate>
                                    {activity(p)}
                                </Text>
                            </Stack>
                        </button>
                        {p.group ? (
                            <Button onClick={() => p.group && join(p.group.code)} size="compact-xs" variant="default">
                                Join
                            </Button>
                        ) : (
                            p.listening && (
                                <Button
                                    onClick={() => setStore({ listenAlong: p.id })}
                                    size="compact-xs"
                                    variant="default"
                                >
                                    Listen along
                                </Button>
                            )
                        )}
                    </div>
                ))}
            </div>
        </Box>
    );
};

interface RequestRow {
    id: string;
    pos?: number;
    profile?: string;
    query: string;
    status: string;
    title?: string;
}

const YourRequests = () => {
    const url = useHermesUrl();
    const me = useSourStore((state) => state.me);
    const list = useQuery({
        enabled: !!url && !!me,
        queryFn: async () => {
            const json = await fetch(`${url}/api/requests`).then((r) => r.json());
            return (Array.isArray(json) ? json : []) as RequestRow[];
        },
        queryKey: ['hermes-requests', url],
        refetchInterval: 15000,
    });
    const mine = (list.data ?? []).filter((r) => r.profile === me?.id).slice(0, 5);
    const label = (r: RequestRow) =>
        r.status === 'done'
            ? 'Ready to play'
            : r.status === 'working'
              ? 'Downloading'
              : r.status === 'failed'
                ? 'Failed'
                : r.pos
                  ? `Queued #${r.pos}`
                  : 'Queued';
    return (
        <Box title="Your requests">
            {!mine.length && (
                <Text isMuted size="sm">
                    Nothing requested yet - the + button in the player bar asks Hermes Music for music.
                </Text>
            )}
            {mine.map((r) => (
                <Group gap="xs" justify="space-between" key={r.id} wrap="nowrap">
                    <Text size="sm" truncate>
                        {r.title || r.query}
                    </Text>
                    <Text className={r.status === 'done' ? styles.ready : styles.muted} size="xs">
                        {label(r)}
                    </Text>
                </Group>
            ))}
        </Box>
    );
};

const SongOfTheDay = () => {
    const url = useHermesUrl();
    const song = useQuery({
        enabled: !!url,
        queryFn: () => sourApi.songOfTheDay(url),
        queryKey: ['song-of-the-day', url],
        staleTime: 30 * 60000,
    });
    if (!song.data) return null;
    return (
        <Box title="Song of the day">
            <SongRow extra={`${song.data.plays} plays in the group`} song={song.data} />
        </Box>
    );
};

const JumpBackIn = () => {
    const plays = usePlayCountStore((state) => state.plays);
    const recent = Object.values(plays)
        .sort((a, b) => b.last - a.last)
        .slice(0, 6);
    if (!recent.length) return null;
    return (
        <Box title="Jump back in">
            <div className={styles.grid}>
                {recent.map((p) => (
                    <SongRow
                        key={p.id}
                        song={{ album: p.album, artist: p.artist, duration: p.duration ?? 0, id: p.id, imageId: p.imageId, title: p.name }}
                    />
                ))}
            </div>
        </Box>
    );
};

const Blend = () => {
    const me = useSourStore((state) => state.me);
    const profiles = useSourProfiles().data ?? [];
    const blend = useBlend();
    const [friend, setFriend] = useState<null | string>(null);
    const others = profiles.filter((p) => p.id !== me?.id && p.stats?.topSongs.length);
    if (!others.length) return null;
    return (
        <Box title="Blend">
            <Text isMuted size="sm">
                A mix of your most played songs and a friend&#39;s.
            </Text>
            <Group gap="xs">
                <Select
                    data={others.map((p) => ({ label: p.name, value: p.id }))}
                    onChange={setFriend}
                    placeholder="Pick a friend"
                    size="xs"
                    value={friend}
                />
                <Button
                    disabled={!friend}
                    onClick={() =>
                        blend(
                            profiles.find((p) => p.id === me?.id),
                            profiles.find((p) => p.id === friend),
                        )
                    }
                    size="xs"
                    variant="filled"
                >
                    Play blend
                </Button>
            </Group>
        </Box>
    );
};

const GroupTop = () => {
    const url = useHermesUrl();
    const top = useQuery({
        enabled: !!url,
        queryFn: () => sourApi.groupTop(url),
        queryKey: ['group-top', url],
        staleTime: 10 * 60000,
    });
    if (!top.data?.length) return null;
    return (
        <Box title="The group's top songs this week">
            <div className={styles.grid}>
                {top.data.slice(0, 10).map((s) => (
                    <SongRow extra={`${s.plays} plays`} key={s.id} song={s} />
                ))}
            </div>
        </Box>
    );
};

const SharedFavorites = () => {
    const profiles = useSourProfiles().data ?? [];
    const count = new Map<string, { n: number; song: GroupSong; who: string[] }>();
    for (const p of profiles) {
        for (const f of p.favorites) {
            if (favoriteKind(f) !== 'song') continue;
            const e = count.get(f.id) ?? { n: 0, song: f, who: [] };
            e.n++;
            e.who.push(p.name);
            count.set(f.id, e);
        }
    }
    const shared = [...count.values()].filter((e) => e.n > 1).sort((a, b) => b.n - a.n);
    if (!shared.length) return null;
    return (
        <Box title="Shared favourites">
            <div className={styles.grid}>
                {shared.slice(0, 10).map((e) => (
                    <SongRow extra={e.who.join(', ')} key={e.song.id} song={e.song} />
                ))}
            </div>
        </Box>
    );
};

// playlists made on the fly from this computer's plays
const SmartPlaylists = () => {
    const queryClient = useQueryClient();
    const serverId = useCurrentServer()?.id;
    const plays = usePlayCountStore((state) => state.plays);
    const play = async (ids: string[], name: string) => {
        if (!serverId || !ids.length) {
            toast.info({ message: `Nothing for ${name} yet` });
            return;
        }
        const found = await Promise.all(
            ids.map((id) => getSongById({ id, queryClient, serverId }).catch(() => null)),
        );
        await addToQueueByData(Play.NOW, found.flatMap((r) => r?.items ?? []));
    };
    const onRepeat = playsSince(7).slice(0, 25).map((x) => x.entry.id);
    const forgotten = Object.values(plays)
        .filter((p) => Date.now() - p.last > 30 * 86400000)
        .sort((a, b) => b.count - a.count)
        .slice(0, 25)
        .map((p) => p.id);
    const neverPlayed = async () => {
        if (!serverId) return;
        const res = await queryClient.fetchQuery({
            ...songsQueries.random({ query: { limit: 100, played: Played.All }, serverId }),
            queryKey: ['never-played', Date.now()],
        });
        const fresh = res.items.filter((s) => !plays[s.id]).slice(0, 30);
        await addToQueueByData(Play.NOW, fresh);
    };
    return (
        <Box title="Smart playlists">
            <Group gap="xs">
                <Button onClick={() => play(onRepeat, 'On repeat')} size="xs" variant="default">
                    On repeat (this week)
                </Button>
                <Button onClick={() => play(forgotten, 'Forgotten favourites')} size="xs" variant="default">
                    Forgotten favourites
                </Button>
                <Button onClick={neverPlayed} size="xs" variant="default">
                    Never played
                </Button>
            </Group>
        </Box>
    );
};

export const SourHomeSection = ({ id }: { id: string }) => {
    const url = useHermesUrl();
    if (!url && id !== HomeItem.JUMP_BACK_IN && id !== HomeItem.SMART_PLAYLISTS) return null;
    switch (id) {
        case HomeItem.BLEND:
            return <Blend />;
        case HomeItem.FRIENDS_PLAYING:
            return <FriendsPlaying />;
        case HomeItem.GROUP_TOP:
            return <GroupTop />;
        case HomeItem.JUMP_BACK_IN:
            return <JumpBackIn />;
        case HomeItem.LEADERBOARD:
            return (
                <Box title="This week's leaderboard">
                    <LeaderboardList limit={5} />
                </Box>
            );
        case HomeItem.SHARED_FAVORITES:
            return <SharedFavorites />;
        case HomeItem.SMART_PLAYLISTS:
            return <SmartPlaylists />;
        case HomeItem.SONG_OF_THE_DAY:
            return <SongOfTheDay />;
        case HomeItem.SOUR_RADIO:
            return <RadioCard />;
        case HomeItem.YOUR_REQUESTS:
            return <YourRequests />;
        default:
            return null;
    }
};
