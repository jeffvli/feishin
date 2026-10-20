import { closeAllModals, openModal } from '@mantine/modals';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { create } from 'zustand';

import styles from './sour-tv.module.css';

import { useItemImageUrl } from '/@/renderer/components/item-image/item-image';
import { groupApi } from '/@/renderer/features/group-play/api/group-play-api';
import { useGroupPlayStore } from '/@/renderer/features/group-play/store/group-play.store';
import { useHermesUrl } from '/@/renderer/features/hermes-video/store/hermes-video.store';
import { lyricsQueries } from '/@/renderer/features/lyrics/api/lyrics-api';
import { ProfileAvatar } from '/@/renderer/features/sour/components/profile-bits';
import { toLines } from '/@/renderer/features/sour/stage/sour-stage';
import {
    useMyProfile,
    useSourProfiles,
    useSourStore,
} from '/@/renderer/features/sour/store/sour.store';
import { leaveListenAlongFirst } from '/@/renderer/features/sour/utils/switching';
import { usePlayerSong } from '/@/renderer/store';
import { usePlayerStoreBase } from '/@/renderer/store/player.store';
import { useTimestampStoreBase } from '/@/renderer/store/timestamp.store';
import { Button } from '/@/shared/components/button/button';
import { Icon } from '/@/shared/components/icon/icon';
import { Stack } from '/@/shared/components/stack/stack';
import { TextInput } from '/@/shared/components/text-input/text-input';
import { Text } from '/@/shared/components/text/text';
import { toast } from '/@/shared/components/toast/toast';
import { LibraryItem } from '/@/shared/types/domain-types';
import { type QueueSong } from '/@/shared/types/domain-types';
import { PlayerStatus } from '/@/shared/types/types';

// Sour Player TV: an admin's phone, mirrored to the TV (Screen Mirroring / AirPlay on iPhone, Cast
// screen on Android), runs Group Play for an in-person event. Only people the admin adds are in it;
// everyone else sees "Listening to ... on Sour Player TV - <event>" and can't join or listen along.
export const useSourTv = create<{ lyrics: boolean; open: boolean }>(() => ({
    lyrics: true,
    open: false,
}));

export const isTvHost = () => {
    const { role, state } = useGroupPlayStore.getState();
    return role === 'host' && !!state?.tv && !state.ended;
};

const StartTv = () => {
    const url = useHermesUrl();
    const me = useSourStore((state) => state.me);
    const profile = useMyProfile().data;
    const [event, setEvent] = useState('');
    const [busy, setBusy] = useState(false);
    const start = async () => {
        if (!me || !profile) return;
        if (!(await leaveListenAlongFirst())) return;
        setBusy(true);
        try {
            const res = await groupApi.create(url, event.trim() || 'Party', profile.name, me.id, {
                event: event.trim() || 'Party',
                key: me.key,
            });
            const player = usePlayerStoreBase.getState();
            player.mediaStop();
            player.clearQueue();
            const { actions } = useGroupPlayStore.getState();
            actions.setSession({ code: res.code, hostKey: res.hostKey, role: 'host' });
            actions.setState(res.state);
            closeAllModals();
            useSourTv.setState({ open: true });
        } catch (error) {
            toast.error({ message: (error as Error).message });
        } finally {
            setBusy(false);
        }
    };
    return (
        <Stack gap="md">
            <Text size="sm">
                Put this phone on the TV first: on iPhone, Control Center &gt; Screen Mirroring; on
                Android, Quick Settings &gt; Cast (or Screen Cast) and pick the Chromecast or TV.
            </Text>
            <TextInput
                autoFocus
                label="Event name"
                maxLength={60}
                onChange={(e) => setEvent(e.currentTarget.value)}
                onKeyDown={(e) => e.key === 'Enter' && start()}
                placeholder="Friday Night Hangout"
                value={event}
            />
            <Text isMuted size="xs">
                Friends who aren&#39;t there see what&#39;s playing, but can&#39;t join or listen
                along. Add the people who are there from the TV screen.
            </Text>
            <Button loading={busy} onClick={start} variant="filled">
                Start Sour Player TV
            </Button>
        </Stack>
    );
};

