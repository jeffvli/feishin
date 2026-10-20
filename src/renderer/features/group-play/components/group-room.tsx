import { closeModal, openModal } from '@mantine/modals';
import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { useEffect, useState } from 'react';

import styles from './group-room.module.css';

import { groupApi, type SessionSummary } from '/@/renderer/features/group-play/api/group-play-api';
import {
    type GroupSong,
    type GroupState,
    type ThemeNight,
    useGroupPlayStore,
} from '/@/renderer/features/group-play/store/group-play.store';
import { useHermesUrl } from '/@/renderer/features/hermes-video/store/hermes-video.store';
import { avatarUrl } from '/@/renderer/features/sour/api/sour-api';
import { hue, SongCover } from '/@/renderer/features/sour/components/profile-bits';
import {
    useMyProfile,
    useSourProfiles,
    useSourStore,
} from '/@/renderer/features/sour/store/sour.store';
import { setSoundBase, SOUNDBOARD } from '/@/renderer/features/sour/utils/sounds';
import { Button } from '/@/shared/components/button/button';
import { Group } from '/@/shared/components/group/group';
import { Select } from '/@/shared/components/select/select';
import { Stack } from '/@/shared/components/stack/stack';
import { Switch } from '/@/shared/components/switch/switch';
import { TextInput } from '/@/shared/components/text-input/text-input';
import { Text } from '/@/shared/components/text/text';
import { toast } from '/@/shared/components/toast/toast';

const fail = (error: Error) => toast.error({ message: error.message });

const who = () => {
    const { hostKey, member, role } = useGroupPlayStore.getState();
    return role === 'host' ? { hostKey } : { member };
};

export const ROOM_THEMES: Array<{ label: string; value: string }> = [
    { label: 'Plain', value: 'none' },
    { label: 'Club lights', value: 'club' },
    { label: 'Campfire', value: 'campfire' },
    { label: '90s TV', value: 'retro' },
    { label: 'Beach', value: 'beach' },
    { label: 'Space', value: 'space' },
    { label: 'Rainy day', value: 'rainy' },
];

const COLOUR_WORDS =
    /\b(red|blue|green|yellow|black|white|purple|pink|orange|gold|silver|grey|gray|violet|scarlet|indigo|crimson|brown|cherry|lemon|lime)\b/i;

// does a song fit tonight's theme? (null when there's no rule the app can check)
export const fitsTheme = (song: GroupSong, t?: null | ThemeNight) => {
    if (!t) return null;
    if (t.kind === 'decade' && typeof t.value === 'number') {
        if (!song.year) return null;
        return song.year >= t.value && song.year < t.value + 10;
    }
    if (t.kind === 'word' && typeof t.value === 'string')
        return song.title.toLowerCase().includes(t.value.toLowerCase());
    if (t.kind === 'artist' && typeof t.value === 'string')
        return song.artist.toLowerCase().includes(t.value.toLowerCase());
    if (t.kind === 'colour') return COLOUR_WORDS.test(song.title);
    return null;
};

export const themeLabel = (t: ThemeNight) =>
    t.label ||
    (t.kind === 'decade'
        ? `${t.value}s only`
        : t.kind === 'word'
          ? `Songs with "${t.value}" in the title`
          : t.kind === 'artist'
            ? `${t.value} night`
            : t.kind === 'colour'
              ? 'Songs with a colour in the title'
              : 'Theme night');

