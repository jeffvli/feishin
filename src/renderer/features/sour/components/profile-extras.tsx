import { useQuery } from '@tanstack/react-query';
import { type ReactNode, useEffect, useState } from 'react';

import styles from './profile-extras.module.css';

import { type GroupSong } from '/@/renderer/features/group-play/store/group-play.store';
import { useHermesUrl } from '/@/renderer/features/hermes-video/store/hermes-video.store';
import { searchQueries } from '/@/renderer/features/search/api/search-api';
import { socialApi } from '/@/renderer/features/sour/api/social-api';
import { sourApi, type SourProfile, tasteMatch } from '/@/renderer/features/sour/api/sour-api';
import {
    activity,
    hue,
    ItemCover,
    nameColor,
    ProfileAvatar,
    SongCover,
    usePlaySong,
} from '/@/renderer/features/sour/components/profile-bits';
import { useSourProfiles, useSourStore } from '/@/renderer/features/sour/store/sour.store';
import { useIsMobile } from '/@/renderer/hooks/use-is-mobile';
import { useCurrentServer } from '/@/renderer/store';
import { HoverCard } from '/@/shared/components/hover-card/hover-card';
import { Text } from '/@/shared/components/text/text';

// ---------- the ring around a picture that fills as their song plays ----------
export const NowPlayingRing = ({ profile, size }: { profile: SourProfile; size: number }) => {
    const [now, setNow] = useState(() => Date.now());
    const song = profile.online ? profile.listening : null;
    useEffect(() => {
        if (!song || !profile.playing) return undefined;
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(timer);
    }, [profile.playing, song]);
    const seconds = (song?.duration ?? 0) / 1000;
    const position =
        profile.position + (profile.playing ? Math.max(0, now - profile.positionAt) / 1000 : 0);
    const progress = seconds ? Math.min(1, position / seconds) : 0;
    const ring = size + 10;
    const r = ring / 2 - 3;
    const length = 2 * Math.PI * r;
    const mood = moodColor(profile);
    return (
        <span className={styles.ringWrap} style={{ height: ring, width: ring }}>
            <svg className={styles.ring} height={ring} viewBox={`0 0 ${ring} ${ring}`} width={ring}>
                <circle
                    cx={ring / 2}
                    cy={ring / 2}
                    fill="none"
                    r={r}
                    stroke={mood ?? 'rgb(127 127 127 / 25%)'}
                    strokeOpacity={mood ? 0.45 : 1}
                    strokeWidth={3}
                />
                {song && (
                    <circle
                        cx={ring / 2}
                        cy={ring / 2}
                        fill="none"
                        r={r}
                        stroke="var(--theme-colors-primary)"
                        strokeDasharray={length}
                        strokeDashoffset={length * (1 - progress)}
                        strokeLinecap="round"
                        strokeWidth={3}
                        transform={`rotate(-90 ${ring / 2} ${ring / 2})`}
                    />
                )}
            </svg>
            <ProfileAvatar online={profile.online} profile={profile} size={size} />
        </span>
    );
};

// mood ring: a colour from what they've been listening to lately (their top artist this week)
export const moodColor = (p: Pick<SourProfile, 'custom' | 'stats'>) => {
    if (p.custom?.moodRing === false) return null;
    const top = p.stats?.topArtists?.[0]?.name;
    return top ? `hsl(${hue(top)} 75% 55%)` : null;
};