export const openSourTv = () => {
    if (isTvHost()) {
        useSourTv.setState({ open: true });
        return;
    }
    openModal({ children: <StartTv />, title: 'Sour Player TV' });
};

// the people at the event: add them so they're in the party (their profile shows it, they can add songs)
const AddMembers = () => {
    const url = useHermesUrl();
    const profiles = useSourProfiles().data ?? [];
    const state = useGroupPlayStore((s) => s.state);
    const hostKey = useGroupPlayStore((s) => s.hostKey);
    const [q, setQ] = useState('');
    const members = new Set(state?.tv?.members ?? []);
    const shown = profiles
        .filter((p) => p.name.toLowerCase().includes(q.trim().toLowerCase()))
        .sort(
            (a, b) =>
                Number(members.has(b.id)) - Number(members.has(a.id)) ||
                a.name.localeCompare(b.name),
        );
    const toggle = (id: string) => {
        if (!state || !hostKey) return;
        groupApi
            .tvMember(url, state.code, hostKey, members.has(id) ? { remove: id } : { add: id })
            .catch((error: Error) => toast.error({ message: error.message }));
    };
    return (
        <Stack gap="sm">
            <TextInput
                leftSection={<Icon icon="search" />}
                onChange={(e) => setQ(e.currentTarget.value)}
                placeholder="Find someone"
                value={q}
            />
            <div className={styles.people}>
                {shown.map((p) => {
                    const here = members.has(p.id);
                    const isHost = p.id === state?.hostProfile;
                    return (
                        <button
                            className={here ? styles['person-here'] : styles.person}
                            disabled={isHost}
                            key={p.id}
                            onClick={() => toggle(p.id)}
                            type="button"
                        >
                            <ProfileAvatar profile={p} size={40} />
                            <Text fw={600} size="sm" truncate>
                                {p.name}
                            </Text>
                            <Text className={styles['person-state']} size="xs">
                                {isHost ? 'Host' : here ? 'Here' : 'Add'}
                            </Text>
                        </button>
                    );
                })}
            </div>
        </Stack>
    );
};

// above the TV screen (it covers everything else)
const openAddMembers = () =>
    openModal({ children: <AddMembers />, title: 'Who is here?', zIndex: 500 });

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

// the line being sung, big, with the next one under it (synced lyrics only)
const TvLyrics = ({ song, time }: { song: QueueSong | undefined; time: number }) => {
    const { data } = useQuery(
        lyricsQueries.songLyrics(
            {
                options: { enabled: !!song?.id },
                query: { songId: song?.id || '' },
                serverId: song?._serverId || '',
            },
            song,
        ),
    );
    const selected = data?.selected as null | undefined | { lyrics?: unknown };
    const { lines, synced } = useMemo(() => toLines(selected?.lyrics), [selected]);
    if (!synced || !lines.length) return null;
    const nowMs = time * 1000 + (data?.selectedOffsetMs ?? 0);
    let current = -1;
    for (let i = 0; i < lines.length; i++) if (lines[i].startMs <= nowMs + 150) current = i;
    return (
        <div className={styles.lyrics}>
            <div className={styles['lyric-now']} key={current}>
                {current >= 0 ? lines[current].text || '...' : '...'}
            </div>
            <div className={styles['lyric-next']}>{lines[current + 1]?.text || ''}</div>
        </div>
    );
};

