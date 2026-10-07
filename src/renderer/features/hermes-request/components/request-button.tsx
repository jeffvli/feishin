import { openModal } from '@mantine/modals';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import styles from './request-button.module.css';

import { useGroupPlayStore } from '/@/renderer/features/group-play/store/group-play.store';
import { useHermesUrl } from '/@/renderer/features/hermes-video/store/hermes-video.store';
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
    by?: string;
    id: string;
    note?: string;
    pos?: number;
    query: string;
    status: string;
    title?: string;
    type: string;
}

type RequestType = 'album' | 'artist' | 'song';

const statusText = (r: HermesRequest) => {
    if (r.status === 'pending') return r.pos ? `Queued #${r.pos}` : 'Queued';
    if (r.status === 'working') return 'Downloading';
    if (r.status === 'done') return 'Added';
    if (r.status === 'failed') return 'Failed';
    return r.status;
};

// Ask Hermes Music for a song, album or artist without leaving Feishin; it downloads it into the
// music folder and it shows up in the library after the next scan.
const RequestPanel = () => {
    const url = useHermesUrl();
    const userName = useGroupPlayStore((state) => state.userName);
    const queryClient = useQueryClient();
    const [type, setType] = useState<RequestType>('song');
    const [query, setQuery] = useState('');
    const [busy, setBusy] = useState(false);

    const requests = useQuery({
        enabled: !!url,
        queryFn: async () => {
            const res = await fetch(`${url}/api/requests`);
            if (!res.ok) throw new Error(`Hermes Music returned ${res.status}`);
            return (await res.json()) as HermesRequest[];
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
        if (query.trim().length < 2) return;
        setBusy(true);
        try {
            const res = await fetch(`${url}/api/requests`, {
                body: JSON.stringify({ by: userName.trim() || undefined, query, type }),
                headers: { 'content-type': 'application/json' },
                method: 'POST',
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(json.error || `Hermes Music returned ${res.status}`);
            toast.success({ message: `Requested ${query.trim()}` });
            setQuery('');
            queryClient.invalidateQueries({ queryKey: ['hermes-requests', url] });
        } catch (error) {
            toast.error({ message: (error as Error).message });
        } finally {
            setBusy(false);
        }
    };

    const placeholder =
        type === 'song'
            ? 'Song and artist, e.g. mr brightside the killers'
            : type === 'album'
              ? 'Album name, e.g. hot fuss'
              : 'Artist name, e.g. the killers';

    return (
        <Stack gap="md">
            <SegmentedControl
                data={[
                    { label: 'Song', value: 'song' },
                    { label: 'Album', value: 'album' },
                    { label: 'Artist', value: 'artist' },
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
                <Button
                    disabled={busy || query.trim().length < 2}
                    onClick={send}
                    variant="filled"
                >
                    Request
                </Button>
            </Group>
            <Text isMuted size="xs">
                You can also paste a Spotify link. Downloaded songs show up in your library after
                Navidrome&#39;s next scan.
            </Text>
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

// Player bar: opens the request window.
export const RequestButton = () => (
    <ActionIcon
        icon="plus"
        iconProps={{ size: 'lg' }}
        onClick={(e) => {
            e.stopPropagation();
            openModal({ children: <RequestPanel />, size: 'lg', title: 'Request music' });
        }}
        size="sm"
        tooltip={{ label: 'Request music (Hermes Music)', openDelay: 0 }}
        variant="subtle"
    />
);