// ---------- hover card: a mini profile when you hover a name ----------
export const ProfileHover = ({
    children,
    profile,
}: {
    children: ReactNode;
    profile: SourProfile;
}) => {
    const me = useSourStore((s) => s.me);
    const phone = useIsMobile();
    const profiles = useSourProfiles().data ?? [];
    const mine = profiles.find((p) => p.id === me?.id);
    const match = profile.id !== me?.id ? tasteMatch(mine?.stats, profile.stats) : null;
    const top = profile.stats?.topSongs.slice(0, 3) ?? [];
    return (
        <HoverCard
            closeDelay={80}
            // phones have no hover: a tap opens the profile instead
            disabled={phone}
            openDelay={350}
            position="right"
            shadow="md"
            width={250}
            withinPortal
        >
            <HoverCard.Target>
                <span className={styles.hoverTarget}>{children}</span>
            </HoverCard.Target>
            <HoverCard.Dropdown p={0}>
                <div className={styles.card}>
                    <div
                        className={styles.cardBanner}
                        style={{ background: profile.color || `hsl(${hue(profile.name)} 50% 35%)` }}
                    />
                    <div className={styles.cardBody}>
                        <div className={styles.cardAvatar}>
                            <NowPlayingRing profile={profile} size={44} />
                        </div>
                        <Text fw={700} size="sm" style={{ color: nameColor(profile) }}>
                            {profile.name}
                        </Text>
                        {profile.status && (
                            <Text isMuted size="xs">
                                &ldquo;{profile.status}&rdquo;
                            </Text>
                        )}
                        <Text isMuted size="xs">
                            {activity(profile)}
                        </Text>
                        {top.length > 0 && (
                            <div className={styles.covers}>
                                {top.map((s) => (
                                    <SongCover key={s.id} size={32} song={s} />
                                ))}
                            </div>
                        )}
                        {match && (
                            <Text c="var(--theme-colors-primary)" size="xs">
                                {match.percent}% taste match
                            </Text>
                        )}
                    </div>
                </div>
            </HoverCard.Dropdown>
        </HoverCard>
    );
};

// ---------- sections (each shows its own title, only when it has something to show) ----------
const Titled = ({ children, title }: { children: ReactNode; title: string }) => (
    <div className={styles.section}>
        <Text fw={700}>{title}</Text>
        {children}
    </div>
);
export const DuoSection = ({ other }: { other: SourProfile }) => {
    const url = useHermesUrl();
    const me = useSourStore((s) => s.me);
    const play = usePlaySong();
    const duo = useQuery({
        enabled: !!url && !!me && me.id !== other.id,
        queryFn: () => socialApi.duo(url, me?.id ?? '', other.id),
        queryKey: ['sour-duo', url, me?.id, other.id],
        retry: false,
    });
    if (!duo.data) return null;
    const d = duo.data;
    return (
        <Titled title="You two">
            <div className={styles.duo}>
                <div className={styles.duoStats}>
                    <div>
                        <b>{d.togetherHours} h</b>
                        <span>together in groups</span>
                    </div>
                    <div>
                        <b>{d.streak}</b>
                        <span>day streak (both listening)</span>
                    </div>
                    <div>
                        <b>{d.shared.length}</b>
                        <span>shared top songs</span>
                    </div>
                </div>
                {d.shared.slice(0, 4).map((s) => (
                    <button
                        className={styles.songRow}
                        key={s.id}
                        onClick={() => play(s)}
                        type="button"
                    >
                        <SongCover size={32} song={s} />
                        <span className={styles.grow}>
                            <Text size="sm" truncate>
                                {s.title}
                            </Text>
                            <Text isMuted size="xs" truncate>
                                {s.artist}
                            </Text>
                        </span>
                    </button>
                ))}
            </div>
        </Titled>
    );
};

export const HeatmapSection = ({ profile }: { profile: SourProfile }) => {
    const url = useHermesUrl();
    const heat = useQuery({
        enabled: !!url,
        queryFn: () => socialApi.heatmap(url, profile.id),
        queryKey: ['sour-heatmap', url, profile.id],
        retry: false,
        staleTime: 5 * 60000,
    });
    if (!heat.data) return null;
    const days: Array<{ day: string; minutes: number }> = [];
    const end = new Date(heat.dataUpdatedAt || 0);
    for (let i = 7 * 26 - 1; i >= 0; i--) {
        const d = new Date(end.getTime() - i * 86400000).toISOString().slice(0, 10);
        days.push({ day: d, minutes: heat.data[d] ?? 0 });
    }
    const total = Math.round(days.reduce((s, d) => s + d.minutes, 0) / 60);
    const level = (m: number) => (m <= 0 ? 0 : m < 20 ? 1 : m < 60 ? 2 : m < 150 ? 3 : 4);
    return (
        <Titled title="Listening">
            <div className={styles.heat}>
                {days.map((d) => (
                    <i
                        className={styles[`heat${level(d.minutes)}`]}
                        key={d.day}
                        title={`${d.day}: ${d.minutes} min`}
                    />
                ))}
            </div>
            <Text isMuted size="xs">
                {total} hours in the last six months
            </Text>
        </Titled>
    );
};

