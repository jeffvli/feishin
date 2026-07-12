import { Button, Loader, Popover, Stack, Text, UnstyledButton } from '@mantine/core';
import { useEffect, useState } from 'react';

import type { DiscoveryResult, SonosGroup } from '/@/shared/types/sonos-types';
import { usePlaybackType, useSettingsStoreActions } from '/@/renderer/store';
import { PlayerType } from '/@/shared/types/types';

function sonosInvoke(method: string, ...args: any[]): Promise<any> {
    const api = (window as any).api;
    if (!api?.ipc?.invoke) return Promise.reject(new Error('IPC not available'));
    return api.ipc.invoke(`sonos:${method}`, ...args);
}

type SonosMenuContentProps = {
    onConnected: () => void;
    onDisconnected: () => void;
};

function SonosMenuContent({ onConnected, onDisconnected }: SonosMenuContentProps) {
    const [discovering, setDiscovering] = useState(false);
    const [groups, setGroups] = useState<SonosGroup[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [connecting, setConnecting] = useState<string | null>(null);
    const [started, setStarted] = useState(false);

    const discover = async () => {
        try {
            setDiscovering(true);
            setError(null);
            const result: DiscoveryResult = await sonosInvoke('discover');
            setGroups(result.groups);
            if (result.error) {
                console.warn('[sonos] Discovery warning:', result.error);
            }
            if (result.groups.length === 0 && result.error) {
                setError(result.error);
            }
            const connected = await sonosInvoke('get-connection-status');
            setIsConnected(!!connected);
        } catch (e) {
            console.error('[sonos] Discovery exception:', e);
            setError(`Discovery error: ${(e as Error).message || JSON.stringify(e)}`);
        } finally {
            setDiscovering(false);
        }
    };

    useEffect(() => {
        if (started) return;
        setStarted(true);
        setTimeout(() => discover(), 50);
    }, [started]);

    const handleConnect = async (groupId: string) => {
        const group = groups.find((g) => g.id === groupId);
        if (!group) return;

        setConnecting(groupId);
        try {
            const success = await sonosInvoke('connect', group.coordinatorId, groupId);
            if (success) {
                setIsConnected(true);
                onConnected();
            } else {
                setError('Failed to connect');
            }
        } catch (e) {
            setError(`Connection error: ${(e as Error).message}`);
        } finally {
            setConnecting(null);
        }
    };

    const handleDisconnect = async () => {
        try {
            await sonosInvoke('disconnect');
        } catch {}
        setIsConnected(false);
        onDisconnected();
    };

    if (discovering) {
        return (
            <Stack align="center" gap="xs" py="xs">
                <Loader size="xs" />
                <Text size="xs">Discovering...</Text>
            </Stack>
        );
    }

    if (error) {
        return (
            <Stack gap="xs">
                <Text c="red" size="xs">{error}</Text>
                <Button size="compact-xs" variant="light" onClick={discover}>
                    Retry
                </Button>
            </Stack>
        );
    }

    if (groups.length === 0) {
        return (
            <Stack gap="xs">
                <Text size="xs">No Sonos devices found</Text>
                <Button size="compact-xs" variant="light" onClick={discover}>
                    Scan again
                </Button>
            </Stack>
        );
    }

    return (
        <Stack gap="xs">
            {isConnected && (
                <Button color="red" size="compact-xs" variant="light" onClick={handleDisconnect}>
                    Disconnect
                </Button>
            )}
            {groups.map((group) => (
                <UnstyledButton
                    key={group.id}
                    onClick={() => !connecting && handleConnect(group.id)}
                    style={{
                        borderRadius: 'var(--mantine-radius-sm)',
                        opacity: connecting ? 0.5 : 1,
                        padding: '6px 10px',
                    }}
                >
                    <Stack gap={0}>
                        <Text fw={500} size="sm">
                            {connecting === group.id ? 'Connecting...' : (group.name || 'Group')}
                        </Text>
                        <Text c="dimmed" size="xs">
                            {group.playerIds.length} speaker{group.playerIds.length !== 1 ? 's' : ''}
                        </Text>
                    </Stack>
                </UnstyledButton>
            ))}
        </Stack>
    );
}

export const SonosButton = () => {
    const [isConnected, setIsConnected] = useState(false);
    const [apiReady, setApiReady] = useState(false);
    const { setSettings } = useSettingsStoreActions();
    const playbackType = usePlaybackType();

    useEffect(() => {
        let attempts = 0;
        let cancelled = false;
        const check = (): void => {
            if (cancelled) return;
            const api = (window as any).api;
            if (api?.ipc?.invoke) {
                setApiReady(true);
                const interval = setInterval(async () => {
                    if (cancelled) { clearInterval(interval); return; }
                    try {
                        const connected = await api.ipc.invoke('sonos:get-connection-status');
                        if (!cancelled) setIsConnected(!!connected);
                    } catch {}
                }, 5000);
                api.ipc.invoke('sonos:get-connection-status').then((c: boolean) => {
                    if (!cancelled) setIsConnected(!!c);
                }).catch(() => {});
                return;
            }
            attempts++;
            if (attempts < 50) {
                setTimeout(check, 100);
            }
        };
        check();
        return () => { cancelled = true; };
    }, []);

    const handleConnected = () => {
        setIsConnected(true);
        // Auto-switch to Sonos player type
        if (playbackType !== PlayerType.SONOS) {
            setSettings({ playback: { type: PlayerType.SONOS } });
        }
    };

    const handleDisconnected = () => {
        setIsConnected(false);
        // Auto-switch back to Web player
        if (playbackType === PlayerType.SONOS) {
            setSettings({ playback: { type: PlayerType.WEB } });
        }
    };

    if (!apiReady) return null;

    return (
        <Popover position="top-end" withArrow>
            <Popover.Target>
                <Button
                    onClick={(e) => e.stopPropagation()}
                    size="compact-xs"
                    style={{
                        color: isConnected ? 'var(--theme-colors-primary)' : undefined,
                        textTransform: 'uppercase',
                    }}
                    variant="transparent"
                >
                    SONOS
                </Button>
            </Popover.Target>
            <Popover.Dropdown
                maw={240}
                miw={200}
                onClick={(e) => e.stopPropagation()}
                p="sm"
            >
                <SonosMenuContent
                    onConnected={handleConnected}
                    onDisconnected={handleDisconnected}
                />
            </Popover.Dropdown>
        </Popover>
    );
};
