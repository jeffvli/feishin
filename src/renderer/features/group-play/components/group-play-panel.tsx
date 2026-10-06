import { closeAllModals } from '@mantine/modals';
import { useState } from 'react';

import styles from './group-play-panel.module.css';

import { groupApi } from '/@/renderer/features/group-play/api/group-play-api';
import {
    useGroupPlayActions,
    useGroupPlayStore,
} from '/@/renderer/features/group-play/store/group-play.store';
import { useHermesUrl } from '/@/renderer/features/hermes-video/store/hermes-video.store';
import { Button } from '/@/shared/components/button/button';
import { Group } from '/@/shared/components/group/group';
import { Stack } from '/@/shared/components/stack/stack';
import { TextInput } from '/@/shared/components/text-input/text-input';
import { Text } from '/@/shared/components/text/text';
import { toast } from '/@/shared/components/toast/toast';

// Create or join a group, and see who is in it and what is queued.
export const GroupPlayPanel = () => {
    const url = useHermesUrl();
    const { code, hostKey, role, state, userName } = useGroupPlayStore();
    const actions = useGroupPlayActions();
    const [joinCode, setJoinCode] = useState('');
    const [groupName, setGroupName] = useState('');
    const [busy, setBusy] = useState(false);

    if (!url) {
        return (
            <Text isMuted>
                Group Play runs through Hermes Music. Add its address in Settings &gt; General &gt;
                Music videos first.
            </Text>
        );
    }

    const run = async (work: () => Promise<void>) => {
        setBusy(true);
        try {
            await work();
        } catch (error) {
            toast.error({ message: (error as Error).message });
        } finally {
            setBusy(false);
        }
    };

    if (!code) {
        const name = userName.trim() || 'Guest';
        return (
            <Stack gap="lg">
                <TextInput
                    label="Your name"
                    onChange={(e) => actions.setUserName(e.currentTarget.value)}
                    placeholder="Shown to the others"
                    value={userName}
                />
                <Stack gap="xs">
                    <Text fw={600}>Start a group</Text>
                    <Text isMuted size="sm">
                        You are the host: you pick and skip songs, everyone hears what you play.
                    </Text>
                    <Group gap="xs" wrap="nowrap">
                        <TextInput
                            flex={1}
                            onChange={(e) => setGroupName(e.currentTarget.value)}
                            placeholder="Group name (optional)"
                            value={groupName}
                        />
                        <Button
                            disabled={busy}
                            onClick={() =>
                                run(async () => {
                                    const res = await groupApi.create(url, groupName, name);
                                    actions.setSession({
                                        code: res.code,
                                        hostKey: res.hostKey,
                                        role: 'host',
                                    });
                                    actions.setState(res.state);
                                })
                            }
                            variant="filled"
                        >
                            Create
                        </Button>
                    </Group>
                </Stack>
                <Stack gap="xs">
                    <Text fw={600}>Join a group</Text>
                    <Text isMuted size="sm">
                        You can add songs; only the host can skip.
                    </Text>
                    <Group gap="xs" wrap="nowrap">
                        <TextInput
                            flex={1}
                            onChange={(e) => setJoinCode(e.currentTarget.value.toUpperCase())}
                            placeholder="Group code"
                            value={joinCode}
                        />
                        <Button
                            disabled={busy || joinCode.trim().length !== 5}
                            onClick={() =>
                                run(async () => {
                                    const res = await groupApi.join(url, joinCode.trim(), name);
                                    actions.setSession({
                                        code: joinCode.trim(),
                                        member: res.member,
                                        role: 'member',
                                    });
                                    actions.setState(res.state);
                                })
                            }
                            variant="filled"
                        >
                            Join
                        </Button>
                    </Group>
                </Stack>
            </Stack>
        );
    }

    const isHost = role === 'host';
    const listening = (state?.members.length ?? 0) + 1;
    const hostLabel = isHost ? 'You are the host' : `Host: ${state?.host ?? '...'}`;
    const who = `${hostLabel} - ${listening} listening`;
    const leave = () =>
        run(async () => {
            if (isHost && hostKey) await groupApi.end(url, code, hostKey).catch(() => {});
            actions.leave();
            closeAllModals();
        });

    return (
        <Stack gap="md">
            <Group justify="space-between">
                <Stack gap={0}>
                    <Text fw={600}>{state?.name || 'Group Play'}</Text>
                    <Text isMuted size="sm">
                        {who}
                    </Text>
                </Stack>
                <Stack align="flex-end" gap={0}>
                    <Text isMuted size="xs">
                        Code
                    </Text>
                    <Text className={styles.code}>{code}</Text>
                </Stack>
            </Group>
            {!!state?.members.length && (
                <Text isMuted size="sm">
                    With: {state.members.join(', ')}
                </Text>
            )}
            <Text isMuted size="sm">
                {isHost
                    ? 'Play, skip and seek as usual - everyone follows you. Songs the others add go to the end of your queue.'
                    : 'Right-click a song > Add to group queue. Only the host can skip or seek.'}
            </Text>
            <div className={styles.queue}>
                {(state?.queue ?? []).map((song, index) => (
                    <div
                        className={index === state?.index ? styles.current : styles.row}
                        key={`${song.id}-${index}`}
                    >
                        <span className={styles.num}>{index + 1}</span>
                        <span>
                            {song.title}
                            <span className={styles.artist}> - {song.artist}</span>
                        </span>
                    </div>
                ))}
                {!state?.queue.length && (
                    <Text isMuted p="sm" size="sm">
                        Nothing queued yet.
                    </Text>
                )}
            </div>
            <Group justify="flex-end">
                <Button color="red" disabled={busy} onClick={leave} variant="subtle">
                    {isHost ? 'End group' : 'Leave group'}
                </Button>
            </Group>
        </Stack>
    );
};
