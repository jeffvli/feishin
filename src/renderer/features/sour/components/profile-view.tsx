import { closeAllModals } from '@mantine/modals';
import { useQueryClient } from '@tanstack/react-query';
import { type CSSProperties, type ReactNode, useState } from 'react';
import { generatePath, useNavigate } from 'react-router';

import styles from './people.module.css';

import { toGroupSong } from '/@/renderer/features/group-play/api/group-play-api';
import { type GroupSong } from '/@/renderer/features/group-play/store/group-play.store';
import { useHermesUrl } from '/@/renderer/features/hermes-video/store/hermes-video.store';
import {
    backgroundUrl,
    bannerUrl,
    favoriteId,
    favoriteKind,
    sourApi,
    type SourProfile,
    tasteMatch,
    timeAgo,
} from '/@/renderer/features/sour/api/sour-api';
import {
    activity,
    hue,
    ItemCover,
    ProfileAvatar,
    ProfileName,
    SongCover,
    usePlaySong,
} from '/@/renderer/features/sour/components/profile-bits';
import { useSourProfiles, useSourStore } from '/@/renderer/features/sour/store/sour.store';
import { AppRoute } from '/@/renderer/router/routes';
import { usePlayerSong } from '/@/renderer/store';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Button } from '/@/shared/components/button/button';
import { Group } from '/@/shared/components/group/group';
import { Stack } from '/@/shared/components/stack/stack';
import { TextInput } from '/@/shared/components/text-input/text-input';
import { Text } from '/@/shared/components/text/text';
import { toast } from '/@/shared/components/toast/toast';

export const SECTIONS: Array<[string, string]> = [
    ['now', 'Listening now'],
    ['signature', 'Signature song'],
    ['taste', 'Taste match'],
    ['spotlight', 'Song of the week'],
    ['top5', 'Top 5'],
    ['favoriteAlbums', 'Favourite albums'],
    ['favoriteArtists', 'Favourite artists'],
    ['favoriteSongs', 'Favourite songs'],
    ['genres', 'Favourite genres'],
    ['pinnedPlaylist', 'Pinned playlist'],
    ['recent', 'Recently played'],
    ['stats', 'Stats'],
    ['jokes', 'Inside jokes'],
    ['wall', 'Wall'],
];

const Section = ({ children, title }: { children: ReactNode; title: string }) => (
    <Stack gap={6}>
        <Text fw={700}>{title}</Text>
        {children}
    </Stack>
);