// ---------- what they had Hermes Music add to the library ----------
export const AddedSection = ({ profile }: { profile: SourProfile }) => {
    const url = useHermesUrl();
    const added = useQuery({
        enabled: !!url,
        queryFn: () => sourApi.added(url, profile.id),
        queryKey: ['sour-added', url, profile.id],
        retry: false,
        staleTime: 5 * 60000,
    });
    if (!added.data?.total) return null;
    const { items, month, total } = added.data;
    return (
        <Titled title="Added to the library">
            <Text isMuted size="xs">
                {total} {total === 1 ? 'request' : 'requests'} added
                {month ? `, ${month} this month` : ''}
            </Text>
            <div className={styles.added}>
                {items.map((item, i) => (
                    <Text key={`${item.title}-${i}`} size="sm" truncate>
                        <b>{item.title}</b>
                        {item.artist && item.type === 'song' ? ` - ${item.artist}` : ''}
                        {item.type !== 'song' && (
                            <span className={styles.kind}> ({item.type})</span>
                        )}
                    </Text>
                ))}
            </div>
        </Titled>
    );
};

const monthName = (m: string) =>
    new Date(`${m}-15T12:00:00Z`).toLocaleString(undefined, { month: 'short' });

export const EraSection = ({ profile }: { profile: SourProfile }) => {
    const url = useHermesUrl();
    const play = usePlaySong();
    const era = useQuery({
        enabled: !!url,
        queryFn: () => socialApi.era(url, profile.id),
        queryKey: ['sour-era', url, profile.id],
        retry: false,
        staleTime: 5 * 60000,
    });
    const months = (era.data ?? []).filter((m) => m.songs.length).slice(0, 12);
    if (!months.length) return null;
    return (
        <Titled title="Their eras (top song each month)">
            <div className={styles.era}>
                {months.map((m) => (
                    <button
                        className={styles.eraMonth}
                        key={m.month}
                        onClick={() => play(m.songs[0])}
                        title={`${m.songs[0].title} - ${m.songs[0].plays} plays`}
                        type="button"
                    >
                        <SongCover size={58} song={m.songs[0]} />
                        <span>{monthName(m.month)}</span>
                    </button>
                ))}
            </div>
        </Titled>
    );
};

// top artists as a collage of artist pictures from the music server
const ArtistTile = ({ name }: { name: string }) => {
    const server = useCurrentServer();
    const found = useQuery(
        searchQueries.search({
            options: { enabled: !!server?.id, staleTime: 30 * 60000 },
            query: { albumArtistLimit: 1, albumLimit: 0, query: name, songLimit: 0 },
            serverId: server?.id || '',
        }),
    );
    const artist = found.data?.albumArtists?.[0];
    const entry: GroupSong = {
        album: '',
        artist: name,
        duration: 0,
        id: `artist:${artist?.id ?? name}`,
        imageId: artist?.imageId ?? null,
        title: name,
    };
    return (
        <div className={styles.collageTile} title={name}>
            <ItemCover entry={entry} round />
            <Text size="xs" ta="center" truncate>
                {name}
            </Text>
        </div>
    );
};

export const ArtistCollage = ({ profile }: { profile: SourProfile }) => {
    const top = profile.stats?.topArtists.slice(0, 6) ?? [];
    if (!top.length) return null;
    return (
        <Titled title="Top artists">
            <div className={styles.collage}>
                {top.map((a) => (
                    <ArtistTile key={a.name} name={a.name} />
                ))}
            </div>
        </Titled>
    );
};

// remember who looked (only shown to people who turned it on)
export const useProfileVisit = (profile: SourProfile, enabled: boolean) => {
    const url = useHermesUrl();
    const me = useSourStore((s) => s.me);
    useEffect(() => {
        if (!enabled || !url || !me || me.id === profile.id) return;
        socialApi.visit(url, me, profile.id).catch(() => {});
    }, [enabled, me, profile.id, url]);
};
