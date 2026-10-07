import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import styles from './people.module.css';

import { toGroupSong } from '/@/renderer/features/group-play/api/group-play-api';
import { useGroupPlayStore } from '/@/renderer/features/group-play/store/group-play.store';
import { useHermesUrl } from '/@/renderer/features/hermes-video/store/hermes-video.store';
import {
    type ProfileCustom,
    readPicture,
    sourApi,
    type SourProfile,
} from '/@/renderer/features/sour/api/sour-api';
import { SongCover } from '/@/renderer/features/sour/components/profile-bits';
import { ProfileView, SECTIONS } from '/@/renderer/features/sour/components/profile-view';
import { useMyProfile, useSourStore } from '/@/renderer/features/sour/store/sour.store';
import { playSound, SOUNDS } from '/@/renderer/features/sour/utils/sounds';
import { usePlayerSong } from '/@/renderer/store';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Button } from '/@/shared/components/button/button';
import { ColorInput } from '/@/shared/components/color-input/color-input';
import { FileButton } from '/@/shared/components/file-button/file-button';
import { Group } from '/@/shared/components/group/group';
import { SegmentedControl } from '/@/shared/components/segmented-control/segmented-control';
import { Select } from '/@/shared/components/select/select';
import { Slider } from '/@/shared/components/slider/slider';
import { Stack } from '/@/shared/components/stack/stack';
import { Switch } from '/@/shared/components/switch/switch';
import { TextInput } from '/@/shared/components/text-input/text-input';
import { Text } from '/@/shared/components/text/text';
import { Textarea } from '/@/shared/components/textarea/textarea';
import { toast } from '/@/shared/components/toast/toast';

const SWATCHES = ['#60a5fa', '#a78bfa', '#22d3ee', '#4ade80', '#fb923c', '#fb7185', '#facc15'];

