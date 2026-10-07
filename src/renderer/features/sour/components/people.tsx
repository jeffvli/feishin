import { openModal } from '@mantine/modals';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import styles from './people.module.css';

import { ItemImage } from '/@/renderer/components/item-image/item-image';
import {
    type GroupSong,
    useGroupPlayStore,
} from '/@/renderer/features/group-play/store/group-play.store';
import { useHermesUrl } from '/@/renderer/features/hermes-video/store/hermes-video.store';
import { getSongById } from '/@/renderer/features/player/utils';
import {
    avatarUrl,
    bannerUrl,
    readPicture,
    sourApi,
    type SourProfile,
    timeAgo,
} from '/@/renderer/features/sour/api/sour-api';
import { useSourProfiles, useSourStore } from '/@/renderer/features/sour/store/sour.store';
import { useCurrentServer } from '/@/renderer/store';
import { addToQueueByData } from '/@/renderer/store/player.store';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Button } from '/@/shared/components/button/button';
import { ColorInput } from '/@/shared/components/color-input/color-input';
import { FileButton } from '/@/shared/components/file-button/file-button';
import { Group } from '/@/shared/components/group/group';
import { Stack } from '/@/shared/components/stack/stack';
import { TextInput } from '/@/shared/components/text-input/text-input';
import { Text } from '/@/shared/components/text/text';
import { Textarea } from '/@/shared/components/textarea/textarea';
import { toast } from '/@/shared/components/toast/toast';
import { LibraryItem } from '/@/shared/types/domain-types';
import { Play } from '/@/shared/types/types';

const hue = (name: string) =>
    [...name].reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) % 360, 7);

export const ProfileAvatar = ({
    online,
    profile,
    size = 40,
}: {
    online?: boolean;
    profile: Pick<SourProfile, 'avatar' | 'id' | 'name'>;
    size?: number;
}) => {
    const url = useHermesUrl();
    const src = avatarUrl(url, profile);
    return (
        <span
            className={styles.avatar}
            style={{
                background: `hsl(${hue(profile.name)} 60% 42%)`,
                fontSize: size * 0.42,
                height: size,
                width: size,
            }}
        >
            {src ? (
                <img alt="" className={styles.avatarImage} src={src} />
            ) : (
                (profile.name.trim()[0] || '?').toUpperCase()
            )}
            {online !== undefined && <span className={online ? styles.online : styles.offline} />}
        </span>
    );
};

const SongCover = ({ size, song }: { size: number; song: GroupSong }) => {
    const serverId = useCurrentServer()?.id;
    return (
        <div className={styles.cover} style={{ height: size, width: size }}>
            {song.imageId && serverId && (
                <ItemImage
                    className={styles.coverImage}
                    containerClassName={styles.coverImage}
                    id={song.imageId}
                    itemType={LibraryItem.SONG}
                    serverId={serverId}
                    type="table"
                />
            )}
        </div>
    );
};

const usePlaySong = () => {
    const queryClient = useQueryClient();
    const serverId = useCurrentServer()?.id;
    return (song: GroupSong) => {
        if (!serverId) return;
        getSongById({ id: song.id, queryClient, serverId })
            .then((res) => addToQueueByData(Play.NOW, res.items))
            .catch(() => toast.error({ message: `${song.title} isn't on your music server` }));
    };
};

const activity = (p: SourProfile) => {
    if (!p.online) return `Last online ${timeAgo(p.lastSeen)}`;
    if (p.listening) {
        const verb = p.playing ? 'Listening to' : 'Paused';
        return `${verb} ${p.listening.title} by ${p.listening.artist}`;
    }
    return p.status || 'Online';
};

