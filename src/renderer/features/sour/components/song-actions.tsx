import { openModal } from '@mantine/modals';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

import { groupApi, toGroupSong } from '/@/renderer/features/group-play/api/group-play-api';
import {
    type GroupSong,
    useGroupPlayStore,
} from '/@/renderer/features/group-play/store/group-play.store';
import { useHermesUrl } from '/@/renderer/features/hermes-video/store/hermes-video.store';
import { songsQueries } from '/@/renderer/features/songs/api/songs-api';
import { favoriteKind, sourApi } from '/@/renderer/features/sour/api/sour-api';
import { ProfileAvatar } from '/@/renderer/features/sour/components/profile-bits';
import { useSourProfiles, useSourStore } from '/@/renderer/features/sour/store/sour.store';
import { useCurrentServer } from '/@/renderer/store';
import { Button } from '/@/shared/components/button/button';
import { ContextMenu } from '/@/shared/components/context-menu/context-menu';
import { Group } from '/@/shared/components/group/group';
import { Stack } from '/@/shared/components/stack/stack';
import { TextInput } from '/@/shared/components/text-input/text-input';
import { Text } from '/@/shared/components/text/text';
import { Textarea } from '/@/shared/components/textarea/textarea';
import { toast } from '/@/shared/components/toast/toast';
import {
    type Album,
    type AlbumArtist,
    type Artist,
    type Playlist,
    type Song,
} from '/@/shared/types/domain-types';

// Adds songs, albums or artists to the favourites on your profile (skipping ones already there).
const AddFavoritesItem = ({ entries }: { entries: GroupSong[] }) => {
    const url = useHermesUrl();
    const me = useSourStore((state) => state.me);
    const queryClient = useQueryClient();

    const onSelect = useCallback(async () => {
        if (!url || !me) return;
        try {
            const profile = await sourApi.profile(url, me.id);
            const have = new Set(profile.favorites.map((f) => f.id));
            const added = entries.filter((entry) => !have.has(entry.id));
            await sourApi.update(url, me, { favorites: [...profile.favorites, ...added] });
            queryClient.invalidateQueries({ queryKey: ['sour-profiles', url] });
            toast.success({
                message: added.length ? 'Added to your profile' : 'Already on your profile',
            });
        } catch (error) {
            toast.error({ message: (error as Error).message });
        }
    }, [entries, me, queryClient, url]);

    if (!url || !me || !entries.length) return null;

    return (
        <ContextMenu.Item leftIcon="favorite" onSelect={onSelect}>
            Add to my profile
        </ContextMenu.Item>
    );
};

// Song right-click menu
export const AddToProfileAction = ({ songs }: { songs: Song[] }) => (
    <AddFavoritesItem entries={songs.map(toGroupSong)} />
);

// Album right-click menu
export const AddAlbumToProfileAction = ({ albums }: { albums: Album[] }) => (
    <AddFavoritesItem
        entries={albums.map((a) => ({
            album: a.name,
            artist: a.albumArtistName,
            duration: 0,
            id: `album:${a.id}`,
            imageId: a.imageId,
            title: a.name,
        }))}
    />
);

// Artist right-click menu
export const AddArtistToProfileAction = ({ artists }: { artists: (AlbumArtist | Artist)[] }) => (
    <AddFavoritesItem
        entries={artists.map((a) => ({
            album: '',
            artist: a.name,
            duration: 0,
            id: `artist:${a.id}`,
            imageId: a.imageId,
            title: a.name,
        }))}
    />
);

// Song right-click menu: never let Auto DJ add this song's artist for you.
export const BlockArtistAction = ({ songs }: { songs: Song[] }) => {
    const block = useSourStore((state) => state.block);
    const song = songs[0];

    const onSelect = useCallback(() => {
        if (!song) return;
        const artist = song.artists?.[0];
        const name = artist?.name || song.artistName;
        if (!name) return;
        block({ id: artist?.id || null, name });
        toast.info({ message: `Auto DJ won't play ${name} for you` });
    }, [block, song]);

    if (songs.length !== 1 || !song?.artistName) return null;

    return (
        <ContextMenu.Item leftIcon="x" onSelect={onSelect}>
            Block artist from Auto DJ
        </ContextMenu.Item>
    );
};