const weekNow = () => {
    const d = new Date();
    const start = new Date(d.getFullYear(), 0, 1);
    const week = Math.ceil(((+d - +start) / 86400000 + start.getDay() + 1) / 7);
    return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`;
};

type Draft = Pick<SourProfile, 'away' | 'bio' | 'color' | 'custom' | 'name' | 'status'>;

// Edit your own profile with a live preview next to it. Nothing is saved until you press Save;
// Undo puts everything back to how it was when you opened the editor.
export const ProfileEditor = ({
    onDone,
    profile,
}: {
    onDone: () => void;
    profile: SourProfile;
}) => {
    const url = useHermesUrl();
    const me = useSourStore((state) => state.me);
    const setStore = useSourStore((state) => state.set);
    const blocked = useSourStore((state) => state.blocked);
    const unblock = useSourStore((state) => state.unblock);
    const mine = useMyProfile().data;
    const queryClient = useQueryClient();
    const current = usePlayerSong();
    const original: Draft = {
        away: profile.away || '',
        bio: profile.bio,
        color: profile.color,
        custom: profile.custom || {},
        name: profile.name,
        status: profile.status,
    };
    const [draft, setDraft] = useState<Draft>(original);
    const [tab, setTab] = useState('look');
    const [busy, setBusy] = useState(false);
    const [sticker, setSticker] = useState('');
    const [genre, setGenre] = useState('');
    const [linkCode, setLinkCode] = useState('');
    const [claimCode, setClaimCode] = useState('');

    const c = draft.custom;
    const setC = (changes: Partial<ProfileCustom>) =>
        setDraft((d) => ({ ...d, custom: { ...d.custom, ...changes } }));
    const refresh = () => {
        queryClient.invalidateQueries({ queryKey: ['sour-profiles', url] });
        queryClient.invalidateQueries({ queryKey: ['sour-me', url] });
    };

    const picture = (kind: 'avatar' | 'background' | 'banner', file: File | null) => {
        if (!file || !me) return;
        setBusy(true);
        readPicture(file, kind === 'avatar' ? 512 : 1800, kind === 'avatar' ? 3000000 : 6000000)
            .then((data) => sourApi.setImage(url, me, kind, data))
            .then(refresh)
            .catch((error: Error) => toast.error({ message: error.message }))
            .finally(() => setBusy(false));
    };
    const removePicture = (kind: 'avatar' | 'background' | 'banner') => {
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
            .update(url, me, draft)
            .then(() => {
                useGroupPlayStore.getState().actions.setUserName(draft.name);
                toast.success({ message: 'Profile saved' });
                refresh();
                onDone();
            })
            .catch((error: Error) => toast.error({ message: error.message }))
            .finally(() => setBusy(false));
    };

    const pickButton = (kind: 'avatar' | 'background' | 'banner', label: string, has: boolean) => (
        <Group gap="xs">
            <FileButton
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={(file) => picture(kind, file)}
            >
                {(props) => (
                    <Button {...props} disabled={busy} size="compact-xs" variant="default">
                        {has ? `Change ${label}` : `Add ${label}`}
                    </Button>
                )}
            </FileButton>
            {has && (
                <Button onClick={() => removePicture(kind)} size="compact-xs" variant="subtle">
                    Remove
                </Button>
            )}
        </Group>
    );

    const order = c.sections?.order?.length ? c.sections.order : SECTIONS.map(([id]) => id);
    const fullOrder = [...order, ...SECTIONS.map(([id]) => id).filter((id) => !order.includes(id))];
    const hidden = c.sections?.hidden || [];
    const moveSection = (id: string, by: number) => {
        const list = [...fullOrder];
        const at = list.indexOf(id);
        const to = Math.max(0, Math.min(list.length - 1, at + by));
        list.splice(at, 1);
        list.splice(to, 0, id);
        setC({ sections: { hidden, order: list } });
    };

    const looks = (
        <Stack gap="sm">
            <Text fw={700}>Pictures</Text>
            {pickButton('avatar', 'picture (GIFs work)', !!profile.avatar)}
            {!!mine?.avatarHistory?.length && (
                <Group gap="xs">
                    <Text isMuted size="xs">
                        Earlier pictures:
                    </Text>
                    {mine.avatarHistory.map((v) => (
                        <button
                            className={styles.historyPic}
                            key={v}
                            onClick={() =>
                                me &&
                                sourApi
                                    .restoreAvatar(url, me, v)
                                    .then(refresh)
                                    .catch((error: Error) =>
                                        toast.error({ message: error.message }),
                                    )
                            }
                            title="Use this picture again"
                            type="button"
                        >
                            <img alt="" src={`${url}/api/profiles/${profile.id}/avatar?v=${v}`} />
                        </button>
                    ))}
                </Group>
            )}
            {pickButton('banner', 'banner', !!profile.banner)}
            {!!profile.banner && (
                <Stack gap={4}>
                    <Text isMuted size="xs">
                        Banner position and zoom
                    </Text>
                    <Slider
                        label={(v) => `left/right ${v}%`}
                        onChange={(x) =>
                            setC({
                                bannerPos: { ...(c.bannerPos || { x: 50, y: 50, zoom: 100 }), x },
                            })
                        }
                        value={c.bannerPos?.x ?? 50}
                    />
                    <Slider
                        label={(v) => `up/down ${v}%`}
                        onChange={(y) =>
                            setC({
                                bannerPos: { ...(c.bannerPos || { x: 50, y: 50, zoom: 100 }), y },
                            })
                        }
                        value={c.bannerPos?.y ?? 50}
                    />
                    <Slider
                        label={(v) => `zoom ${v}%`}
                        max={300}
                        min={100}
                        onChange={(zoom) =>
                            setC({
                                bannerPos: {
                                    ...(c.bannerPos || { x: 50, y: 50, zoom: 100 }),
                                    zoom,
                                },
                            })
                        }
                        value={c.bannerPos?.zoom ?? 100}
                    />
                </Stack>
            )}
            {!profile.banner && (
                <Group gap="xs">
                    <Text isMuted size="xs">
                        Gradient banner:
                    </Text>
                    {[0, 1, 2].map((i) => (
                        <ColorInput
                            key={i}
                            onChange={(v) => {
                                const g = [...(c.gradient || [])];
                                g[i] = v;
                                setC({ gradient: g.filter(Boolean) });
                            }}
                            placeholder={`colour ${i + 1}`}
                            swatches={SWATCHES}
                            value={c.gradient?.[i] || ''}
                            w={120}
                        />
                    ))}
                </Group>
            )}
            {pickButton('background', 'background', !!profile.background)}
            <Text fw={700}>Colours</Text>
            <Group gap="xs" grow>
                <ColorInput
                    label="Accent"
                    onChange={(accent) => setC({ theme: { ...c.theme, accent } })}
                    swatches={SWATCHES}
                    value={c.theme?.accent || ''}
                />
                <ColorInput
                    label="Card"
                    onChange={(card) => setC({ theme: { ...c.theme, card } })}
                    value={c.theme?.card || ''}
                />
                <ColorInput
                    label="Page"
                    onChange={(background) => setC({ theme: { ...c.theme, background } })}
                    value={c.theme?.background || ''}
                />
            </Group>
            <Text fw={700}>Picture frame and name</Text>
            <Group gap="xs" grow>
                <Select
                    data={[
                        { label: 'No frame', value: '' },
                        { label: 'Rainbow (animated)', value: 'rainbow' },
                        { label: 'Gold', value: '#facc15' },
                        { label: 'Silver', value: '#cbd5e1' },
                        { label: 'Accent colour', value: c.theme?.accent || '#60a5fa' },
                    ]}
                    label="Frame"
                    onChange={(v) => setC({ frame: v || '' })}
                    value={c.frame || ''}
                />
                <Select
                    data={[
                        { label: 'Default', value: 'default' },
                        { label: 'Serif', value: 'serif' },
                        { label: 'Mono', value: 'mono' },
                        { label: 'Rounded', value: 'rounded' },
                        { label: 'Script', value: 'script' },
                        ...(mine?.perks?.includes('determination')
                            ? [{ label: 'Determination (only yours)', value: 'determination' }]
                            : []),
                    ]}
                    label="Name font"
                    onChange={(v) => setC({ nameFont: v || 'default' })}
                    value={c.nameFont || 'default'}
                />
                <Select
                    data={[
                        { label: 'None', value: 'none' },
                        { label: 'Shimmer', value: 'shimmer' },
                        { label: 'Rainbow', value: 'rainbow' },
                        { label: 'Glow', value: 'glow' },
                    ]}
                    label="Name effect"
                    onChange={(v) => setC({ nameEffect: v || 'none' })}
                    value={c.nameEffect || 'none'}
                />
            </Group>
            <Group gap="xs" grow>
                <TextInput
                    label="Mood emoji"
                    maxLength={4}
                    onChange={(e) => setC({ emoji: e.currentTarget.value })}
                    placeholder="🎧"
                    value={c.emoji || ''}
                />
                <TextInput
                    label="Header (on your banner)"
                    onChange={(e) => setC({ header: e.currentTarget.value })}
                    placeholder="Zesty's corner"
                    value={c.header || ''}
                />
            </Group>
            <Text fw={700}>Stickers on your banner</Text>
            <Group gap="xs">
                <TextInput
                    maxLength={4}
                    onChange={(e) => setSticker(e.currentTarget.value)}
                    placeholder="⭐"
                    value={sticker}
                    w={80}
                />
                <Button
                    disabled={!sticker.trim() || (c.stickers || []).length >= 8}
                    onClick={() => {
                        setC({
                            stickers: [
                                ...(c.stickers || []),
                                {
                                    emoji: sticker,
                                    x: 10 + Math.random() * 80,
                                    y: 15 + Math.random() * 60,
                                },
                            ],
                        });
                        setSticker('');
                    }}
                    size="xs"
                    variant="default"
                >
                    Add sticker
                </Button>
            </Group>
            {(c.stickers || []).map((s, i) => (
                <Group gap="xs" key={`${s.emoji}-${i}`} wrap="nowrap">
                    <Text>{s.emoji}</Text>
                    <Slider
                        flex={1}
                        onChange={(x) =>
                            setC({
                                stickers: (c.stickers || []).map((t, j) =>
                                    j === i ? { ...t, x } : t,
                                ),
                            })
                        }
                        value={s.x}
                    />
                    <Slider
                        flex={1}
                        onChange={(y) =>
                            setC({
                                stickers: (c.stickers || []).map((t, j) =>
                                    j === i ? { ...t, y } : t,
                                ),
                            })
                        }
                        value={s.y}
                    />
                    <ActionIcon
                        icon="x"
                        onClick={() =>
                            setC({ stickers: (c.stickers || []).filter((_, j) => j !== i) })
                        }
                        size="xs"
                        variant="subtle"
                    />
                </Group>
            ))}
        </Stack>
    );

    const about = (
        <Stack gap="sm">
            <TextInput
                label="Name"
                onChange={(e) => setDraft({ ...draft, name: e.currentTarget.value })}
                value={draft.name}
            />
            <TextInput
                label="Status for today"
                onChange={(e) => setDraft({ ...draft, status: e.currentTarget.value })}
                placeholder="studying, send lo-fi"
                value={draft.status}
            />
            <TextInput
                label="Away message (shown while you're offline)"
                onChange={(e) => setDraft({ ...draft, away: e.currentTarget.value })}
                placeholder="brb, at work"
                value={draft.away}
            />
            <Textarea
                autosize
                label="Bio"
                maxRows={6}
                minRows={2}
                onChange={(e) => setDraft({ ...draft, bio: e.currentTarget.value })}
                value={draft.bio}
            />
            <Textarea
                autosize
                label="Inside jokes"
                maxRows={6}
                minRows={2}
                onChange={(e) => setC({ jokes: e.currentTarget.value })}
                placeholder="Group lore, quotes, nicknames..."
                value={c.jokes || ''}
            />
            <TextInput
                label="Birthday (friends see a cake, and Sour Radio celebrates)"
                onChange={(e) => setC({ birthday: e.currentTarget.value })}
                type="date"
                value={c.birthday || ''}
            />
            <Select
                data={[
                    { label: 'No nickname', value: '' },
                    ...(profile.nicknames || []).map((n) => ({
                        label: `${n.nick} (from ${n.fromName})`,
                        value: n.nick,
                    })),
                ]}
                description="Friends suggest nicknames from your profile; pick the one to show."
                label="Nickname"
                onChange={(v) => setC({ nickname: v || '' })}
                value={c.nickname || ''}
            />
            <Group align="flex-end" gap="xs">
                <Select
                    data={SOUNDS.map((s) => ({ label: s === 'none' ? 'No sound' : s, value: s }))}
                    flex={1}
                    label="Join sound (everyone hears it when you join a group)"
                    onChange={(v) => setC({ joinSound: v || 'none' })}
                    value={c.joinSound || 'none'}
                />
                <Button onClick={() => playSound(c.joinSound)} variant="default">
                    Play
                </Button>
            </Group>
        </Stack>
    );

    const songPicker = (
        label: string,
        song: null | undefined | { title: string },
        onSet: () => void,
        onClear: () => void,
    ) => (
        <Group gap="xs" justify="space-between">
            <Text size="sm">
                {label}: <b>{song ? song.title : 'none'}</b>
            </Text>
            <Group gap={4}>
                <Button disabled={!current} onClick={onSet} size="compact-xs" variant="default">
                    Use the song playing
                </Button>
                {song && (
                    <Button onClick={onClear} size="compact-xs" variant="subtle">
                        Clear
                    </Button>
                )}
            </Group>
        </Group>
    );

    const music = (
        <Stack gap="sm">
            {songPicker(
                'Signature song',
                c.signatureSong,
                () => current && setC({ signatureSong: toGroupSong(current) }),
                () => setC({ signatureSong: null }),
            )}
            {songPicker(
                'Song of the week',
                c.spotlight?.song,
                () => {
                    if (!current) return;
                    const week = weekNow();
                    const history =
                        c.spotlight && c.spotlight.week !== week
                            ? [c.spotlight, ...(c.spotlightHistory || [])]
                            : c.spotlightHistory || [];
                    setC({
                        spotlight: { song: toGroupSong(current), week },
                        spotlightHistory: history.slice(0, 12),
                    });
                },
                () => setC({ spotlight: null }),
            )}
            <Text fw={700}>Top 5</Text>
            {(c.top5 || []).map((song, i) => (
                <Group gap="xs" key={song.id} wrap="nowrap">
                    <Text w={16}>{i + 1}</Text>
                    <SongCover size={32} song={song} />
                    <Text flex={1} size="sm" truncate>
                        {song.title} - {song.artist}
                    </Text>
                    <ActionIcon
                        icon="arrowUp"
                        onClick={() => {
                            const list = [...(c.top5 || [])];
                            if (i > 0) [list[i - 1], list[i]] = [list[i], list[i - 1]];
                            setC({ top5: list });
                        }}
                        size="xs"
                        variant="subtle"
                    />
                    <ActionIcon
                        icon="x"
                        onClick={() =>
                            setC({ top5: (c.top5 || []).filter((s) => s.id !== song.id) })
                        }
                        size="xs"
                        variant="subtle"
                    />
                </Group>
            ))}
            <Button
                disabled={!current || (c.top5 || []).length >= 5}
                onClick={() =>
                    current &&
                    setC({
                        top5: [
                            ...(c.top5 || []).filter((s) => s.id !== current.id),
                            toGroupSong(current),
                        ],
                    })
                }
                size="xs"
                variant="default"
                w="fit-content"
            >
                Add the song playing to your Top 5
            </Button>
            <Text fw={700}>Favourite genres</Text>
            <Group gap={6}>
                {(c.genres || []).map((g) => (
                    <Button
                        key={g}
                        onClick={() => setC({ genres: (c.genres || []).filter((x) => x !== g) })}
                        rightSection={<span>&times;</span>}
                        size="compact-xs"
                        variant="default"
                    >
                        {g}
                    </Button>
                ))}
                <TextInput
                    onChange={(e) => setGenre(e.currentTarget.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && genre.trim()) {
                            setC({
                                genres: [...new Set([genre.trim(), ...(c.genres || [])])].slice(
                                    0,
                                    12,
                                ),
                            });
                            setGenre('');
                        }
                    }}
                    placeholder="Add a genre + Enter"
                    size="xs"
                    value={genre}
                />
            </Group>
            <Text size="sm">
                Pinned playlist: <b>{c.pinnedPlaylist?.name || 'none'}</b> (right-click a playlist
                &gt; Pin to my profile)
                {c.pinnedPlaylist && (
                    <Button
                        ml="xs"
                        onClick={() => setC({ pinnedPlaylist: undefined })}
                        size="compact-xs"
                        variant="subtle"
                    >
                        Remove
                    </Button>
                )}
            </Text>
            <Text fw={700}>Sections</Text>
            <Text isMuted size="xs">
                Reorder or hide parts of your profile.
            </Text>
            {fullOrder.map((id) => (
                <Group gap="xs" key={id} wrap="nowrap">
                    <Switch
                        checked={!hidden.includes(id)}
                        onChange={(e) =>
                            setC({
                                sections: {
                                    hidden: e.currentTarget.checked
                                        ? hidden.filter((h) => h !== id)
                                        : [...hidden, id],
                                    order: fullOrder,
                                },
                            })
                        }
                    />
                    <Text flex={1} size="sm">
                        {SECTIONS.find(([key]) => key === id)?.[1] ?? id}
                    </Text>
                    <ActionIcon
                        icon="arrowUp"
                        onClick={() => moveSection(id, -1)}
                        size="xs"
                        variant="subtle"
                    />
                    <ActionIcon
                        icon="arrowDownS"
                        onClick={() => moveSection(id, 1)}
                        size="xs"
                        variant="subtle"
                    />
                </Group>
            ))}
        </Stack>
    );

    const p = c.privacy || {};
    const setPrivacy = (changes: Partial<NonNullable<ProfileCustom['privacy']>>) =>
        setC({ privacy: { ...p, ...changes } });
    const privacyTab = (
        <Stack gap="sm">
            <Switch
                checked={!!p.private}
                description="Others only see your name and picture."
                label="Private profile"
                onChange={(e) => setPrivacy({ private: e.currentTarget.checked })}
            />
            <Switch
                checked={!!p.hideListening}
                label="Hide what I'm listening to"
                onChange={(e) => setPrivacy({ hideListening: e.currentTarget.checked })}
            />
            <Switch
                checked={!!p.hideLastOnline}
                label="Hide when I was last online"
                onChange={(e) => setPrivacy({ hideLastOnline: e.currentTarget.checked })}
            />
            <Switch
                checked={!!p.hideFavorites}
                label="Hide my favourites"
                onChange={(e) => setPrivacy({ hideFavorites: e.currentTarget.checked })}
            />
            <Switch
                checked={!!p.hideStats}
                description="Also keeps you off the weekly leaderboard."
                label="Hide my stats"
                onChange={(e) => setPrivacy({ hideStats: e.currentTarget.checked })}
            />
            <Switch
                checked={!!c.invisible}
                description="You appear offline to everyone."
                label="Invisible"
                onChange={(e) => setC({ invisible: e.currentTarget.checked })}
            />
            <Switch
                checked={!!c.dnd}
                description="No popups for pings, wall notes or Sour Radio songs."
                label="Do not disturb"
                onChange={(e) => setC({ dnd: e.currentTarget.checked })}
            />
            <Text fw={700}>Songs hidden from your activity</Text>
            <Text isMuted size="xs">
                Right-click a song &gt; Hide from my activity. These never show as &quot;listening
                to&quot; or in your recent plays.
            </Text>
            <Group gap={6}>
                {(c.hiddenSongs || []).map((id) => (
                    <Button
                        key={id}
                        onClick={() =>
                            setC({ hiddenSongs: (c.hiddenSongs || []).filter((x) => x !== id) })
                        }
                        rightSection={<span>&times;</span>}
                        size="compact-xs"
                        variant="default"
                    >
                        {id.slice(0, 8)}
                    </Button>
                ))}
            </Group>
        </Stack>
    );

    const account = (
        <Stack gap="sm">
            {me?.account ? (
                <>
                    <Text fw={700}>Your account</Text>
                    <Text size="sm">
                        Signed in with your Navidrome account <b>{me.account}</b>. Log into the same
                        account in Sour Player on any computer and your profile comes with it - no
                        codes needed.
                    </Text>
                </>
            ) : (
                <>
                    <Text fw={700}>Use your profile on another computer</Text>
                    <Group gap="xs">
                        <Button
                            onClick={() =>
                                me &&
                                sourApi
                                    .link(url, me)
                                    .then((r) => setLinkCode(r.code))
                                    .catch((error: Error) =>
                                        toast.error({ message: error.message }),
                                    )
                            }
                            size="xs"
                            variant="default"
                        >
                            Get a code
                        </Button>
                        {linkCode && (
                            <Text className={styles.linkCode}>
                                {linkCode}{' '}
                                <span className={styles.muted}>
                                    (type it on the other computer, works for 10 min)
                                </span>
                            </Text>
                        )}
                    </Group>
                    <Group gap="xs">
                        <TextInput
                            onChange={(e) => setClaimCode(e.currentTarget.value.toUpperCase())}
                            placeholder="Code from your other computer"
                            value={claimCode}
                        />
                        <Button
                            disabled={claimCode.length < 6}
                            onClick={() =>
                                sourApi
                                    .claim(url, claimCode)
                                    .then((r) => {
                                        setStore({ me: { id: r.id, key: r.key } });
                                        useGroupPlayStore
                                            .getState()
                                            .actions.setUserName(r.profile.name);
                                        toast.success({
                                            message: `This computer now uses ${r.profile.name}'s profile`,
                                        });
                                        refresh();
                                        onDone();
                                    })
                                    .catch((error: Error) =>
                                        toast.error({ message: error.message }),
                                    )
                            }
                            size="xs"
                            variant="default"
                        >
                            Use this code
                        </Button>
                    </Group>
                </>
            )}
            <Text fw={700}>Blocked from Auto DJ</Text>
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
                        Nobody blocked (right-click a song &gt; Block artist from Auto DJ).
                    </Text>
                )}
            </Group>
        </Stack>
    );

    return (
        <div className={styles.editor}>
            <Stack className={styles.editorForm} gap="md">
                <SegmentedControl
                    data={[
                        { label: 'Look', value: 'look' },
                        { label: 'About', value: 'about' },
                        { label: 'Music', value: 'music' },
                        { label: 'Privacy', value: 'privacy' },
                        { label: 'Account', value: 'account' },
                    ]}
                    onChange={setTab}
                    value={tab}
                />
                {tab === 'look' && looks}
                {tab === 'about' && about}
                {tab === 'music' && music}
                {tab === 'privacy' && privacyTab}
                {tab === 'account' && account}
                <Group justify="space-between">
                    <Button onClick={() => setDraft(original)} variant="subtle">
                        Undo changes
                    </Button>
                    <Group gap="xs">
                        <Button onClick={onDone} variant="default">
                            Cancel
                        </Button>
                        <Button disabled={busy} onClick={save} variant="filled">
                            Save
                        </Button>
                    </Group>
                </Group>
            </Stack>
            <div className={styles.editorPreview}>
                <Text isMuted size="xs">
                    Live preview
                </Text>
                <ProfileView preview profile={{ ...profile, ...draft }} />
            </div>
        </div>
    );
};
