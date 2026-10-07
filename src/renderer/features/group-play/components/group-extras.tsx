import { openModal } from '@mantine/modals';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';

import styles from './group-extras.module.css';

import { api } from '/@/renderer/api';
import { groupApi } from '/@/renderer/features/group-play/api/group-play-api';
import { REACTIONS } from '/@/renderer/features/group-play/components/group-reactions';
import {
    type GroupSong,
    type GroupState,
    useGroupPlayStore,
} from '/@/renderer/features/group-play/store/group-play.store';
import { useHermesUrl } from '/@/renderer/features/hermes-video/store/hermes-video.store';
import { useSourStore } from '/@/renderer/features/sour/store/sour.store';
import { useCurrentServer } from '/@/renderer/store';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Button } from '/@/shared/components/button/button';
import { Group } from '/@/shared/components/group/group';
import { Select } from '/@/shared/components/select/select';
import { Stack } from '/@/shared/components/stack/stack';
import { Switch } from '/@/shared/components/switch/switch';
import { TextInput } from '/@/shared/components/text-input/text-input';
import { Text } from '/@/shared/components/text/text';
import { toast } from '/@/shared/components/toast/toast';

const who = () => {
    const { hostKey, member, role } = useGroupPlayStore.getState();
    return role === 'host' ? { hostKey } : { member };
};

// save songs as a playlist on the music server (Group Play sessions, blends)
export const saveAsPlaylist = async (serverId: string, name: string, songs: GroupSong[]) => {
    const created = await api.controller.createPlaylist({ apiClientProps: { serverId }, body: { name } });
    if (!created?.id) throw new Error("The music server didn't make the playlist");
    await api.controller.addToPlaylist({
        apiClientProps: { serverId },
        body: { songId: [...new Set(songs.map((s) => s.id))] },
        query: { id: created.id },
    });
    return created.id;
};

// ---------- chat ----------
export const GroupChat = ({ state }: { state: GroupState }) => {
    const url = useHermesUrl();
    const code = useGroupPlayStore((s) => s.code);
    const [text, setText] = useState('');
    const end = useRef<HTMLDivElement>(null);
    const messages = state.chat ?? [];
    useEffect(() => {
        end.current?.scrollIntoView({ block: 'nearest' });
    }, [messages.length]);
    const send = () => {
        if (!code || !text.trim()) return;
        groupApi
            .chat(url, code, who(), text)
            .then(() => setText(''))
            .catch((error: Error) => toast.error({ message: error.message }));
    };
    return (
        <Stack gap={6}>
            <Text fw={700} size="sm">
                Chat
            </Text>
            <div className={styles.chat}>
                {messages.map((m) => (
                    <Text key={m.id} size="sm">
                        <b>{m.by}</b> {m.text}
                    </Text>
                ))}
                {!messages.length && (
                    <Text isMuted size="xs">
                        Say hi.
                    </Text>
                )}
                <div ref={end} />
            </div>
            <TextInput
                onChange={(e) => setText(e.currentTarget.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') send();
                }}
                placeholder="Say something"
                size="xs"
                value={text}
            />
        </Stack>
    );
};

// ---------- reactions ----------
export const ReactionBar = () => {
    const url = useHermesUrl();
    const code = useGroupPlayStore((s) => s.code);
    return (
        <Group gap={4}>
            {REACTIONS.map((emoji) => (
                <button
                    className={styles.reactButton}
                    key={emoji}
                    onClick={() => code && groupApi.react(url, code, who(), emoji).catch(() => {})}
                    type="button"
                >
                    {emoji}
                </button>
            ))}
        </Group>
    );
};

// ---------- skip vote bar (stations) ----------
export const VoteBar = ({ state }: { state: GroupState }) => {
    const needed = state.votesNeeded || 1;
    const votes = state.votes || 0;
    return (
        <Stack gap={2}>
            <Group justify="space-between">
                <Text isMuted size="xs">
                    Skip vote
                </Text>
                <Text isMuted size="xs">
                    {votes} of {needed} needed
                </Text>
            </Group>
            <div className={styles.voteBar}>
                <div style={{ width: `${Math.min(100, (votes / needed) * 100)}%` }} />
            </div>
        </Stack>
    );
};

// ---------- host switches: DJ rotation, watch party, party mode, save the session ----------
export const HostTools = ({ state }: { state: GroupState }) => {
    const url = useHermesUrl();
    const { code, hostKey, played } = useGroupPlayStore();
    const serverId = useCurrentServer()?.id;
    const set = (changes: { djRotation?: boolean; watchVideo?: boolean }) =>
        code &&
        hostKey &&
        groupApi.settings(url, code, hostKey, changes).catch((error: Error) => toast.error({ message: error.message }));
    return (
        <Stack gap="xs">
            <Switch
                checked={!!state.djRotation}
                description="Everyone takes turns picking the next song."
                label="DJ rotation"
                onChange={(e) => set({ djRotation: e.currentTarget.checked })}
            />
            <Switch
                checked={!!state.watchVideo}
                description="Everyone's music video opens and plays along, when a song has one."
                label="Watch the videos together"
                onChange={(e) => set({ watchVideo: e.currentTarget.checked })}
            />
            <Group gap="xs">
                <Button onClick={openPartyMode} size="xs" variant="default">
                    Party mode
                </Button>
                <Button
                    disabled={!played.length || !serverId}
                    onClick={() =>
                        serverId &&
                        saveAsPlaylist(serverId, `${state.name} - ${new Date().toLocaleDateString()}`, played)
                            .then(() => toast.success({ message: `Saved ${played.length} songs as a playlist` }))
                            .catch((error: Error) => toast.error({ message: error.message }))
                    }
                    size="xs"
                    variant="default"
                >
                    Save session as playlist ({played.length})
                </Button>
            </Group>
        </Stack>
    );
};

