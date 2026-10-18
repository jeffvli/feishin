import { closeModal, openModal } from '@mantine/modals';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { type ClipboardEvent, useState } from 'react';

import styles from './request-button.module.css';

import { useReactions } from '/@/renderer/features/group-play/components/group-reactions';
import { useGroupPlayStore } from '/@/renderer/features/group-play/store/group-play.store';
import {
    isCommand,
    requestCommand,
    runHermesCommand,
} from '/@/renderer/features/hermes-request/utils/hermes-commands';
import { openVideoWall } from '/@/renderer/features/hermes-video/components/music-video-button';
import { useHermesUrl } from '/@/renderer/features/hermes-video/store/hermes-video.store';
import { requestApi, type RequestGuess } from '/@/renderer/features/sour/api/sour-api';
import { RequestQuestion } from '/@/renderer/features/sour/components/request-question';
import { useSourStore } from '/@/renderer/features/sour/store/sour.store';
import { playSound } from '/@/renderer/features/sour/utils/sounds';
import { usePlayerSong } from '/@/renderer/store';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Button } from '/@/shared/components/button/button';
import { Group } from '/@/shared/components/group/group';
import { SegmentedControl } from '/@/shared/components/segmented-control/segmented-control';
import { Stack } from '/@/shared/components/stack/stack';
import { TextInput } from '/@/shared/components/text-input/text-input';
import { Text } from '/@/shared/components/text/text';
import { toast } from '/@/shared/components/toast/toast';

interface HermesRequest {
    artist?: string;
    ask?: RequestGuess;
    by?: string;
    id: string;
    note?: string;
    pos?: number;
    profile?: string;
    query: string;
    status: string;
    title?: string;
    type: string;
    voters?: string[];
    votes?: number;
}

// little surprises typed into the request box
const SECRETS: Record<string, () => void> = {
    '/disco': () => {
        document.body.classList.add('sour-disco');
        window.setTimeout(() => document.body.classList.remove('sour-disco'), 6000);
    },
    '/lemon': () => {
        for (let i = 0; i < 18; i++)
            window.setTimeout(() => useReactions.getState().add('🍋', ''), i * 120);
        playSound('lemon');
    },
    '/party': () => {
        const all = ['🎉', '🥳', '🎊', '✨', '🔥'];
        for (let i = 0; i < 24; i++)
            window.setTimeout(() => useReactions.getState().add(all[i % all.length], ''), i * 90);
        playSound('airhorn');
    },
    '/sour': () => {
        document.body.classList.add('sour-shake');
        window.setTimeout(() => document.body.classList.remove('sour-shake'), 900);
    },
};

type RequestType = 'album' | 'artist' | 'karaoke' | 'song';

const statusText = (r: HermesRequest) => {
    if (r.status === 'pending') return r.pos ? `Queued #${r.pos}` : 'Queued';
    if (r.status === 'working') return 'Downloading';
    if (r.status === 'done') return 'Added';
    if (r.status === 'failed') return 'Failed';
    if (r.status === 'ask') return 'Is this it?';
    return r.status;
};