// One person's profile: banner, picture, name, what they're doing, and the sections they chose, in
// their order and colours. `preview` shows it without buttons (for the editor's live preview).
export const ProfileView = ({
    onBack,
    onEdit,
    preview,
    profile,
}: {
    onBack?: () => void;
    onEdit?: () => void;
    preview?: boolean;
    profile: SourProfile;
}) => {
    const url = useHermesUrl();
    const me = useSourStore((state) => state.me);
    const setStore = useSourStore((state) => state.set);
    const pins = useSourStore((state) => state.pins);
    const profiles = useSourProfiles().data ?? [];
    const queryClient = useQueryClient();
    const playSong = usePlaySong();
    const navigate = useNavigate();
    const current = usePlayerSong();
    const [note, setNote] = useState('');
    const [nick, setNick] = useState('');
    const isMe = me?.id === profile.id;
    const c = profile.custom || {};
    const accent = c.theme?.accent || profile.color || `hsl(${hue(profile.name)} 55% 45%)`;
    const mine = profiles.find((p) => p.id === me?.id);
    const match = isMe ? null : tasteMatch(mine?.stats, profile.stats);
    const refresh = () => queryClient.invalidateQueries({ queryKey: ['sour-profiles', url] });

    const banner = bannerUrl(url, profile);
    const pos = c.bannerPos || { x: 50, y: 50, zoom: 100 };
    const bannerStyle: CSSProperties = banner
        ? {
              backgroundImage: `url("${banner}")`,
              backgroundPosition: `${pos.x}% ${pos.y}%`,
              backgroundSize: `${pos.zoom}%`,
          }
        : {
              backgroundImage: `linear-gradient(135deg, ${(c.gradient?.length ? c.gradient : [accent, 'rgb(20 20 30)']).join(', ')})`,
          };
    const background = backgroundUrl(url, profile);

    const act = (work: () => Promise<unknown>, done?: string) =>
        work()
            .then(() => {
                if (done) toast.success({ message: done });
                return refresh();
            })
            .catch((error: Error) => toast.error({ message: error.message }));

    const openItem = (entry: GroupSong) => {
        const id = favoriteId(entry);
        closeAllModals();
        if (favoriteKind(entry) === 'album') {
            navigate(generatePath(AppRoute.LIBRARY_ALBUMS_DETAIL, { albumId: id }));
        } else {
            navigate(generatePath(AppRoute.LIBRARY_ALBUM_ARTISTS_DETAIL, { albumArtistId: id }));
        }
    };

    const songRow = (song: GroupSong, extra?: ReactNode) => (
        <div className={styles.favorite} key={song.id}>
            <button className={styles.favoriteSong} onClick={() => playSong(song)} type="button">
                <SongCover size={40} song={song} />
                <Stack gap={0} miw={0}>
                    <Text fw={600} size="sm" truncate>
                        {song.title}
                    </Text>
                    <Text isMuted size="xs" truncate>
                        {song.artist}
                    </Text>
                </Stack>
            </button>
            {extra}
        </div>
    );

    const tiles = (entries: GroupSong[], round?: boolean) => (
        <div className={styles.tiles}>
            {entries.map((entry) => (
                <button
                    className={styles.tileButton}
                    key={entry.id}
                    onClick={() => openItem(entry)}
                    type="button"
                >
                    <ItemCover entry={entry} round={round} />
                    <Text fw={600} size="sm" ta={round ? 'center' : undefined} truncate>
                        {entry.title}
                    </Text>
                    {!round && (
                        <Text isMuted size="xs" truncate>
                            {entry.artist}
                        </Text>
                    )}
                </button>
            ))}
        </div>
    );

    const favorites = profile.favorites || [];
    const sections: Record<string, ReactNode> = {
        favoriteAlbums: favorites.some((f) => favoriteKind(f) === 'album') && (
            <Section title="Favourite albums">
                {tiles(favorites.filter((f) => favoriteKind(f) === 'album'))}
            </Section>
        ),
        favoriteArtists: favorites.some((f) => favoriteKind(f) === 'artist') && (
            <Section title="Favourite artists">
                {tiles(
                    favorites.filter((f) => favoriteKind(f) === 'artist'),
                    true,
                )}
            </Section>
        ),
        favoriteSongs: favorites.some((f) => favoriteKind(f) === 'song') && (
            <Section title="Favourite songs">
                {favorites.filter((f) => favoriteKind(f) === 'song').map((s) => songRow(s))}
            </Section>
        ),
        genres: !!c.genres?.length && (
            <Section title="Favourite genres">
                <Group gap={6}>
                    {c.genres.map((g) => (
                        <span className={styles.chip} key={g} style={{ borderColor: accent }}>
                            {g}
                        </span>
                    ))}
                </Group>
            </Section>
        ),
        jokes: !!c.jokes && (
            <Section title="Inside jokes">
                <Text className={styles.bio}>{c.jokes}</Text>
            </Section>
        ),
        now: profile.online && profile.listening && (
            <button
                className={styles.nowCard}
                onClick={() => profile.listening && playSong(profile.listening)}
                style={{ borderColor: accent }}
                type="button"
            >
                <SongCover size={56} song={profile.listening} />
                <Stack gap={0} miw={0}>
                    <Text className={styles.eyebrow}>
                        {profile.group ? `Listening in ${profile.group.name}` : 'Listening now'}
                    </Text>
                    <Text fw={700} truncate>
                        {profile.listening.title}
                    </Text>
                    <Text isMuted size="sm" truncate>
                        {profile.listening.artist}
                    </Text>
                </Stack>
            </button>
        ),
        pinnedPlaylist: c.pinnedPlaylist && (
            <Section title="Pinned playlist">
                <Button
                    onClick={() => {
                        closeAllModals();
                        navigate(
                            generatePath(AppRoute.PLAYLISTS_DETAIL_SONGS, {
                                playlistId: c.pinnedPlaylist?.id || '',
                            }),
                        );
                    }}
                    variant="default"
                >
                    {c.pinnedPlaylist.name}
                </Button>
            </Section>
        ),
        recent: !!c.recentPlays?.length && (
            <Section title="Recently played">
                {c.recentPlays.slice(0, 6).map((s) => songRow(s))}
            </Section>
        ),
        signature: c.signatureSong && (
            <Section title="Signature song">{songRow(c.signatureSong)}</Section>
        ),
        spotlight: c.spotlight && (
            <Section title={`Song of the week (${c.spotlight.week})`}>
                {songRow(c.spotlight.song)}
                {!!c.spotlightHistory?.length && (
                    <Text isMuted size="xs">
                        Before:{' '}
                        {c.spotlightHistory
                            .slice(0, 6)
                            .map((s) => s.song.title)
                            .join(', ')}
                    </Text>
                )}
            </Section>
        ),
        stats: profile.stats && (
            <Section title="Stats">
                <Group gap="lg">
                    <Stack gap={0}>
                        <Text fw={800} size="xl">
                            {profile.stats.hoursWeek} h
                        </Text>
                        <Text isMuted size="xs">
                            this week
                        </Text>
                    </Stack>
                    <Stack gap={0}>
                        <Text fw={800} size="xl">
                            {profile.stats.hoursTotal} h
                        </Text>
                        <Text isMuted size="xs">
                            in total
                        </Text>
                    </Stack>
                </Group>
                {!!profile.stats.topArtists.length && (
                    <Text isMuted size="sm">
                        Top artists:{' '}
                        {profile.stats.topArtists
                            .slice(0, 5)
                            .map((a) => a.name)
                            .join(', ')}
                    </Text>
                )}
                {profile.stats.topSongs.slice(0, 3).map((s) => songRow(s))}
            </Section>
        ),
        taste: match && (
            <Section title={`You and ${profile.name}`}>
                <Group gap="md" wrap="nowrap">
                    <Text fw={800} size="xl">
                        {match.percent}% match
                    </Text>
                    <div className={styles.matchBar}>
                        <div style={{ background: accent, width: `${match.percent}%` }} />
                    </div>
                </Group>
                {!!match.shared.length && (
                    <Group gap={6}>
                        {match.shared.map((name) => (
                            <span className={styles.chip} key={name}>
                                {name}
                            </span>
                        ))}
                    </Group>
                )}
            </Section>
        ),
        top5: !!c.top5?.length && (
            <Section title="Top 5">
                <div className={styles.top5}>
                    {c.top5.slice(0, 5).map((song, i) => (
                        <button
                            className={styles.tileButton}
                            key={song.id}
                            onClick={() => playSong(song)}
                            type="button"
                        >
                            <span className={styles.rank}>{i + 1}</span>
                            <SongCover size={72} song={song} />
                            <Text fw={600} size="xs" truncate>
                                {song.title}
                            </Text>
                        </button>
                    ))}
                </div>
            </Section>
        ),
        wall: (
            <Section title="Wall">
                {!preview && me && (
                    <Group gap="xs" wrap="nowrap">
                        <TextInput
                            flex={1}
                            onChange={(e) => setNote(e.currentTarget.value)}
                            placeholder={
                                isMe ? 'Write on your wall' : `Write on ${profile.name}'s wall`
                            }
                            value={note}
                        />
                        <Button
                            disabled={!note.trim()}
                            onClick={() =>
                                act(() => sourApi.wall(url, me, profile.id, { text: note })).then(
                                    () => setNote(''),
                                )
                            }
                            variant="filled"
                        >
                            Post
                        </Button>
                    </Group>
                )}
                {(profile.wall || []).map((n) => (
                    <div className={styles.note} key={n.id}>
                        <Group justify="space-between" wrap="nowrap">
                            <Text size="sm">
                                <b>{n.fromName}</b> {n.song ? 'dedicated a song' : ''}{' '}
                                <span className={styles.muted}>{timeAgo(n.at)}</span>
                            </Text>
                            {!preview && me && (isMe || n.from === me.id) && (
                                <ActionIcon
                                    icon="x"
                                    onClick={() =>
                                        act(() =>
                                            sourApi.wall(url, me, profile.id, { remove: n.id }),
                                        )
                                    }
                                    size="xs"
                                    tooltip={{ label: 'Delete' }}
                                    variant="subtle"
                                />
                            )}
                        </Group>
                        {n.text && <Text size="sm">{n.text}</Text>}
                        {n.song && songRow(n.song)}
                    </div>
                ))}
                {!profile.wall?.length && (
                    <Text isMuted size="sm">
                        Nothing on the wall yet.
                    </Text>
                )}
            </Section>
        ),
    };

    const order = c.sections?.order?.length ? c.sections.order : SECTIONS.map(([id]) => id);
    const hidden = new Set(c.sections?.hidden || []);
    const ordered = [...order, ...SECTIONS.map(([id]) => id).filter((id) => !order.includes(id))];

    const pinned = pins.some((p) => p.kind === 'profile' && p.id === profile.id);

    return (
        <div
            className={styles.profilePage}
            style={{
                background: c.theme?.background || undefined,
                backgroundImage: background
                    ? `linear-gradient(rgb(0 0 0 / 55%), rgb(0 0 0 / 75%)), url("${background}")`
                    : undefined,
            }}
        >
            <Stack gap="md">
                {onBack && (
                    <Button onClick={onBack} size="compact-xs" variant="subtle" w="fit-content">
                        Back to people
                    </Button>
                )}
                <div className={styles.profile} style={{ background: c.theme?.card || undefined }}>
                    <div className={styles.banner} style={bannerStyle}>
                        {c.header && <span className={styles.header}>{c.header}</span>}
                        {(c.stickers || []).map((s, i) => (
                            <span
                                className={styles.sticker}
                                key={`${s.emoji}-${i}`}
                                style={{ left: `${s.x}%`, top: `${s.y}%` }}
                            >
                                {s.emoji}
                            </span>
                        ))}
                    </div>
                    <div className={styles.profileHead}>
                        <span className={styles.bigAvatar} style={{ borderColor: accent }}>
                            <ProfileAvatar online={profile.online} profile={profile} size={92} />
                        </span>
                        <Stack gap={2} miw={0}>
                            <ProfileName profile={profile} />
                            <Text isMuted size="sm">
                                {profile.status ? `${profile.status} - ` : ''}
                                {activity(profile)}
                            </Text>
                            {!profile.online && profile.away && (
                                <Text size="sm">Away: {profile.away}</Text>
                            )}
                        </Stack>
                        {!preview && isMe && onEdit && (
                            <Button ml="auto" onClick={onEdit} size="xs" variant="filled">
                                Edit profile
                            </Button>
                        )}
                    </div>
                    {!preview && !isMe && me && (
                        <Group gap="xs" pb="md" px="md">
                            {profile.online && profile.listening && (
                                <Button
                                    onClick={() => {
                                        setStore({ listenAlong: profile.id });
                                        toast.info({
                                            message: `Listening along with ${profile.name}`,
                                        });
                                    }}
                                    size="xs"
                                    variant="filled"
                                >
                                    Listen along
                                </Button>
                            )}
                            <Button
                                onClick={() =>
                                    act(
                                        () => sourApi.ping(url, me, profile.id),
                                        `Pinged ${profile.name}`,
                                    )
                                }
                                size="xs"
                                variant="default"
                            >
                                Wake up ping
                            </Button>
                            {current && (
                                <Button
                                    onClick={() =>
                                        act(
                                            () =>
                                                sourApi.wall(url, me, profile.id, {
                                                    song: toGroupSong(current),
                                                    text: '',
                                                }),
                                            `Dedicated ${current.name} to ${profile.name}`,
                                        )
                                    }
                                    size="xs"
                                    variant="default"
                                >
                                    Dedicate this song
                                </Button>
                            )}
                            <Button
                                onClick={() =>
                                    setStore({
                                        pins: pinned
                                            ? pins.filter(
                                                  (p) =>
                                                      !(
                                                          p.kind === 'profile' &&
                                                          p.id === profile.id
                                                      ),
                                              )
                                            : [
                                                  ...pins,
                                                  {
                                                      id: profile.id,
                                                      imageId: null,
                                                      kind: 'profile',
                                                      name: profile.name,
                                                  },
                                              ],
                                    })
                                }
                                size="xs"
                                variant="default"
                            >
                                {pinned ? 'Unpin' : 'Pin to sidebar'}
                            </Button>
                            <Group gap={4} wrap="nowrap">
                                <TextInput
                                    onChange={(e) => setNick(e.currentTarget.value)}
                                    placeholder="Suggest a nickname"
                                    size="xs"
                                    value={nick}
                                />
                                <Button
                                    disabled={!nick.trim()}
                                    onClick={() =>
                                        act(
                                            () => sourApi.nickname(url, me, profile.id, nick),
                                            'Nickname suggested',
                                        ).then(() => setNick(''))
                                    }
                                    size="xs"
                                    variant="default"
                                >
                                    Suggest
                                </Button>
                            </Group>
                        </Group>
                    )}
                </div>
                {profile.bio && <Text className={styles.bio}>{profile.bio}</Text>}
                {ordered
                    .filter((id) => !hidden.has(id) && sections[id])
                    .map((id) => (
                        <div key={id}>{sections[id]}</div>
                    ))}
            </Stack>
        </div>
    );
};