// Edit your own profile: name, status, bio, colour, picture (PNG, JPEG, WebP or an animated GIF)
// and banner.
const ProfileEditor = ({ onDone, profile }: { onDone: () => void; profile: SourProfile }) => {
    const url = useHermesUrl();
    const me = useSourStore((state) => state.me);
    const queryClient = useQueryClient();
    const [name, setName] = useState(profile.name);
    const [status, setStatus] = useState(profile.status);
    const [bio, setBio] = useState(profile.bio);
    const [color, setColor] = useState(profile.color || '');
    const [busy, setBusy] = useState(false);

    const refresh = () => queryClient.invalidateQueries({ queryKey: ['sour-profiles', url] });

    const picture = (kind: 'avatar' | 'banner', file: File | null) => {
        if (!file || !me) return;
        setBusy(true);
        readPicture(file, kind === 'banner' ? 1600 : 512, kind === 'banner' ? 6000000 : 3000000)
            .then((data) => sourApi.setImage(url, me, kind, data))
            .then(refresh)
            .catch((error: Error) => toast.error({ message: error.message }))
            .finally(() => setBusy(false));
    };

    const removePicture = (kind: 'avatar' | 'banner') => {
        if (!me) return;
        sourApi
            .setImage(url, me, kind, null)
            .then(refresh)
            .catch((error: Error) => toast.error({ message: error.message }));
    };

    const save = () => {
        if (!me) return;
        setBusy(true);
        sourApi
            .update(url, me, { bio, color: color || null, name, status })
            .then(() => {
                useGroupPlayStore.getState().actions.setUserName(name);
                toast.success({ message: 'Profile saved' });
                return refresh();
            })
            .then(onDone)
            .catch((error: Error) => toast.error({ message: error.message }))
            .finally(() => setBusy(false));
    };

    return (
        <Stack gap="md">
            <Group align="flex-start" gap="lg" wrap="nowrap">
                <Stack align="center" gap={6}>
                    <ProfileAvatar profile={profile} size={88} />
                    <FileButton
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        onChange={(file) => picture('avatar', file)}
                    >
                        {(props) => (
                            <Button {...props} disabled={busy} size="compact-xs" variant="default">
                                Picture
                            </Button>
                        )}
                    </FileButton>
                    {!!profile.avatar && (
                        <Button
                            onClick={() => removePicture('avatar')}
                            size="compact-xs"
                            variant="subtle"
                        >
                            Remove
                        </Button>
                    )}
                </Stack>
                <Stack flex={1} gap="sm">
                    <TextInput
                        label="Name"
                        onChange={(e) => setName(e.currentTarget.value)}
                        value={name}
                    />
                    <TextInput
                        label="Status"
                        onChange={(e) => setStatus(e.currentTarget.value)}
                        placeholder="What are you up to?"
                        value={status}
                    />
                </Stack>
            </Group>
            <Textarea
                autosize
                label="Bio"
                maxRows={6}
                minRows={3}
                onChange={(e) => setBio(e.currentTarget.value)}
                placeholder="Tell people about your music taste"
                value={bio}
            />
            <ColorInput
                label="Profile colour"
                onChange={setColor}
                placeholder="Pick a colour"
                swatches={['#60a5fa', '#a78bfa', '#22d3ee', '#4ade80', '#fb923c', '#fb7185']}
                value={color}
            />
            <Group gap="xs">
                <Text size="sm">Banner</Text>
                <FileButton
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    onChange={(file) => picture('banner', file)}
                >
                    {(props) => (
                        <Button {...props} disabled={busy} size="compact-xs" variant="default">
                            {profile.banner ? 'Change banner' : 'Add a banner'}
                        </Button>
                    )}
                </FileButton>
                {!!profile.banner && (
                    <Button
                        onClick={() => removePicture('banner')}
                        size="compact-xs"
                        variant="subtle"
                    >
                        Remove
                    </Button>
                )}
            </Group>
            <Group justify="flex-end">
                <Button onClick={onDone} variant="default">
                    Cancel
                </Button>
                <Button disabled={busy} onClick={save} variant="filled">
                    Save
                </Button>
            </Group>
        </Stack>
    );
};

// A profile card: banner, picture, name, what they're doing, bio and favourite songs.
const ProfileView = ({ onBack, profile }: { onBack?: () => void; profile: SourProfile }) => {
    const url = useHermesUrl();
    const me = useSourStore((state) => state.me);
    const blocked = useSourStore((state) => state.blocked);
    const unblock = useSourStore((state) => state.unblock);
    const queryClient = useQueryClient();
    const playSong = usePlaySong();
    const [editing, setEditing] = useState(false);
    const isMe = me?.id === profile.id;
    const banner = bannerUrl(url, profile);
    const accent = profile.color || `hsl(${hue(profile.name)} 55% 40%)`;

    if (editing) return <ProfileEditor onDone={() => setEditing(false)} profile={profile} />;

    const removeFavorite = (song: GroupSong) => {
        if (!me) return;
        sourApi
            .update(url, me, { favorites: profile.favorites.filter((f) => f.id !== song.id) })
            .then(() => queryClient.invalidateQueries({ queryKey: ['sour-profiles', url] }))
            .catch((error: Error) => toast.error({ message: error.message }));
    };

    return (
        <Stack gap="md">
            {onBack && (
                <Button onClick={onBack} size="compact-xs" variant="subtle" w="fit-content">
                    Back to people
                </Button>
            )}
            <div className={styles.profile}>
                <div
                    className={styles.banner}
                    style={{
                        background: banner
                            ? `center / cover no-repeat url("${banner}")`
                            : `linear-gradient(135deg, ${accent}, rgb(20 20 30))`,
                    }}
                />
                <div className={styles.profileHead}>
                    <span className={styles.bigAvatar} style={{ borderColor: accent }}>
                        <ProfileAvatar online={profile.online} profile={profile} size={92} />
                    </span>
                    <Stack gap={2} miw={0}>
                        <Text fw={800} size="xl" truncate>
                            {profile.name}
                        </Text>
                        <Text isMuted size="sm">
                            {activity(profile)}
                        </Text>
                    </Stack>
                    {isMe && (
                        <Button
                            ml="auto"
                            onClick={() => setEditing(true)}
                            size="xs"
                            variant="filled"
                        >
                            Edit profile
                        </Button>
                    )}
                </div>
            </div>
            {profile.status && profile.online && profile.listening && (
                <Text size="sm">{profile.status}</Text>
            )}
            {profile.bio && <Text className={styles.bio}>{profile.bio}</Text>}
            {profile.online && profile.listening && (
                <button
                    className={styles.nowCard}
                    onClick={() => profile.listening && playSong(profile.listening)}
                    style={{ borderColor: accent }}
                    type="button"
                >
                    <SongCover size={56} song={profile.listening} />
                    <Stack gap={0} miw={0}>
                        <Text className={styles.eyebrow}>Listening now</Text>
                        <Text fw={700} truncate>
                            {profile.listening.title}
                        </Text>
                        <Text isMuted size="sm" truncate>
                            {profile.listening.artist}
                        </Text>
                    </Stack>
                </button>
            )}
            <Stack gap={6}>
                <Text fw={700}>Favourite songs</Text>
                {!profile.favorites.length && (
                    <Text isMuted size="sm">
                        {isMe ? 'Right-click any song > Add to my profile.' : 'No favourites yet.'}
                    </Text>
                )}
                {profile.favorites.map((song) => (
                    <div className={styles.favorite} key={song.id}>
                        <button
                            className={styles.favoriteSong}
                            onClick={() => playSong(song)}
                            type="button"
                        >
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
                        {isMe && (
                            <ActionIcon
                                icon="x"
                                onClick={() => removeFavorite(song)}
                                size="sm"
                                tooltip={{ label: 'Remove from my profile' }}
                                variant="subtle"
                            />
                        )}
                    </div>
                ))}
            </Stack>
            {isMe && (
                <Stack gap={6}>
                    <Text fw={700}>Blocked from Auto DJ</Text>
                    <Text isMuted size="xs">
                        Auto DJ never adds these artists for you (Group Play is not affected).
                        Right-click a song &gt; Block artist from Auto DJ.
                    </Text>
                    <Group gap="xs">
                        {blocked.map((artist) => (
                            <Button
                                key={artist.name}
                                onClick={() => unblock(artist.name)}
                                rightSection={<span>&times;</span>}
                                size="compact-xs"
                                variant="default"
                            >
                                {artist.name}
                            </Button>
                        ))}
                        {!blocked.length && (
                            <Text isMuted size="sm">
                                Nobody blocked.
                            </Text>
                        )}
                    </Group>
                </Stack>
            )}
        </Stack>
    );
};