const post = async <T,>(url: string, body: unknown) => {
    const res = await fetch(url, {
        body: JSON.stringify(body),
        headers: { 'content-type': 'application/json' },
        method: 'POST',
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || `Hermes Music returned ${res.status}`);
    return json as T;
};

// /video from Hermes Music: find (or replace) the music video for the song that's playing.
const MusicVideoTools = () => {
    const url = useHermesUrl();
    const song = usePlayerSong();
    const queryClient = useQueryClient();
    const [busy, setBusy] = useState(false);

    if (!song) return null;

    const run = (work: () => Promise<string>) => {
        setBusy(true);
        work()
            .then((message) => {
                toast.success({ message });
                queryClient.invalidateQueries({ queryKey: ['hermes-video'] });
            })
            .catch((error: Error) => toast.error({ message: error.message }))
            .finally(() => setBusy(false));
    };

    const find = () =>
        run(async () => {
            const r = await post<{ title: string }>(`${url}/api/videos`, {
                query: `${song.artistName} - ${song.name}`,
            });
            return `Found: ${r.title}. It lines up with the song in the background.`;
        });

    const wrong = () =>
        run(async () => {
            const r = await post<{ removed?: boolean; title?: string }>(`${url}/api/videos/wrong`, {
                artist: song.artistName,
                title: song.name,
            });
            if (r.removed) return 'No other video matches, so it was removed';
            return 'Trying the next video';
        });

    return (
        <div className={styles.tools}>
            <div className={styles.text}>
                <Text fw={700} size="sm">
                    Music video
                </Text>
                <Text isMuted size="xs" truncate>
                    {`${song.name} - ${song.artistName}`}
                </Text>
            </div>
            <Button disabled={busy} onClick={find} size="xs" variant="default">
                Find video
            </Button>
            <Button disabled={busy} onClick={wrong} size="xs" variant="subtle">
                Wrong video
            </Button>
            <Button
                disabled={busy}
                onClick={() => openVideoLink(url, `${song.artistName} - ${song.name}`)}
                size="xs"
                variant="subtle"
            >
                Add link
            </Button>
        </div>
    );
};

// "Add link": the song (artist - title) and the YouTube link of its music video, when the search
// can't find it or picks the wrong one
const VideoLinkForm = ({
    initialSong,
    onDone,
    url,
}: {
    initialSong: string;
    onDone: () => void;
    url: string;
}) => {
    const [song, setSong] = useState(initialSong);
    const [link, setLink] = useState('');
    const [busy, setBusy] = useState(false);
    const queryClient = useQueryClient();
    const save = async () => {
        if (!song.trim() || !link.trim()) return;
        setBusy(true);
        try {
            const r = await post<{ artist?: string; song?: string; title: string }>(
                `${url}/api/videos`,
                {
                    query: `${song.trim()} | ${link.trim()}`,
                },
            );
            toast.success({
                message: `Music video added for ${r.artist ? `${r.artist} - ${r.song}` : song.trim()}`,
            });
            queryClient.invalidateQueries({ queryKey: ['hermes-video'] });
            onDone();
        } catch (error) {
            toast.error({ message: (error as Error).message });
        } finally {
            setBusy(false);
        }
    };
    return (
        <Stack gap="sm">
            <TextInput
                description="As it is in your library, e.g. Sanco the Fox - The Lion's Mouth"
                label="Song (artist - title)"
                onChange={(e) => setSong(e.currentTarget.value)}
                value={song}
            />
            <TextInput
                label="YouTube link"
                onChange={(e) => setLink(e.currentTarget.value)}
                onKeyDown={(e) => e.key === 'Enter' && save()}
                placeholder="https://www.youtube.com/watch?v=..."
                value={link}
            />
            <Group justify="flex-end">
                <Button
                    disabled={busy || !song.trim() || !link.trim()}
                    loading={busy}
                    onClick={save}
                    variant="filled"
                >
                    Add video
                </Button>
            </Group>
        </Stack>
    );
};

export const openVideoLink = (url: string, song = '') => {
    const id = `video-link-${Date.now()}`;
    openModal({
        children: <VideoLinkForm initialSong={song} onDone={() => closeModal(id)} url={url} />,
        modalId: id,
        title: 'Add a music video',
    });
};

// Ask Hermes Music for a song, album or artist without leaving Sour Player; it downloads it into
// the music folder and it shows up in the library after the next scan.
const RequestPanel = () => {
    const url = useHermesUrl();
    const userName = useGroupPlayStore((state) => state.userName);
    const queryClient = useQueryClient();
    const me = useSourStore((state) => state.me);
    const [type, setType] = useState<RequestType>('song');
    const [log, setLog] = useState<{ kind: string; text: string }[]>([]);
    const [query, setQuery] = useState('');
    const [busy, setBusy] = useState(false);

    const requests = useQuery({
        enabled: !!url,
        queryFn: async () => {
            const res = await fetch(`${url}/api/requests`);
            if (!res.ok) throw new Error(`Hermes Music returned ${res.status}`);
            const list = await res.json().catch(() => null);
            if (!Array.isArray(list)) {
                throw new Error("That address doesn't answer like Hermes Music");
            }
            return list as HermesRequest[];
        },
        queryKey: ['hermes-requests', url],
        refetchInterval: 4000,
    });

    if (!url) {
        return (
            <Text isMuted>
                Requests go to Hermes Music. Add its address in Settings &gt; General &gt; Music
                videos first.
            </Text>
        );
    }

    const send = async () => {
        const secret = SECRETS[query.trim().toLowerCase()];
        if (secret) {
            secret();
            setQuery('');
            return;
        }
        if (query.trim().length < 2) return;
        // Hermes Music's commands (/help lists them); /album, /artist and /karaoke are requests
        let sendQuery = query.trim();
        let sendType: RequestType = type;
        const typed = requestCommand(sendQuery);
        if (typed) {
            sendQuery = typed.query;
            sendType = typed.type;
        } else if (isCommand(sendQuery)) {
            setBusy(true);
            setLog([{ kind: 'echo', text: sendQuery }]);
            setQuery('');
            await runHermesCommand(url, sendQuery, (text, kind = 'info') =>
                setLog((lines) => [...lines, { kind, text }].slice(-80)),
            );
            setBusy(false);
            queryClient.invalidateQueries({ queryKey: ['hermes-requests', url] });
            return;
        }
        if (sendQuery.length < 2) return;
        setBusy(true);
        try {
            const res = await fetch(`${url}/api/requests`, {
                body: JSON.stringify({
                    by: userName.trim() || undefined,
                    profile: me?.id,
                    query: sendQuery,
                    type: sendType,
                }),
                headers: { 'content-type': 'application/json' },
                method: 'POST',
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(json.error || `Hermes Music returned ${res.status}`);
            toast.success({
                message: json.imported
                    ? `Requested ${json.imported} playlists from that profile`
                    : `Requested ${sendQuery}`,
            });
            setQuery('');
            queryClient.invalidateQueries({ queryKey: ['hermes-requests', url] });
        } catch (error) {
            toast.error({ message: (error as Error).message });
        } finally {
            setBusy(false);
        }
    };

    // upvote a waiting request: the most-wanted download first
    const vote = (r: HermesRequest) => {
        if (!me) return;
        requestApi
            .vote(url, me, r.id)
            .then(() => queryClient.invalidateQueries({ queryKey: ['hermes-requests', url] }))
            .catch((error: Error) => toast.error({ message: error.message }));
    };

    // paste a screenshot of a playlist: Hermes Music reads the songs and queues them all
    const onPaste = (e: ClipboardEvent) => {
        const file = [...e.clipboardData.files].find((f) => f.type.startsWith('image/'));
        if (!file) return;
        e.preventDefault();
        const reader = new FileReader();
        reader.onload = () => {
            setBusy(true);
            toast.info({ message: 'Reading the songs in that screenshot...' });
            requestApi
                .screenshot(url, String(reader.result), me, userName.trim() || 'Sour Player')
                .then((r) => {
                    toast.success({ message: `Queued ${r.queued} songs from the screenshot` });
                    queryClient.invalidateQueries({ queryKey: ['hermes-requests', url] });
                })
                .catch((error: Error) => toast.error({ message: error.message }))
                .finally(() => setBusy(false));
        };
        reader.readAsDataURL(file);
    };

    // /bump from Hermes Music: move a queued request to the front
    const bump = (r: HermesRequest) => {
        if (!r.pos) return;
        post<{ name: string }>(`${url}/api/now`, { pos: r.pos })
            .then((res) => {
                toast.success({ message: `${res.name} is next` });
                queryClient.invalidateQueries({ queryKey: ['hermes-requests', url] });
            })
            .catch((error: Error) => toast.error({ message: error.message }));
    };

    const placeholder =
        type === 'song'
            ? 'Song and artist, e.g. mr brightside the killers'
            : type === 'album'
              ? 'Album name, e.g. hot fuss'
              : type === 'karaoke'
                ? 'The song to sing along to, e.g. toby fox hotel (gets its instrumental)'
                : 'Artist name, e.g. the killers';

    return (
        <Stack gap="md" onPaste={onPaste}>
            <SegmentedControl
                data={[
                    { label: 'Song', value: 'song' },
                    { label: 'Album', value: 'album' },
                    { label: 'Artist', value: 'artist' },
                    { label: 'Karaoke', value: 'karaoke' },
                ]}
                onChange={(value) => setType(value as RequestType)}
                value={type}
            />
            <Group gap="xs" wrap="nowrap">
                <TextInput
                    autoFocus
                    flex={1}
                    onChange={(e) => setQuery(e.currentTarget.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') send();
                    }}
                    placeholder={placeholder}
                    value={query}
                />
                <Button disabled={busy || query.trim().length < 2} onClick={send} variant="filled">
                    Request
                </Button>
            </Group>
            <Text isMuted size="xs">
                You can also paste a Spotify, YouTube or YouTube Music link (song, album or
                playlist), a Spotify profile or YouTube channel link (all its public playlists), or
                a screenshot of a playlist (Ctrl+V). Hermes Music&#39;s commands work here too: type
                /help. Downloaded songs show up after Navidrome&#39;s next scan.
            </Text>
            {log.length > 0 && (
                <div className={styles.log}>
                    {log.map((line, i) => (
                        <div
                            className={
                                styles[`log${line.kind[0].toUpperCase()}${line.kind.slice(1)}`] ||
                                styles.logLine
                            }
                            key={i}
                        >
                            {line.kind === 'echo' ? `> ${line.text}` : line.text}
                        </div>
                    ))}
                </div>
            )}
            <Button onClick={openVideoWall} size="xs" variant="default" w="fit-content">
                Video wall
            </Button>
            <MusicVideoTools />
            <Stack gap={4}>
                <Text fw={700} size="sm">
                    Recent requests
                </Text>
                <div className={styles.list}>
                    {(requests.data ?? []).slice(0, 20).map((r) => (
                        <div className={styles.row} key={r.id}>
                            <span className={styles.type}>{r.type}</span>
                            <div className={styles.text}>
                                <Text fw={600} size="sm" truncate>
                                    {r.title || r.query}
                                </Text>
                                <Text isMuted size="xs" truncate>
                                    {[r.artist, r.by && `asked by ${r.by}`, r.note]
                                        .filter(Boolean)
                                        .join(' - ')}
                                </Text>
                            </div>
                            <span className={styles[r.status] || styles.status}>
                                {statusText(r)}
                            </span>
                            {r.status === 'pending' && me && (
                                <button
                                    className={
                                        r.voters?.includes(me.id) ? styles.voted : styles.vote
                                    }
                                    onClick={() => vote(r)}
                                    title="Upvote: most-wanted downloads first"
                                    type="button"
                                >
                                    &#9650; {r.votes ?? 0}
                                </button>
                            )}
                            {r.status === 'ask' && r.ask && (
                                <div className={styles.ask}>
                                    <RequestQuestion ask={r.ask} id={r.id} />
                                </div>
                            )}
                            {r.status === 'pending' && !!r.pos && r.pos > 1 && (
                                <ActionIcon
                                    icon="arrowUpToLine"
                                    onClick={() => bump(r)}
                                    size="sm"
                                    tooltip={{ label: 'Move to the front' }}
                                    variant="subtle"
                                />
                            )}
                        </div>
                    ))}
                    {requests.isError && (
                        <Text isMuted p="sm" size="sm">
                            Couldn&#39;t reach Hermes Music.
                        </Text>
                    )}
                </div>
            </Stack>
        </Stack>
    );
};

export const openRequestWindow = () =>
    openModal({ children: <RequestPanel />, size: 'lg', title: 'Request music' });

// Player bar: opens the request window.
export const RequestButton = () => (
    <ActionIcon
        icon="plus"
        iconProps={{ size: 'lg' }}
        onClick={(e) => {
            e.stopPropagation();
            openRequestWindow();
        }}
        size="sm"
        tooltip={{ label: 'Request music (Hermes Music)', openDelay: 0 }}
        variant="subtle"
    />
);
