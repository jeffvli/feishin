import { closeAllModals, openModal } from '@mantine/modals';
import { Button, Group, Loader, Stack, Text } from '@mantine/core';
import { useEffect, useState } from 'react';

import type { DiscoveryResult, SonosDevice, SonosGroup } from '/@/shared/types/sonos-types';

function getSonosApi() {
    return window.api?.sonos ?? null;
}

interface SonosDeviceSelectorProps {
    onConnect?: (deviceId: string, groupId: string) => void;
}

function SonosDeviceSelectorContent({ onConnect }: SonosDeviceSelectorProps) {
    const [discovering, setDiscovering] = useState(true);
    const [devices, setDevices] = useState<SonosDevice[]>([]);
    const [groups, setGroups] = useState<SonosGroup[]>([]);
    const [connecting, setConnecting] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const discover = async () => {
            try {
                setDiscovering(true);
                setError(null);
                const result: DiscoveryResult = await getSonosApi()!.discover();
                setDevices(result.devices);
                setGroups(result.groups);
            } catch (e) {
                setError('Failed to discover Sonos devices');
                console.error('[sonos] Discovery error:', e);
            } finally {
                setDiscovering(false);
            }
        };

        discover();
    }, []);

    const handleConnect = async (groupId: string) => {
        const group = groups.find((g) => g.id === groupId);
        if (!group) return;

        const coordinatorId = group.coordinatorId;
        setConnecting(groupId);

        try {
            const success = await getSonosApi()!.connect(coordinatorId, groupId);
            if (success) {
                onConnect?.(coordinatorId, groupId);
                closeAllModals();
            } else {
                setError('Failed to connect to Sonos device');
            }
        } catch (e) {
            setError(`Connection error: ${(e as Error).message}`);
        } finally {
            setConnecting(null);
        }
    };

    if (discovering) {
        return (
            <Stack align="center" py="md">
                <Loader size="sm" />
                <Text size="sm">Discovering Sonos devices...</Text>
            </Stack>
        );
    }

    if (error) {
        return (
            <Stack py="md">
                <Text c="red" size="sm">{error}</Text>
                <Button
                    size="xs"
                    variant="light"
                    onClick={() => {
                        setDiscovering(true);
                        setError(null);
                        getSonosApi()?.discover().then((r) => {
                            setDevices(r.devices);
                            setGroups(r.groups);
                            setDiscovering(false);
                        }).catch(() => {
                            setError('Failed to discover Sonos devices');
                            setDiscovering(false);
                        });
                    }}
                >
                    Retry
                </Button>
            </Stack>
        );
    }

    if (groups.length === 0) {
        return (
            <Stack py="md">
                <Text size="sm">No Sonos devices found on the network.</Text>
                <Button
                    size="xs"
                    variant="light"
                    onClick={() => {
                        setDiscovering(true);
                        getSonosApi()?.discover().then((r) => {
                            setDevices(r.devices);
                            setGroups(r.groups);
                            setDiscovering(false);
                        }).catch(() => {
                            setDiscovering(false);
                        });
                    }}
                >
                    Scan again
                </Button>
            </Stack>
        );
    }

    return (
        <Stack>
            {groups.map((group) => {
                const groupDeviceNames = group.playerIds
                    .map((pid) => devices.find((d) => d.id === pid)?.name || pid)
                    .join(', ');

                return (
                    <Group key={group.id} justify="space-between" wrap="nowrap">
                        <Stack gap={0}>
                            <Text fw={500} size="sm">{group.name || 'Group'}</Text>
                            <Text c="dimmed" size="xs">{groupDeviceNames}</Text>
                        </Stack>
                        <Button
                            loading={connecting === group.id}
                            size="xs"
                            variant="filled"
                            onClick={() => handleConnect(group.id)}
                        >
                            Connect
                        </Button>
                    </Group>
                );
            })}
        </Stack>
    );
}

export function openSonosDeviceSelector(onConnect?: (deviceId: string, groupId: string) => void) {
    openModal({
        children: <SonosDeviceSelectorContent onConnect={onConnect} />,
        size: 'sm',
        title: 'Select Sonos Device',
    });
}

export function disconnectSonos() {
    getSonosApi()?.disconnect();
}
