import { openModal } from '@mantine/modals';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import packageJson from '../../../../../package.json';
import styles from './feedback.module.css';

import { useHermesUrl } from '/@/renderer/features/hermes-video/store/hermes-video.store';
import { timeAgo } from '/@/renderer/features/sour/api/sour-api';
import { useSourStore } from '/@/renderer/features/sour/store/sour.store';
import { Button } from '/@/shared/components/button/button';
import { Group } from '/@/shared/components/group/group';
import { SegmentedControl } from '/@/shared/components/segmented-control/segmented-control';
import { Stack } from '/@/shared/components/stack/stack';
import { Textarea } from '/@/shared/components/textarea/textarea';
import { Text } from '/@/shared/components/text/text';
import { toast } from '/@/shared/components/toast/toast';

interface Report {
    at: number;
    byName: string;
    done: boolean;
    id: string;
    kind: 'bug' | 'idea';
    platform?: string;
    text: string;
    version?: string;
}

const platform = () => {
    const ua = navigator.userAgent;
    if (/android/i.test(ua)) return 'Android';
    if (/mac/i.test(ua)) return 'macOS';
    if (/linux/i.test(ua)) return 'Linux';
    if (/windows/i.test(ua)) return 'Windows';
    return 'other';
};

// Report a bug or suggest something: it goes to Hermes Music, where the admins read it.
const FeedbackForm = ({ onDone }: { onDone: () => void }) => {
    const url = useHermesUrl();
    const me = useSourStore((state) => state.me);
    const [kind, setKind] = useState<'bug' | 'idea'>('bug');
    const [text, setText] = useState('');
    const [busy, setBusy] = useState(false);
    const send = async () => {
        if (!me) return;
        setBusy(true);
        try {
            const res = await fetch(`${url}/api/feedback`, {
                body: JSON.stringify({
                    key: me.key,
                    kind,
                    platform: platform(),
                    profile: me.id,
                    text,
                    version: packageJson.version,
                }),
                headers: { 'content-type': 'application/json' },
                method: 'POST',
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(json.error || `Hermes Music returned ${res.status}`);
            toast.success({ message: kind === 'bug' ? 'Bug reported - thanks!' : 'Suggestion sent - thanks!' });
            onDone();
        } catch (error) {
            toast.error({ message: (error as Error).message });
        } finally {
            setBusy(false);
        }
    };
    if (!url || !me) {
        return <Text isMuted>Reports go through Hermes Music: set its address first.</Text>;
    }
    return (
        <Stack gap="sm">
            <SegmentedControl
                data={[
                    { label: 'Something is broken', value: 'bug' },
                    { label: 'I have an idea', value: 'idea' },
                ]}
                onChange={(v) => setKind(v as 'bug' | 'idea')}
                value={kind}
            />
            <Textarea
                autosize
                maxLength={2000}
                minRows={4}
                onChange={(e) => setText(e.currentTarget.value)}
                placeholder={
                    kind === 'bug'
                        ? 'What happened, and what were you doing? (e.g. the mini player covers my whole screen on Linux)'
                        : 'What would make Sour Player better?'
                }
                value={text}
            />
            <Group justify="flex-end">
                <Button
                    disabled={busy || text.trim().length < 3}
                    onClick={send}
                    variant="filled"
                >
                    Send
                </Button>
            </Group>
        </Stack>
    );
};

export const openFeedback = () => {
    const id = 'sour-feedback';
    openModal({
        children: (
            <FeedbackForm
                onDone={() => import('@mantine/modals').then((m) => m.closeModal(id))}
            />
        ),
        modalId: id,
        title: 'Report a bug or suggest something',
    });
};

// Admins: every report and suggestion, newest first; tick them off when they're dealt with.
const Reports = () => {
    const url = useHermesUrl();
    const me = useSourStore((state) => state.me);
    const queryClient = useQueryClient();
    const [show, setShow] = useState<'all' | 'bug' | 'idea' | 'open'>('open');
    const list = useQuery({
        enabled: !!url && !!me,
        queryFn: async () => {
            const res = await fetch(
                `${url}/api/feedback?profile=${encodeURIComponent(me?.id || '')}&key=${encodeURIComponent(me?.key || '')}`,
            );
            const json = await res.json().catch(() => null);
            if (!res.ok) throw new Error(json?.error || `Hermes Music returned ${res.status}`);
            return (Array.isArray(json) ? json : []) as Report[];
        },
        queryKey: ['sour-feedback', url],
    });
    const change = async (report: Report, changes: { done?: boolean; remove?: boolean }) => {
        if (!me) return;
        await fetch(`${url}/api/feedback`, {
            body: JSON.stringify({ id: report.id, key: me.key, profile: me.id, ...changes }),
            headers: { 'content-type': 'application/json' },
            method: 'POST',
        }).catch(() => null);
        queryClient.invalidateQueries({ queryKey: ['sour-feedback', url] });
    };
    const shown = (list.data ?? []).filter((r) =>
        show === 'all' ? true : show === 'open' ? !r.done : r.kind === show,
    );
    return (
        <Stack gap="sm">
            <SegmentedControl
                data={[
                    { label: 'Open', value: 'open' },
                    { label: 'Bugs', value: 'bug' },
                    { label: 'Ideas', value: 'idea' },
                    { label: 'All', value: 'all' },
                ]}
                onChange={(v) => setShow(v as typeof show)}
                value={show}
            />
            {list.error && <Text isMuted>{(list.error as Error).message}</Text>}
            {shown.map((r) => (
                <div className={r.done ? styles.doneReport : styles.report} key={r.id}>
                    <Group gap="xs" justify="space-between" wrap="nowrap">
                        <Text fw={700} size="sm">
                            {r.kind === 'bug' ? 'Bug' : 'Idea'} from {r.byName}
                        </Text>
                        <Text isMuted size="xs">
                            {[timeAgo(r.at), r.platform, r.version && `v${r.version}`]
                                .filter(Boolean)
                                .join(' - ')}
                        </Text>
                    </Group>
                    <Text className={styles.text} size="sm">
                        {r.text}
                    </Text>
                    <Group gap="xs" justify="flex-end">
                        <Button
                            onClick={() => change(r, { done: !r.done })}
                            size="compact-xs"
                            variant={r.done ? 'default' : 'filled'}
                        >
                            {r.done ? 'Reopen' : 'Done'}
                        </Button>
                        <Button
                            onClick={() => change(r, { remove: true })}
                            size="compact-xs"
                            variant="subtle"
                        >
                            Delete
                        </Button>
                    </Group>
                </div>
            ))}
            {list.isFetched && !shown.length && <Text isMuted>Nothing here.</Text>}
        </Stack>
    );
};

export const openReports = () =>
    openModal({ children: <Reports />, size: 'lg', title: 'Bug reports and suggestions' });