// The TV screen: big and readable from the couch, landscape or portrait
export const SourTvScreen = () => {
    const open = useSourTv((s) => s.open);
    const showLyrics = useSourTv((s) => s.lyrics);
    const state = useGroupPlayStore((s) => s.state);
    const role = useGroupPlayStore((s) => s.role);
    const song = usePlayerSong();
    const status = usePlayerStoreBase((s) => s.player.status);
    const time = useTimestampStoreBase((s) => s.timestamp);
    const profiles = useSourProfiles().data ?? [];
    // the cover the way the rest of the app gets it (from the music server, big enough for a TV)
    const cover =
        useItemImageUrl({
            id: song?.imageId,
            imageUrl: song?.imageUrl,
            itemType: LibraryItem.SONG,
            serverId: song?._serverId,
            size: 800,
        }) || null;
    const [clock, setClock] = useState(() => new Date());
    useEffect(() => {
        if (!open) return undefined;
        const t = window.setInterval(() => setClock(new Date()), 15000);
        return () => window.clearInterval(t);
    }, [open]);
    // the party ended (or this phone left it): the TV screen goes too
    useEffect(() => {
        if (open && (!state?.tv || state.ended || role !== 'host'))
            useSourTv.setState({ open: false });
    }, [open, role, state]);
    const here = profiles.filter((p) => state?.tv?.members.includes(p.id));
    if (!open || !state?.tv) return null;
    const upNext = state.queue.slice(state.index + 1, state.index + 4);
    const duration = song?.duration ? song.duration / 1000 : 0;
    const player = usePlayerStoreBase.getState();
    return (
        <div className={styles.tv}>
            {cover && (
                <div className={styles.backdrop} style={{ backgroundImage: `url("${cover}")` }} />
            )}
            <header className={styles.top}>
                <div>
                    <div className={styles.brand}>Sour Player TV</div>
                    <div className={styles.event}>{state.tv.event}</div>
                </div>
                <div className={styles.clock}>
                    {clock.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                </div>
            </header>
            <main className={styles.main}>
                <div className={styles.cover}>
                    {cover ? <img alt="" src={cover} /> : <Icon icon="itemAlbum" size="5rem" />}
                </div>
                <div className={styles.info}>
                    <div className={styles.title}>{song?.name || 'Add a song to start'}</div>
                    <div className={styles.artist}>{song?.artistName || ''}</div>
                    {!!song && (
                        <>
                            <div className={styles.bar}>
                                <span
                                    style={{
                                        width: `${duration ? Math.min(100, (time / duration) * 100) : 0}%`,
                                    }}
                                />
                            </div>
                            <div className={styles.times}>
                                <span>{fmt(time)}</span>
                                <span>{duration ? fmt(duration) : ''}</span>
                            </div>
                        </>
                    )}
                    {showLyrics && <TvLyrics song={song} time={time} />}
                    {!!upNext.length && (
                        <div className={styles.next}>
                            <div className={styles.label}>Up next</div>
                            {upNext.map((x) => (
                                <div className={styles['next-row']} key={x.id}>
                                    <span>{x.title}</span>
                                    <span className={styles.dim}>
                                        {x.artist}
                                        {x.by ? ` - ${x.by}` : ''}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
            <footer className={styles.bottom}>
                <div className={styles.faces}>
                    {here.slice(0, 12).map((p) => (
                        <span key={p.id} title={p.name}>
                            <ProfileAvatar profile={p} size={34} />
                        </span>
                    ))}
                    {here.length > 12 && <span className={styles.dim}>+{here.length - 12}</span>}
                </div>
                <div className={styles.controls}>
                    <button onClick={() => player.mediaPrevious(false)} type="button">
                        <Icon icon="mediaPrevious" size="lg" />
                    </button>
                    <button
                        className={styles.play}
                        onClick={() => player.mediaTogglePlayPause()}
                        type="button"
                    >
                        <Icon
                            icon={status === PlayerStatus.PLAYING ? 'mediaPause' : 'mediaPlay'}
                            size="xl"
                        />
                    </button>
                    <button onClick={() => player.mediaNext(false)} type="button">
                        <Icon icon="mediaNext" size="lg" />
                    </button>
                </div>
                <div className={styles.actions}>
                    <button
                        onClick={() => {
                            useSourTv.setState({ open: false });
                            useGroupPlayStore.setState({ panelOpen: true });
                        }}
                        type="button"
                    >
                        <Icon icon="queue" /> Group Play
                    </button>
                    <button
                        onClick={() => useSourTv.setState({ lyrics: !showLyrics })}
                        type="button"
                    >
                        <Icon icon="microphone" /> {showLyrics ? 'Hide lyrics' : 'Lyrics'}
                    </button>
                    <button onClick={openAddMembers} type="button">
                        <Icon icon="add" /> Add member
                    </button>
                    <button onClick={() => useSourTv.setState({ open: false })} type="button">
                        <Icon icon="x" />
                    </button>
                </div>
            </footer>
        </div>
    );
};
