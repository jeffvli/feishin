import { useQuery, useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import { useEffect, useMemo, useState } from 'react';

import styles from './home-plus.module.css';

import { genresQueries } from '/@/renderer/features/genres/api/genres-api';
import { type GroupSong } from '/@/renderer/features/group-play/store/group-play.store';
import { useHermesUrl } from '/@/renderer/features/hermes-video/store/hermes-video.store';
import { songsQueries } from '/@/renderer/features/songs/api/songs-api';
import { socialApi } from '/@/renderer/features/sour/api/social-api';
import { sourApi, timeAgo } from '/@/renderer/features/sour/api/sour-api';
import { HotSeatCard } from '/@/renderer/features/sour/components/hub-panels';
import { openProfile } from '/@/renderer/features/sour/components/people';
import {
    activity,
    nameColor,
    ProfileAvatar,
    SongCover,
    usePlaySong,
} from '/@/renderer/features/sour/components/profile-bits';
import { quickMixes } from '/@/renderer/features/sour/components/quick-mixes';
import { currentHoliday } from '/@/renderer/features/sour/skins/holidays';
import {
    useMyProfile,
    useSourProfiles,
    useSourStore,
} from '/@/renderer/features/sour/store/sour.store';
import { useHoverPreview } from '/@/renderer/features/sour/utils/preview';
import { queueGroupSongs, shuffled } from '/@/renderer/features/sour/utils/queue';
import { setReason } from '/@/renderer/features/sour/utils/reasons';
import { useCurrentServer } from '/@/renderer/store';
import { addToQueueByData } from '/@/renderer/store/player.store';
import { Button } from '/@/shared/components/button/button';
import { Slider } from '/@/shared/components/slider/slider';
import { Text } from '/@/shared/components/text/text';
import { toast } from '/@/shared/components/toast/toast';
import { GenreListSort, Played, type Song, SortOrder } from '/@/shared/types/domain-types';
import { Play } from '/@/shared/types/types';

const fail = (error: Error) => toast.error({ message: error.message });

// random songs from the library (optionally a genre or some years), played straight away
const usePlayRandom = () => {
    const qc = useQueryClient();
    const serverId = useCurrentServer()?.id;
    return async (
        query: { genre?: string; maxYear?: number; minYear?: number },
        reason: string,
    ) => {
        if (!serverId) return;
        try {
            const res = await qc.fetchQuery({
                ...songsQueries.random({
                    query: { limit: 40, played: Played.All, ...query },
                    serverId,
                }),
                queryKey: ['sour-random-mix', Date.now(), query],
            });
            let items: Song[] = res.items;
            if (items.length < 5 && query.genre) {
                // nothing with that genre: fall back to anything
                items = (
                    await qc.fetchQuery({
                        ...songsQueries.random({
                            query: { limit: 40, played: Played.All },
                            serverId,
                        }),
                        queryKey: ['sour-random-mix', Date.now()],
                    })
                ).items;
            }
            if (!items.length) {
                toast.info({ message: 'No songs found' });
                return;
            }
            setReason(
                items.map((s) => s.id),
                reason,
            );
            await addToQueueByData(Play.NOW, items);
        } catch (error) {
            fail(error as Error);
        }
    };
};

// ---------- hero: a greeting and a banner that rotates through what's happening ----------
interface Slide {
    action?: () => void;
    actionLabel?: string;
    eyebrow: string;
    song?: GroupSong | null;
    text: string;
    title: string;
}

const greeting = (hour: number) =>
    hour < 5
        ? 'Up late'
        : hour < 12
          ? 'Good morning'
          : hour < 18
            ? 'Good afternoon'
            : 'Good evening';

export const SourHero = () => {
    const url = useHermesUrl();
    const mine = useMyProfile().data;
    const play = usePlaySong();
    const [slide, setSlide] = useState(0);
    const [hour] = useState(() => new Date().getHours());
    const sotd = useQuery({
        enabled: !!url,
        queryFn: () => sourApi.songOfTheDay(url),
        queryKey: ['sour-sotd', url],
        staleTime: 10 * 60000,
    });
    const feed = useQuery({
        enabled: !!url,
        queryFn: () => socialApi.activity(url),
        queryKey: ['sour-activity', url],
        refetchInterval: 60000,
    });
    const holiday = useSourStore((s) => (s.look.holidays ? currentHoliday() : null));
    const slides: Slide[] = [];
    if (sotd.data) {
        const song = sotd.data;
        slides.push({
            action: () => play(song),
            actionLabel: 'Play',
            eyebrow: 'Song of the day',
            song,
            text: `${song.plays} plays in the group`,
            title: song.title,
        });
    }
    if (holiday)
        slides.push({
            eyebrow: holiday.name,
            text: 'The holiday skin is on - change it in the Sour Studio.',
            title: `${holiday.emoji} ${holiday.greeting}`,
        });
    for (const a of (feed.data ?? []).filter((x) => x.song).slice(0, 3)) {
        const song = a.song;
        slides.push({
            action: song ? () => play(song) : undefined,
            actionLabel: song ? 'Play' : undefined,
            eyebrow: timeAgo(a.at),
            song,
            text: `${a.byName ?? 'Someone'} ${a.text}`,
            title: song?.title ?? '',
        });
    }
    if (!slides.length)
        slides.push({
            eyebrow: 'Sour Player',
            text: 'Play something, send a friend a song, or start a Group Play.',
            title: 'Welcome back',
        });
    useEffect(() => {
        if (slides.length < 2) return undefined;
        const timer = setInterval(() => setSlide((n) => (n + 1) % slides.length), 7000);
        return () => clearInterval(timer);
    }, [slides.length]);
    const current = slides[slide % slides.length];
    return (
        <section className={styles.hero}>
            <Text className={styles.greet}>
                {greeting(hour)}
                {mine?.name ? `, ${mine.name}` : ''}
            </Text>
            <div className={styles.banner} key={slide}>
                {current.song && <SongCover size={86} song={current.song} />}
                <div className={styles.bannerText}>
                    <span className={styles.eyebrow}>{current.eyebrow}</span>
                    <span className={styles.bannerTitle}>{current.title}</span>
                    <span className={styles.muted}>{current.text}</span>
                </div>
                {current.action && (
                    <Button onClick={current.action} size="sm">
                        {current.actionLabel}
                    </Button>
                )}
            </div>
            {slides.length > 1 && (
                <div className={styles.dots}>
                    {slides.map((s, i) => (
                        <button
                            aria-label={`Show ${s.eyebrow}`}
                            className={clsx(styles.dot, {
                                [styles.dotOn]: i === slide % slides.length,
                            })}
                            key={`${s.eyebrow}-${i}`}
                            onClick={() => setSlide(i)}
                            type="button"
                        />
                    ))}
                </div>
            )}
        </section>
    );
};

// ---------- mood tiles ----------
const MOODS: Array<{ color: string; genres: string[]; label: string }> = [
    { color: '#1d3b4a', genres: ['Chill', 'Lo-Fi', 'Ambient', 'Jazz', 'Acoustic'], label: 'Chill' },
    { color: '#5a1f2a', genres: ['Hip-Hop', 'Rap', 'Electronic', 'Dance', 'EDM'], label: 'Hype' },
    {
        color: '#2a2850',
        genres: ['Indie', 'Alternative', 'Singer-Songwriter', 'Soul'],
        label: 'In my feels',
    },
    { color: '#24421f', genres: ['Classical', 'Ambient', 'Instrumental', 'Piano'], label: 'Focus' },
    { color: '#5a3d10', genres: ['Pop', 'Dance', 'Disco', 'Funk'], label: 'Party' },
    { color: '#3b2a1a', genres: ['Rock', 'Metal', 'Punk'], label: 'Loud' },
];

export const MoodTiles = () => {
    const playRandom = usePlayRandom();
    return (
        <section className={styles.section}>
            <Text className={styles.label}>Pick a mood</Text>
            <div className={styles.moods}>
                {MOODS.map((m) => (
                    <button
                        className={styles.mood}
                        key={m.label}
                        onClick={() =>
                            playRandom(
                                { genre: m.genres[Math.floor(Math.random() * m.genres.length)] },
                                `Mood: ${m.label}`,
                            )
                        }
                        style={{ background: m.color }}
                        type="button"
                    >
                        {m.label}
                    </button>
                ))}
            </div>
            <Text className={styles.label}>Quick mixes</Text>
            <div className={styles.moods}>
                {QUICK.map((q) => (
                    <button
                        className={styles.mood}
                        key={q.label}
                        onClick={q.run}
                        style={{ background: q.color }}
                        type="button"
                    >
                        {q.label}
                        <span className={styles['mood-hint']}>{q.hint}</span>
                    </button>
                ))}
            </div>
        </section>
    );
};

const QUICK = [
    {
        color: '#3a1f4f',
        hint: 'Songs you have never played',
        label: 'Never heard',
        run: quickMixes.neverHeard,
    },
    {
        color: '#4a2a12',
        hint: 'Things you played before',
        label: 'Old favorites',
        run: quickMixes.oldFavorites,
    },
    {
        color: '#12384a',
        hint: "The playing song's decade",
        label: 'This decade',
        run: quickMixes.decade,
    },
    {
        color: '#1f4a2c',
        hint: "The playing song's genre",
        label: 'This genre',
        run: quickMixes.genre,
    },
];

// ---------- friends as big cards ----------
export const FriendCards = () => {
    const me = useSourStore((s) => s.me);
    const profiles = (useSourProfiles().data ?? []).filter((p) => p.id !== me?.id).slice(0, 8);
    if (!profiles.length) return null;
    return (
        <section className={styles.section}>
            <Text className={styles.label}>Friends right now</Text>
            <div className={styles.friends}>
                {profiles.map((p) => {
                    const song = p.online ? p.listening : (p.custom?.recentPlays?.[0] ?? null);
                    return (
                        <button
                            className={clsx(styles.friend, { [styles.away]: !p.online })}
                            key={p.id}
                            onClick={() => openProfile(p)}
                            type="button"
                        >
                            <div className={styles.friendCover}>
                                {song ? (
                                    <SongCover size={140} song={song} />
                                ) : (
                                    <span className={styles.blank} />
                                )}
                                <span className={styles.friendFace}>
                                    <ProfileAvatar online={p.online} profile={p} size={34} />
                                </span>
                            </div>
                            <Text fw={700} size="sm" style={{ color: nameColor(p) }} truncate>
                                {p.name}
                            </Text>
                            <Text isMuted size="xs" truncate>
                                {activity(p)}
                            </Text>
                        </button>
                    );
                })}
            </div>
        </section>
    );
};

// ---------- activity ticker ----------
export const ActivityTicker = () => {
    const url = useHermesUrl();
    const feed = useQuery({
        enabled: !!url,
        queryFn: () => socialApi.activity(url),
        queryKey: ['sour-activity', url],
        refetchInterval: 60000,
    });
    const items = (feed.data ?? []).slice(0, 12);
    if (!items.length) return null;
    const line = items.map((a) => `${a.byName ?? 'Someone'} ${a.text}`).join('   ·   ');
    return (
        <div aria-label="What the group is doing" className={styles.ticker}>
            <div className={styles.tickerTrack}>
                <span>{line}</span>
                <span aria-hidden>{line}</span>
            </div>
        </div>
    );
};

// a cover on a shelf (with a hover preview when that's turned on)
const ShelfItem = ({
    note,
    onPlay,
    song,
}: {
    note: string;
    onPlay: () => void;
    song: GroupSong;
}) => {
    const preview = useHoverPreview(song);
    return (
        <button
            className={styles.shelfItem}
            onClick={onPlay}
            title={`${song.title} - ${song.artist} (${note})`}
            type="button"
            {...preview}
        >
            <SongCover size={110} song={song} />
            <Text size="xs" truncate>
                {song.title}
            </Text>
            <Text isMuted size="xs" truncate>
                {note}
            </Text>
        </button>
    );
};

// ---------- songs friends love that you haven't played ----------
export const UnheardByYou = () => {
    const me = useSourStore((s) => s.me);
    const history = useSourStore((s) => s.history);
    const profileData = useSourProfiles().data;
    const qc = useQueryClient();
    const serverId = useCurrentServer()?.id;
    const play = usePlaySong();
    const songs = useMemo(() => {
        const profiles = profileData ?? [];
        const heard = new Set(history.map((h) => h.song.id));
        const mine = profiles.find((p) => p.id === me?.id);
        for (const s of mine?.stats?.topSongs ?? []) heard.add(s.id);
        const pool = new Map<string, GroupSong & { from: string }>();
        for (const p of profiles) {
            if (p.id === me?.id) continue;
            for (const s of [
                ...(p.stats?.topSongs.slice(0, 10) ?? []),
                ...(p.favorites ?? []).filter((f) => !/^(album|artist):/.test(f.id)),
            ]) {
                if (!heard.has(s.id) && !pool.has(s.id)) pool.set(s.id, { ...s, from: p.name });
            }
        }
        return [...pool.values()].slice(0, 12);
    }, [history, me?.id, profileData]);
    if (!songs.length) return null;
    return (
        <section className={styles.section}>
            <div className={styles.labelRow}>
                <Text className={styles.label}>Unheard by you</Text>
                <Button
                    onClick={() =>
                        serverId &&
                        queueGroupSongs(
                            shuffled(songs),
                            Play.NOW,
                            { queryClient: qc, serverId },
                            'A friend loves this - you never played it',
                        ).catch(fail)
                    }
                    size="compact-xs"
                    variant="subtle"
                >
                    Play them all
                </Button>
            </div>
            <div className={styles.shelf}>
                {songs.map((s) => (
                    <ShelfItem
                        key={s.id}
                        note={`${s.from} loves it`}
                        onPlay={() => play(s)}
                        song={s}
                    />
                ))}
            </div>
        </section>
    );
};

// ---------- song roulette ----------
export const SongRoulette = () => {
    const qc = useQueryClient();
    const serverId = useCurrentServer()?.id;
    const [songs, setSongs] = useState<Song[]>([]);
    const [turn, setTurn] = useState(0);
    const [spinning, setSpinning] = useState(false);
    const load = async () => {
        if (!serverId) return [];
        const res = await qc.fetchQuery({
            ...songsQueries.random({ query: { limit: 8, played: Played.All }, serverId }),
            queryKey: ['sour-roulette', Date.now()],
        });
        setSongs(res.items);
        return res.items;
    };
    useEffect(() => {
        load().catch(() => {});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [serverId]);
    const spin = () => {
        if (spinning || !songs.length) return;
        const pick = Math.floor(Math.random() * songs.length);
        const slice = 360 / songs.length;
        setSpinning(true);
        // land the middle of the picked slice under the pointer at the top
        setTurn(
            (t) => t + 360 * 5 + ((((-(t % 360) - (pick * slice + slice / 2)) % 360) + 360) % 360),
        );
        window.setTimeout(() => {
            setSpinning(false);
            const song = songs[pick];
            setReason([song.id], 'Song roulette');
            addToQueueByData(Play.NOW, [song]).catch(() => {});
            toast.success({ message: `The wheel picked ${song.name}` });
        }, 3200);
    };
    const slice = songs.length ? 360 / songs.length : 360;
    return (
        <section className={styles.section}>
            <Text className={styles.label}>Song roulette</Text>
            <div className={styles.roulette}>
                <div className={styles.wheelWrap}>
                    <span className={styles.pointer} />
                    <div
                        className={styles.wheel}
                        style={{
                            background: `conic-gradient(${songs.map((_, i) => `hsl(${(i * 360) / Math.max(1, songs.length)} 70% 55%) ${i * slice}deg ${(i + 1) * slice}deg`).join(', ') || '#444 0deg 360deg'})`,
                            transform: `rotate(${turn}deg)`,
                        }}
                    >
                        {songs.map((s, i) => (
                            <span
                                className={styles.wheelLabel}
                                key={s.id}
                                style={{
                                    transform: `rotate(${i * slice + slice / 2}deg) translateY(-62px)`,
                                }}
                            >
                                {s.name.slice(0, 12)}
                            </span>
                        ))}
                    </div>
                </div>
                <div className={styles.rouletteSide}>
                    <Text isMuted size="sm">
                        Eight random songs from the library. Spin and whatever it lands on plays.
                    </Text>
                    <Button disabled={spinning || !songs.length} onClick={spin}>
                        {spinning ? 'Spinning...' : 'Spin'}
                    </Button>
                    <Button
                        disabled={spinning}
                        onClick={() => load().catch(() => {})}
                        size="xs"
                        variant="subtle"
                    >
                        New songs
                    </Button>
                </div>
            </div>
        </section>
    );
};

// ---------- genre blobs ----------
export const GenreBlobs = () => {
    const serverId = useCurrentServer()?.id;
    const playRandom = usePlayRandom();
    const genres = useQuery(
        genresQueries.list({
            options: { enabled: !!serverId },
            query: {
                limit: 40,
                sortBy: GenreListSort.SONG_COUNT,
                sortOrder: SortOrder.DESC,
                startIndex: 0,
            },
            serverId: serverId || '',
        }),
    );
    const list = (genres.data?.items ?? []).filter((g) => g.name).slice(0, 18);
    if (!list.length) return null;
    const max = Math.max(1, ...list.map((g) => g.songCount ?? 1));
    return (
        <section className={styles.section}>
            <Text className={styles.label}>Your library by genre</Text>
            <div className={styles.blobs}>
                {list.map((g) => {
                    const size = 60 + 80 * Math.sqrt((g.songCount ?? 1) / max);
                    return (
                        <button
                            className={styles.blob}
                            key={g.id}
                            onClick={() => playRandom({ genre: g.name }, `Shuffling ${g.name}`)}
                            style={{
                                background: `hsl(${[...g.name].reduce((a, c) => a + c.charCodeAt(0), 0) % 360} 55% 42%)`,
                                height: size,
                                width: size,
                            }}
                            title={`${g.songCount ?? 0} songs - click to shuffle`}
                            type="button"
                        >
                            {g.name}
                        </button>
                    );
                })}
            </div>
        </section>
    );
};

// ---------- decade dial ----------
export const DecadeDial = () => {
    const playRandom = usePlayRandom();
    const [decade, setDecade] = useState(1990);
    return (
        <section className={styles.section}>
            <Text className={styles.label}>Decade dial</Text>
            <div className={styles.dial}>
                <Text className={styles.decade}>{decade}s</Text>
                <Slider
                    label={(v) => `${v}s`}
                    marks={[1960, 1970, 1980, 1990, 2000, 2010, 2020].map((v) => ({
                        label: `'${String(v).slice(2)}`,
                        value: v,
                    }))}
                    max={2020}
                    min={1960}
                    onChange={setDecade}
                    step={10}
                    style={{ flex: 1 }}
                    value={decade}
                />
                <Button
                    onClick={() =>
                        playRandom({ maxYear: decade + 9, minYear: decade }, `The ${decade}s`)
                    }
                >
                    Play the {decade}s
                </Button>
            </div>
        </section>
    );
};

// ---------- what you played today, on a line ----------
export const PlayedTimeline = () => {
    const history = useSourStore((s) => s.history);
    const play = usePlaySong();
    const [now] = useState(() => Date.now());
    const today = history.filter((h) => now - h.at < 36 * 3600000).slice(0, 24);
    if (today.length < 2) return null;
    return (
        <section className={styles.section}>
            <Text className={styles.label}>Today so far</Text>
            <div className={styles.timeline}>
                {today.map((h, i) => (
                    <button
                        className={styles.timeItem}
                        key={`${h.song.id}-${h.at}-${i}`}
                        onClick={() => play(h.song)}
                        title={`${h.song.title} - ${h.song.artist}`}
                        type="button"
                    >
                        <SongCover size={58} song={h.song} />
                        <span className={styles.muted}>
                            {new Date(h.at).toLocaleTimeString(undefined, {
                                hour: 'numeric',
                                minute: '2-digit',
                            })}
                        </span>
                    </button>
                ))}
            </div>
        </section>
    );
};

export const HotSeatHome = () => (
    <section className={styles.section}>
        <HotSeatCard />
    </section>
);