// Everyone with Sour Player: who's online and what they're listening to.
const PeoplePanel = () => {
    const url = useHermesUrl();
    const me = useSourStore((state) => state.me);
    const profiles = useSourProfiles();
    const [viewing, setViewing] = useState<null | string>(null);

    if (!url) {
        return (
            <Text isMuted>
                People runs through Hermes Music. Add its address in Settings &gt; General &gt;
                Music videos first.
            </Text>
        );
    }

    const all = profiles.data ?? [];
    const shown = viewing ? all.find((p) => p.id === viewing) : null;
    if (shown) return <ProfileView onBack={() => setViewing(null)} profile={shown} />;

    const mine = all.find((p) => p.id === me?.id);
    const others = all.filter((p) => p.id !== me?.id);
    const online = others.filter((p) => p.online);
    const offline = others.filter((p) => !p.online);

    const row = (p: SourProfile) => (
        <button className={styles.person} key={p.id} onClick={() => setViewing(p.id)} type="button">
            <ProfileAvatar online={p.online} profile={p} />
            <Stack flex={1} gap={0} miw={0}>
                <Text fw={600} size="sm" truncate>
                    {p.name}
                </Text>
                <Text isMuted size="xs" truncate>
                    {activity(p)}
                </Text>
            </Stack>
            {p.online && p.listening && <SongCover size={36} song={p.listening} />}
        </button>
    );

    return (
        <Stack gap="md">
            {mine && (
                <div className={styles.meCard}>
                    {row(mine)}
                    <Button onClick={() => setViewing(mine.id)} size="xs" variant="filled">
                        My profile
                    </Button>
                </div>
            )}
            <Stack gap={4}>
                <Text fw={700}>Online - {online.length}</Text>
                {online.map(row)}
                {!online.length && (
                    <Text isMuted size="sm">
                        Nobody else is online right now.
                    </Text>
                )}
            </Stack>
            {!!offline.length && (
                <Stack gap={4}>
                    <Text fw={700}>Offline</Text>
                    {offline.map(row)}
                </Stack>
            )}
        </Stack>
    );
};

// Player bar: opens People.
export const PeopleButton = () => {
    const profiles = useSourProfiles();
    const me = useSourStore((state) => state.me);
    const online = (profiles.data ?? []).filter((p) => p.online && p.id !== me?.id).length;
    return (
        <ActionIcon
            icon="user"
            iconProps={{ color: online ? 'primary' : undefined, size: 'lg' }}
            onClick={(e) => {
                e.stopPropagation();
                openModal({ children: <PeoplePanel />, size: 'lg', title: 'People' });
            }}
            size="sm"
            tooltip={{ label: `People (${online} online)`, openDelay: 0 }}
            variant="subtle"
        />
    );
};

// Opens one person's profile (used from Group Play).
export const openProfile = (profile: SourProfile) =>
    openModal({ children: <ProfileView profile={profile} />, size: 'lg', title: profile.name });