// ---------- the stage: whoever's playing in the middle, everyone around, chat bubbles ----------
export const GroupStage = ({ isRadio, state }: { isRadio: boolean; state: GroupState }) => {
    const url = useHermesUrl();
    const profiles = useSourProfiles().data ?? [];
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(timer);
    }, []);
    const people = [
        ...(isRadio
            ? []
            : [
                  {
                      id: 'host',
                      name: state.host,
                      profile: state.hostProfile ?? null,
                      spectate: false,
                  },
              ]),
        ...state.members.map((m) => ({
            id: m.id,
            name: m.name,
            profile: m.profile ?? null,
            spectate: !!m.spectate,
        })),
    ].filter(
        (p, i, list) =>
            list.findIndex((x) => (x.profile || x.name) === (p.profile || p.name)) === i,
    );
    const djName = state.dj?.name ?? state.show?.name ?? (isRadio ? null : state.host);
    const bubbles = new Map<string, string>();
    for (const c of state.chat ?? []) if (now - c.at < 7000) bubbles.set(c.by, c.text);
    const recentReactions = (state.marks ?? []).length;
    const heat = Math.min(
        1,
        (people.length - 1) * 0.15 +
            recentReactions * 0.03 +
            (state.queue.length - state.index) * 0.02,
    );
    const pic = (p: { name: string; profile: null | string }) => {
        const prof = profiles.find((x) => x.id === p.profile);
        return prof ? avatarUrl(url, prof) : null;
    };
    return (
        <div className={clsx(styles.stage, styles[`theme-${state.roomTheme ?? 'none'}`])}>
            <div className={styles.pill}>
                {people.length} listening
                <span className={styles.heat} title="How lively the room is">
                    <span style={{ width: `${Math.round(heat * 100)}%` }} />
                </span>
            </div>
            <div className={styles.people}>
                {people.map((p) => {
                    const src = pic(p);
                    const isDj = p.name === djName;
                    return (
                        <div
                            className={clsx(styles.person, {
                                [styles.dj]: isDj,
                                [styles.spectator]: p.spectate,
                            })}
                            key={p.id}
                        >
                            {bubbles.has(p.name) && (
                                <span className={styles.bubble}>{bubbles.get(p.name)}</span>
                            )}
                            <span
                                className={styles.face}
                                style={{ background: `hsl(${hue(p.name)} 60% 45%)` }}
                            >
                                {src ? <img alt="" src={src} /> : (p.name[0] || '?').toUpperCase()}
                            </span>
                            <span className={styles.name}>
                                {isDj ? `DJ ${p.name}` : p.name}
                                {p.spectate ? ' (watching)' : ''}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// ---------- cover flow: now and next, fading out ----------
export const CoverFlow = ({ hideNow, state }: { hideNow: boolean; state: GroupState }) => {
    const list = state.queue.slice(state.index, state.index + 7);
    if (!list.length) return null;
    return (
        <div className={styles.flow}>
            {list.map((song, i) => (
                <div
                    className={clsx(styles.flowItem, {
                        [styles.hostPick]:
                            i > 0 && (song.by || state.host) === state.host && !state.radio,
                    })}
                    key={`${song.id}-${i}`}
                    style={{
                        opacity: i === 0 ? 1 : Math.max(0.25, 1 - i * 0.14),
                        transform: `scale(${i === 0 ? 1 : 0.82})`,
                    }}
                    title={i === 0 && hideNow ? 'Blind round' : `${song.title} - ${song.artist}`}
                >
                    {i === 0 && hideNow ? (
                        <span className={styles.blindCover}>?</span>
                    ) : (
                        <SongCover size={i === 0 ? 92 : 64} song={song} />
                    )}
                </div>
            ))}
        </div>
    );
};

// ---------- encore, soundboard, tokens ----------
export const RoomActions = ({ state }: { state: GroupState }) => {
    const url = useHermesUrl();
    const code = useGroupPlayStore((s) => s.code);
    const role = useGroupPlayStore((s) => s.role);
    const userName = useGroupPlayStore((s) => s.userName);
    const sourMe = useSourStore((s) => s.me);
    if (!code) return null;
    // Hermes Music counts tokens per person: profile id, or the name for people without a profile
    const key = role === 'host' ? 'host' : sourMe?.id || userName.trim() || 'Guest';
    const tokens = state.tokens?.[key] ?? 3;
    return (
        <Stack gap={6}>
            <Group gap="xs" justify="space-between">
                <Button
                    onClick={() =>
                        groupApi
                            .encore(url, code, who())
                            .then(
                                (r) =>
                                    !r.happening &&
                                    toast.info({
                                        message: `Encore vote: ${r.votes} of ${r.needed}`,
                                    }),
                            )
                            .catch(fail)
                    }
                    size="xs"
                    variant="default"
                >
                    Encore! {state.encore ? `(${state.encore}/${state.encoreNeeded})` : ''}
                </Button>
                <Text isMuted size="xs">
                    {role !== 'host'
                        ? `${tokens} skip-the-line token${tokens === 1 ? '' : 's'} left`
                        : ''}
                </Text>
            </Group>
            <Soundboard code={code} url={url} />
        </Stack>
    );
};

// ---------- the soundboard: the built-in sounds and everyone's own (add one with +; whoever added a
// sound or an admin removes it with a right-click / long press) ----------
interface CustomSound {
    by: string;
    byName: string;
    emoji: string;
    id: string;
    name: string;
}

const readFile = (file: File) =>
    new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("couldn't read that file"));
        reader.readAsDataURL(file);
    });

const AddSound = ({ onDone, url }: { onDone: () => void; url: string }) => {
    const me = useSourStore((state) => state.me);
    const [name, setName] = useState('');
    const [emoji, setEmoji] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [busy, setBusy] = useState(false);
    const save = async () => {
        if (!file || !me) return;
        setBusy(true);
        try {
            const audio = await readFile(file);
            const res = await fetch(`${url}/api/sounds`, {
                body: JSON.stringify({
                    audio,
                    emoji,
                    key: me.key,
                    name: name || file.name,
                    profile: me.id,
                }),
                headers: { 'content-type': 'application/json' },
                method: 'POST',
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(json.error || 'Hermes Music said no');
            toast.success({ message: `${json.emoji} ${json.name} is on the soundboard` });
            onDone();
        } catch (error) {
            fail(error as Error);
        } finally {
            setBusy(false);
        }
    };
    return (
        <Stack gap="sm">
            <TextInput
                label="Name"
                maxLength={24}
                onChange={(e) => setName(e.currentTarget.value)}
                value={name}
            />
            <TextInput
                description="One emoji for its button"
                label="Emoji"
                maxLength={8}
                onChange={(e) => setEmoji(e.currentTarget.value)}
                value={emoji}
            />
            <input
                accept="audio/*"
                onChange={(e) => setFile(e.currentTarget.files?.[0] ?? null)}
                type="file"
            />
            <Text isMuted size="xs">
                A short clip (mp3, ogg, wav or m4a, up to 1 MB). Everyone in Group Play can play it.
            </Text>
            <Group justify="flex-end">
                <Button disabled={!file || busy} loading={busy} onClick={save} variant="filled">
                    Add sound
                </Button>
            </Group>
        </Stack>
    );
};

const Soundboard = ({ code, url }: { code: string; url: string }) => {
    const me = useSourStore((state) => state.me);
    const admin = !!useMyProfile().data?.perks?.includes('admin');
    useEffect(() => setSoundBase(url), [url]);
    const custom = useQuery({
        queryFn: async () =>
            (await fetch(`${url}/api/sounds`).then((r) => r.json())) as CustomSound[],
        queryKey: ['sour-sounds', url],
        refetchInterval: 60000,
    });
    const remove = async (sound: CustomSound) => {
        if (!me || (sound.by !== me.id && !admin)) return;
        if (!window.confirm(`Remove ${sound.emoji} ${sound.name} from the soundboard?`)) return;
        const res = await fetch(`${url}/api/sounds`, {
            body: JSON.stringify({ key: me.key, profile: me.id, remove: sound.id }),
            headers: { 'content-type': 'application/json' },
            method: 'POST',
        });
        if (!res.ok) fail(new Error((await res.json().catch(() => ({}))).error || 'Not removed'));
        custom.refetch();
    };
    const openAdd = () => {
        const id = `add-sound-${Date.now()}`;
        openModal({
            children: (
                <AddSound
                    onDone={() => {
                        closeModal(id);
                        custom.refetch();
                    }}
                    url={url}
                />
            ),
            modalId: id,
            title: 'Add a sound',
        });
    };
    return (
        <div className={styles.soundboard}>
            {SOUNDBOARD.map(([name, emoji]) => (
                <button
                    className={styles.sound}
                    key={name}
                    onClick={() => groupApi.sound(url, code, who(), name).catch(fail)}
                    title={name}
                    type="button"
                >
                    {emoji}
                </button>
            ))}
            {(custom.data ?? []).map((sound) => (
                <button
                    className={styles.sound}
                    key={sound.id}
                    onClick={() => groupApi.sound(url, code, who(), `c:${sound.id}`).catch(fail)}
                    onContextMenu={(e) => {
                        e.preventDefault();
                        remove(sound);
                    }}
                    title={`${sound.name} (added by ${sound.byName})`}
                    type="button"
                >
                    {sound.emoji}
                </button>
            ))}
            <button className={styles.sound} onClick={openAdd} title="Add a sound" type="button">
                +
            </button>
        </div>
    );
};

// ---------- theme night banner ----------
export const ThemeNightBanner = ({ state }: { state: GroupState }) => {
    if (!state.themeNight) return null;
    return <Text className={styles.theme}>Theme night: {themeLabel(state.themeNight)}</Text>;
};

// ---------- the request line (host) ----------
export const PendingRequests = ({ state }: { state: GroupState }) => {
    const url = useHermesUrl();
    const { code, hostKey } = useGroupPlayStore();
    if (!state.approval || !state.pending?.length || !code || !hostKey) return null;
    return (
        <Stack className={styles.pending} gap={4}>
            <Text fw={700} size="sm">
                Request line ({state.pending.length})
            </Text>
            {state.pending.map((r) => (
                <Group gap="xs" key={r.rid} wrap="nowrap">
                    <SongCover size={30} song={r.song} />
                    <Text flex={1} size="sm" truncate>
                        {r.song.title} - {r.by}
                    </Text>
                    <Button
                        onClick={() =>
                            groupApi.approve(url, code, hostKey, r.rid, true).catch(fail)
                        }
                        size="compact-xs"
                    >
                        Let it in
                    </Button>
                    <Button
                        onClick={() =>
                            groupApi.approve(url, code, hostKey, r.rid, false).catch(fail)
                        }
                        size="compact-xs"
                        variant="subtle"
                    >
                        No
                    </Button>
                </Group>
            ))}
        </Stack>
    );
};

// ---------- room settings: host (hosted groups) or owner/DJ (stations) ----------
export const RoomSettings = ({ isRadio, state }: { isRadio: boolean; state: GroupState }) => {
    const url = useHermesUrl();
    const { code, hostKey, member } = useGroupPlayStore();
    const [kind, setKind] = useState<string>(state.themeNight?.kind ?? 'decade');
    const [value, setValue] = useState<string>(
        state.themeNight?.value ? String(state.themeNight.value) : '1990',
    );
    if (!code) return null;
    const save = (changes: {
        approval?: boolean;
        blind?: boolean;
        roomTheme?: string;
        themeNight?: null | ThemeNight;
    }) =>
        (isRadio
            ? member
                ? groupApi.vibe(url, code, member, changes)
                : Promise.reject(new Error('join first'))
            : hostKey
              ? groupApi.settings(url, code, hostKey, changes)
              : Promise.reject(new Error('only the host can do that'))
        ).catch(fail);
    const night = (): null | ThemeNight => {
        if (kind === 'decade') {
            const year = Math.floor(Number(value) / 10) * 10;
            return Number.isFinite(year) && year >= 1900
                ? { kind: 'decade', label: null, value: year }
                : null;
        }
        if (kind === 'colour') return { kind: 'colour', label: null, value: null };
        return value.trim()
            ? {
                  kind: kind as ThemeNight['kind'],
                  label: kind === 'free' ? value.trim() : null,
                  value: value.trim(),
              }
            : null;
    };
    return (
        <Stack gap="xs">
            <Text fw={700} size="sm">
                The room
            </Text>
            <Select
                data={ROOM_THEMES}
                label="Room look"
                onChange={(v) => v && save({ roomTheme: v })}
                size="xs"
                value={state.roomTheme ?? 'none'}
            />
            <Switch
                checked={!!state.blind}
                description="Covers and titles stay hidden until a song is over - guess what's playing."
                label="Blind round"
                onChange={(e) => save({ blind: e.currentTarget.checked })}
            />
            {!isRadio && (
                <Switch
                    checked={!!state.approval}
                    description="Guests' picks wait for you to let them in."
                    label="Request line"
                    onChange={(e) => save({ approval: e.currentTarget.checked })}
                />
            )}
            <Group align="flex-end" gap="xs">
                <Select
                    data={[
                        { label: 'A decade', value: 'decade' },
                        { label: 'A word in the title', value: 'word' },
                        { label: 'One artist', value: 'artist' },
                        { label: 'A colour in the title', value: 'colour' },
                        { label: 'Anything else (just a name)', value: 'free' },
                    ]}
                    label="Theme night"
                    onChange={(v) => v && setKind(v)}
                    size="xs"
                    value={kind}
                    w={170}
                />
                {kind !== 'colour' && (
                    <TextInput
                        onChange={(e) => setValue(e.currentTarget.value)}
                        placeholder={
                            kind === 'decade' ? '1990' : kind === 'free' ? 'Sad songs only' : 'love'
                        }
                        size="xs"
                        value={value}
                        w={140}
                    />
                )}
                <Button onClick={() => save({ themeNight: night() })} size="xs" variant="default">
                    Set
                </Button>
                {state.themeNight && (
                    <Button onClick={() => save({ themeNight: null })} size="xs" variant="subtle">
                        Clear
                    </Button>
                )}
            </Group>
            {!isRadio && hostKey && (
                <Button
                    onClick={() => groupApi.countdown(url, code, hostKey).catch(fail)}
                    size="xs"
                    variant="default"
                    w="fit-content"
                >
                    Start with a 3-2-1 countdown
                </Button>
            )}
            <Button onClick={openScrapbook} size="xs" variant="subtle" w="fit-content">
                Scrapbook of past sessions
            </Button>
        </Stack>
    );
};

// ---------- 3, 2, 1 (everyone) ----------
export const CountdownOverlay = () => {
    const at = useGroupPlayStore((s) => s.countdownAt);
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        if (!at) return undefined;
        const timer = setInterval(() => setNow(Date.now()), 100);
        return () => clearInterval(timer);
    }, [at]);
    if (!at) return null;
    const left = Math.ceil((at - now) / 1000);
    if (left <= 0 || left > 5) return null;
    return (
        <div className={styles.countdown}>
            <span key={left}>{left}</span>
        </div>
    );
};

// ---------- blind round: hide what's playing for listeners ----------
export const BlindWatcher = () => {
    const blind = useGroupPlayStore(
        (s) => !!s.state?.blind && !s.state.ended && s.role === 'member',
    );
    useEffect(() => {
        document.documentElement.classList.toggle('sour-blind', blind);
        return () => document.documentElement.classList.remove('sour-blind');
    }, [blind]);
    return null;
};

// ---------- session summary and scrapbook ----------
const SummaryCard = ({ s }: { s: SessionSummary }) => (
    <div className={styles.summary}>
        <Text fw={800} size="lg">
            {s.name}
        </Text>
        <Text isMuted size="sm">
            {new Date(s.start).toLocaleDateString()} - {s.minutes} min together - {s.songs} songs
        </Text>
        <div className={styles.summaryGrid}>
            {s.topSong && (
                <div>
                    <SongCover size={56} song={s.topSong} />
                    <Text size="xs">Top song: {s.topSong.title}</Text>
                </div>
            )}
            <div>
                <Text fw={800} size="xl">
                    {s.topAdder ? s.topAdder.songs : 0}
                </Text>
                <Text size="xs">
                    {s.topAdder ? `${s.topAdder.name} added the most` : 'songs added'}
                </Text>
            </div>
            <div>
                <Text fw={800} size="xl">
                    {s.reactions}
                </Text>
                <Text size="xs">reactions</Text>
            </div>
            <div>
                <Text fw={800} size="xl">
                    {s.skips}
                </Text>
                <Text size="xs">skips</Text>
            </div>
        </div>
        <Text isMuted size="xs">
            With {s.people.join(', ')}
        </Text>
    </div>
);

export const openSessionSummary = (s: SessionSummary) =>
    openModal({ children: <SummaryCard s={s} />, title: 'Session over' });

const Scrapbook = () => {
    const url = useHermesUrl();
    const book = useQuery({
        enabled: !!url,
        queryFn: () => groupApi.scrapbook(url),
        queryKey: ['group-scrapbook', url],
    });
    return (
        <Stack gap="md">
            {(book.data ?? []).map((s) => (
                <SummaryCard key={s.id} s={s} />
            ))}
            {book.isFetched && !book.data?.length && <Text isMuted>No finished sessions yet.</Text>}
        </Stack>
    );
};

export const openScrapbook = () =>
    openModal({ children: <Scrapbook />, size: 'lg', title: 'Group Play scrapbook' });

// reactions pinned to moments in the song, as little emoji above the player bar's seek bar
export const GroupSeekMarks = ({ duration, songId }: { duration: number; songId?: string }) => {
    const marks = useGroupPlayStore((s) => (s.state && !s.state.ended ? s.state.marks : undefined));
    const mine = (marks ?? []).filter((m) => m.songId === songId);
    if (!duration || !mine.length) return null;
    return (
        <div className={styles.marks}>
            {mine.slice(-30).map((m, i) => (
                <span
                    className={styles.mark}
                    key={`${m.position}-${i}`}
                    style={{ left: `${Math.min(100, (m.position / duration) * 100)}%` }}
                    title={`${m.by} at ${Math.floor(m.position / 60)}:${String(Math.floor(m.position % 60)).padStart(2, '0')}`}
                >
                    {m.emoji}
                </span>
            ))}
        </div>
    );
};