// ---------- station tools: sleep timer, history, stats, DJ shows, guess game ----------
export const StationTools = ({ state }: { state: GroupState }) => {
    const url = useHermesUrl();
    const { code, member, sleepAt } = useGroupPlayStore();
    const me = useSourStore((s) => s.me);
    const [start, setStart] = useState('');
    const [minutes, setMinutes] = useState('60');
    const stats = useQuery({
        enabled: !!url && !!code,
        queryFn: () => groupApi.stats(url, code as string),
        queryKey: ['station-stats', url, code, state.index],
    });
    const upNext = state.queue.slice(state.index + 1).filter((s) => s.by === '?');
    const names = [...new Set([...state.members.map((m) => m.name)])];
    return (
        <Stack gap="sm">
            {state.station?.sleep && (
                <Group gap="xs">
                    <Text size="sm">Sleep timer:</Text>
                    {[30, 60, 90].map((m) => (
                        <Button
                            key={m}
                            onClick={() => useGroupPlayStore.setState({ sleepAt: Date.now() + m * 60000 })}
                            size="compact-xs"
                            variant="default"
                        >
                            {m} min
                        </Button>
                    ))}
                    {sleepAt && (
                        <Text isMuted size="xs">
                            stops at {new Date(sleepAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    )}
                </Group>
            )}
            <Switch
                checked={!!state.guess}
                description="Who added each requested song stays hidden until it plays. Guess right for a point."
                label="Who added this? (guessing game)"
                onChange={() =>
                    code &&
                    member &&
                    groupApi.control(url, code, member, 'guess').catch((error: Error) => toast.error({ message: error.message }))
                }
            />
            {state.guess && !!upNext.length && member && (
                <Stack gap={4}>
                    {upNext.slice(0, 3).map((s) => (
                        <Group gap="xs" key={s.id} wrap="nowrap">
                            <Text flex={1} size="xs" truncate>
                                {s.title}
                            </Text>
                            <Select
                                data={names}
                                onChange={(name) =>
                                    name && code && groupApi.guess(url, code, member, s.id, name).then(() => toast.info({ message: 'Guess saved' }))
                                }
                                placeholder="Who added it?"
                                size="xs"
                                w={150}
                            />
                        </Group>
                    ))}
                    {!!Object.keys(state.guessScores || {}).length && (
                        <Text isMuted size="xs">
                            Scores:{' '}
                            {Object.entries(state.guessScores || {})
                                .map(([n, p]) => `${n} ${p}`)
                                .join(', ')}
                        </Text>
                    )}
                </Stack>
            )}
            <Text fw={700} size="sm">
                DJ shows
            </Text>
            {state.show && (
                <Text size="sm">
                    Live now: <b>{state.show.name}</b> (until{' '}
                    {new Date(state.show.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                </Text>
            )}
            {(state.schedule ?? [])
                .filter((s) => s !== state.show)
                .slice(0, 5)
                .map((s) => (
                    <Group gap="xs" key={s.id}>
                        <Text size="xs">
                            {new Date(s.start).toLocaleString([], { hour: '2-digit', minute: '2-digit', weekday: 'short' })}{' '}
                            - {s.name}
                        </Text>
                        {me && s.profile === me.id && (
                            <Button
                                onClick={() => code && groupApi.schedule(url, code, { cancel: s.id, key: me.key, profile: me.id })}
                                size="compact-xs"
                                variant="subtle"
                            >
                                Cancel
                            </Button>
                        )}
                    </Group>
                ))}
            {me && (
                <Group gap="xs" wrap="nowrap">
                    <TextInput onChange={(e) => setStart(e.currentTarget.value)} size="xs" type="datetime-local" value={start} />
                    <Select
                        data={['30', '60', '90', '120', '180']}
                        onChange={(v) => setMinutes(v || '60')}
                        size="xs"
                        value={minutes}
                        w={80}
                    />
                    <Button
                        disabled={!start}
                        onClick={() =>
                            code &&
                            groupApi
                                .schedule(url, code, {
                                    key: me.key,
                                    member,
                                    minutes: Number(minutes),
                                    profile: me.id,
                                    start: new Date(start).getTime(),
                                })
                                .then(() => toast.success({ message: 'DJ show booked' }))
                                .catch((error: Error) => toast.error({ message: error.message }))
                        }
                        size="xs"
                        variant="default"
                    >
                        Book
                    </Button>
                </Group>
            )}
            {stats.data && (
                <>
                    <Text fw={700} size="sm">
                        Played before
                    </Text>
                    {stats.data.history.slice(0, 6).map((s, i) => (
                        <Text key={`${s.id}-${i}`} size="xs">
                            {s.title} - {s.artist} <span className={styles.muted}>({s.by})</span>
                        </Text>
                    ))}
                    {!!stats.data.songs.length && (
                        <Text isMuted size="xs">
                            Most played here: {stats.data.songs.slice(0, 3).map((s) => `${s.title} (${s.plays})`).join(', ')}
                        </Text>
                    )}
                    {!!stats.data.adders.length && (
                        <Text isMuted size="xs">
                            Adds the most: {stats.data.adders.slice(0, 3).map((a) => `${a.name} (${a.songs})`).join(', ')}
                        </Text>
                    )}
                </>
            )}
        </Stack>
    );
};

// ---------- played before you joined ----------
export const CatchUp = ({ state }: { state: GroupState }) => {
    const before = state.queue.slice(Math.max(0, state.index - 5), state.index).reverse();
    if (!before.length) return null;
    return (
        <Stack gap={2}>
            <Text fw={700} size="sm">
                Played before
            </Text>
            {before.map((s, i) => (
                <Text isMuted key={`${s.id}-${i}`} size="xs" truncate>
                    {s.title} - {s.artist}
                </Text>
            ))}
        </Stack>
    );
};

// ---------- start screen: your room and saved groups ----------
export const RoomAndSaved = ({ onStart }: { onStart: (name: string) => void }) => {
    const url = useHermesUrl();
    const me = useSourStore((s) => s.me);
    const saved = useSourStore((s) => s.savedGroups);
    const set = useSourStore((s) => s.set);
    const [roomName, setRoomName] = useState('');
    return (
        <Stack gap="xs">
            <Text fw={700}>Your room</Text>
            <Text isMuted size="sm">
                Your own always-on station: it keeps playing (random songs plus anything people add) even
                when you're not there. You can skip and remove songs in it.
            </Text>
            <Group gap="xs">
                <TextInput onChange={(e) => setRoomName(e.currentTarget.value)} placeholder="Room name" size="xs" value={roomName} />
                <Button
                    disabled={!me}
                    onClick={() =>
                        me &&
                        groupApi
                            .room(url, me.id, me.key, roomName)
                            .then((r) => toast.success({ message: `${r.name} is open (code ${r.code})` }))
                            .catch((error: Error) => toast.error({ message: error.message }))
                    }
                    size="xs"
                    variant="default"
                >
                    Open / rename my room
                </Button>
                <Button
                    disabled={!me}
                    onClick={() => me && groupApi.room(url, me.id, me.key, '', true).then(() => toast.info({ message: 'Room closed' }))}
                    size="xs"
                    variant="subtle"
                >
                    Close it
                </Button>
            </Group>
            {!!saved.length && (
                <>
                    <Text fw={700}>Saved groups</Text>
                    {saved.map((g) => (
                        <Group gap="xs" key={g.name}>
                            <Button onClick={() => onStart(g.name)} size="xs" variant="default">
                                Start {g.name}
                            </Button>
                            <ActionIcon
                                icon="x"
                                onClick={() => set({ savedGroups: saved.filter((x) => x !== g) })}
                                size="xs"
                                variant="subtle"
                            />
                        </Group>
                    ))}
                </>
            )}
        </Stack>
    );
};

// ---------- party mode: big screen for a TV ----------
const PartyMode = () => {
    const state = useGroupPlayStore((s) => s.state);
    const song = state?.queue[state.index];
    const next = state?.queue.slice(state.index + 1, state.index + 6) ?? [];
    return (
        <div className={styles.party}>
            <Text className={styles.partyCode}>{state?.code}</Text>
            <Text isMuted>Join in Sour Player: people icon &gt; type the code</Text>
            <Text className={styles.partyTitle}>{song?.title ?? 'Waiting for songs'}</Text>
            <Text size="xl">{song?.artist}</Text>
            <Text isMuted size="sm">
                {song?.by ? `added by ${song.by}` : ''} - {state ? state.members.length + (state.radio ? 0 : 1) : 0} listening
            </Text>
            <Stack gap={4} mt="xl">
                {next.map((s, i) => (
                    <Text key={`${s.id}-${i}`}>
                        {i + 1}. {s.title} - {s.artist}
                    </Text>
                ))}
            </Stack>
        </div>
    );
};
export const openPartyMode = () =>
    openModal({ children: <PartyMode />, fullScreen: true, title: 'Party mode' });

// remember a group's settings to start it again later
export const saveGroupSettings = (state: GroupState) => {
    const { savedGroups, set } = useSourStore.getState();
    set({
        savedGroups: [
            ...savedGroups.filter((g) => g.name !== state.name),
            { djRotation: !!state.djRotation, guestControl: state.guestControl, listed: state.listed, name: state.name },
        ].slice(-10),
    });
};