// Song right-click menu: keep this song out of "listening to" and your recent plays.
export const HideFromActivityAction = ({ songs }: { songs: Song[] }) => {
    const url = useHermesUrl();
    const me = useSourStore((state) => state.me);
    const onSelect = useCallback(async () => {
        if (!url || !me) return;
        try {
            const profile = await sourApi.me(url, me);
            const hidden = new Set([...(profile.custom?.hiddenSongs ?? []), ...songs.map((s) => s.id)]);
            await sourApi.update(url, me, { custom: { ...profile.custom, hiddenSongs: [...hidden] } });
            toast.info({ message: 'Hidden from your activity' });
        } catch (error) {
            toast.error({ message: (error as Error).message });
        }
    }, [me, songs, url]);
    if (!url || !me) return null;
    return (
        <ContextMenu.Item leftIcon="visibilityOff" onSelect={onSelect}>
            Hide from my activity
        </ContextMenu.Item>
    );
};

// a private note on a song (only on this computer)
const SongNote = ({ song }: { song: Song }) => {
    const notes = useSourStore((state) => state.notes);
    const set = useSourStore((state) => state.set);
    const [text, setText] = useState(notes[song.id] ?? '');
    return (
        <Stack gap="sm">
            <Text isMuted size="sm">
                Only you see this note.
            </Text>
            <Textarea autosize minRows={3} onChange={(e) => setText(e.currentTarget.value)} value={text} />
            <Group justify="flex-end">
                <Button
                    onClick={() => {
                        const next = { ...notes };
                        if (text.trim()) next[song.id] = text.trim();
                        else delete next[song.id];
                        set({ notes: next });
                        toast.success({ message: 'Note saved' });
                    }}
                    variant="filled"
                >
                    Save note
                </Button>
            </Group>
        </Stack>
    );
};
export const SongNoteAction = ({ songs }: { songs: Song[] }) => {
    const song = songs[0];
    const has = useSourStore((state) => (song ? !!state.notes[song.id] : false));
    if (songs.length !== 1 || !song) return null;
    return (
        <ContextMenu.Item
            leftIcon="edit"
            onSelect={() => openModal({ children: <SongNote song={song} />, title: `Note: ${song.name}` })}
        >
            {has ? 'Edit my note' : 'Add a note'}
        </ContextMenu.Item>
    );
};

// which friends have this song in their favourites or top songs
const WhoElseLikes = ({ song }: { song: Song }) => {
    const profiles = useSourProfiles().data ?? [];
    const fans = profiles.filter(
        (p) =>
            p.favorites.some((f) => favoriteKind(f) === 'song' && f.id === song.id) ||
            p.stats?.topSongs.some((s) => s.id === song.id) ||
            p.custom?.top5?.some((s) => s.id === song.id),
    );
    if (!fans.length) return <Text isMuted>Nobody has this one in their favourites or top songs yet.</Text>;
    return (
        <Stack gap="xs">
            {fans.map((p) => (
                <Group gap="sm" key={p.id}>
                    <ProfileAvatar profile={p} size={28} />
                    <Text>{p.name}</Text>
                    <Text isMuted size="xs">
                        {p.favorites.some((f) => f.id === song.id)
                            ? 'favourite'
                            : p.custom?.top5?.some((s) => s.id === song.id)
                              ? 'in their top 5'
                              : 'plays it a lot'}
                    </Text>
                </Group>
            ))}
        </Stack>
    );
};
export const WhoElseLikesAction = ({ songs }: { songs: Song[] }) => {
    const url = useHermesUrl();
    const song = songs[0];
    if (!url || songs.length !== 1 || !song) return null;
    return (
        <ContextMenu.Item
            leftIcon="user"
            onSelect={() => openModal({ children: <WhoElseLikes song={song} />, title: 'Who else likes this' })}
        >
            Who else likes this
        </ContextMenu.Item>
    );
};

// send a song to a friend: it shows up for them with a Play button (and on their wall)
const ShareSong = ({ song }: { song: Song }) => {
    const url = useHermesUrl();
    const me = useSourStore((state) => state.me);
    const profiles = (useSourProfiles().data ?? []).filter((p) => p.id !== me?.id);
    const [text, setText] = useState('');
    return (
        <Stack gap="sm">
            <TextInput
                onChange={(e) => setText(e.currentTarget.value)}
                placeholder="Add a message (optional)"
                value={text}
            />
            {profiles.map((p) => (
                <Group gap="sm" justify="space-between" key={p.id}>
                    <Group gap="sm">
                        <ProfileAvatar online={p.online} profile={p} size={28} />
                        <Text>{p.name}</Text>
                    </Group>
                    <Button
                        onClick={() =>
                            me &&
                            sourApi
                                .wall(url, me, p.id, { song: toGroupSong(song), text })
                                .then(() => toast.success({ message: `Sent to ${p.name}` }))
                                .catch((error: Error) => toast.error({ message: error.message }))
                        }
                        size="xs"
                        variant="default"
                    >
                        Send
                    </Button>
                </Group>
            ))}
        </Stack>
    );
};
export const ShareSongAction = ({ songs }: { songs: Song[] }) => {
    const url = useHermesUrl();
    const me = useSourStore((state) => state.me);
    const song = songs[0];
    if (!url || !me || songs.length !== 1 || !song) return null;
    return (
        <ContextMenu.Item
            leftIcon="share"
            onSelect={() => openModal({ children: <ShareSong song={song} />, title: `Send ${song.name}` })}
        >
            Send to a friend
        </ContextMenu.Item>
    );
};

// Album / playlist right-click: pin it to the top of the sidebar
export const PinAction = ({
    item,
    kind,
}: {
    item?: { id: string; imageId?: null | string; name: string };
    kind: 'album' | 'playlist';
}) => {
    const pins = useSourStore((state) => state.pins);
    const set = useSourStore((state) => state.set);
    if (!item) return null;
    const pinned = pins.some((p) => p.kind === kind && p.id === item.id);
    return (
        <ContextMenu.Item
            leftIcon="pin"
            onSelect={() =>
                set({
                    pins: pinned
                        ? pins.filter((p) => !(p.kind === kind && p.id === item.id))
                        : [...pins, { id: item.id, imageId: item.imageId ?? null, kind, name: item.name }],
                })
            }
        >
            {pinned ? 'Unpin from sidebar' : 'Pin to sidebar'}
        </ContextMenu.Item>
    );
};

// Playlist right-click: show it on your profile
export const PinPlaylistToProfileAction = ({ playlist }: { playlist?: Playlist }) => {
    const url = useHermesUrl();
    const me = useSourStore((state) => state.me);
    if (!url || !me || !playlist) return null;
    return (
        <ContextMenu.Item
            leftIcon="user"
            onSelect={async () => {
                try {
                    const profile = await sourApi.me(url, me);
                    await sourApi.update(url, me, {
                        custom: {
                            ...profile.custom,
                            pinnedPlaylist: { id: playlist.id, imageId: playlist.imageId, name: playlist.name },
                        },
                    });
                    toast.success({ message: `${playlist.name} is on your profile` });
                } catch (error) {
                    toast.error({ message: (error as Error).message });
                }
            }}
        >
            Pin to my profile
        </ContextMenu.Item>
    );
};

// Artist right-click: new releases download by themselves (Hermes Music checks every 6 hours)
export const FollowArtistAction = ({ artists }: { artists: (AlbumArtist | Artist)[] }) => {
    const url = useHermesUrl();
    const me = useSourStore((state) => state.me);
    const artist = artists[0];
    if (!url || !me || artists.length !== 1 || !artist) return null;
    return (
        <ContextMenu.Item
            leftIcon="add"
            onSelect={() =>
                sourApi
                    .follow(url, me, artist.name)
                    .then((r) => toast.success({ message: `New releases from ${r.artist} will download by themselves` }))
                    .catch((error: Error) => toast.error({ message: error.message }))
            }
        >
            Follow new releases
        </ContextMenu.Item>
    );
};

// Artist right-click: put a few of their songs on Sour Radio
export const ArtistToRadioAction = ({ artists }: { artists: (AlbumArtist | Artist)[] }) => {
    const url = useHermesUrl();
    const queryClient = useQueryClient();
    const serverId = useCurrentServer()?.id;
    const artist = artists[0];
    if (!url || !serverId || artists.length !== 1 || !artist) return null;
    return (
        <ContextMenu.Item
            leftIcon="radio"
            onSelect={async () => {
                try {
                    const res = await queryClient.fetchQuery(
                        songsQueries.artistRadio({ query: { artistId: artist.id, count: 30 }, serverId }),
                    );
                    const theirs = res.items
                        .filter((s) => s.artistName.toLowerCase().includes(artist.name.toLowerCase()))
                        .sort(() => Math.random() - 0.5)
                        .slice(0, 3);
                    if (!theirs.length) throw new Error(`Couldn't find songs by ${artist.name}`);
                    const { member, userName } = useGroupPlayStore.getState();
                    await groupApi.add(url, 'RADIO', userName || 'Someone', theirs.map(toGroupSong), member);
                    toast.success({ message: `Added ${theirs.length} ${artist.name} songs to Sour Radio` });
                } catch (error) {
                    toast.error({ message: (error as Error).message });
                }
            }}
        >
            Add to Sour Radio
        </ContextMenu.Item>
    );
};
