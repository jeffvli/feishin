import { Loader } from '@mantine/core';
import isElectron from 'is-electron';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { DlnaDevice, GroupMember } from './dlna/types';

import { DeviceList } from '/@/renderer/features/player/components/dlna/device-list';
import { GroupBuilder } from '/@/renderer/features/player/components/dlna/group-builder';
import {
    usePlaybackSettings,
    usePlayerActions,
    usePlayerVolume,
    useSettingsStoreActions,
} from '/@/renderer/store';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Button } from '/@/shared/components/button/button';
import { Group } from '/@/shared/components/group/group';
import { AppIcon } from '/@/shared/components/icon/icon';
import { Popover } from '/@/shared/components/popover/popover';
import { Text } from '/@/shared/components/text/text';
import { toast } from '/@/shared/components/toast/toast';
import { PlayerType } from '/@/shared/types/types';

const dlnaPlayer = isElectron() ? window.api.dlnaPlayer : null;
const ipc = isElectron() ? window.api.ipc : null;

type Screen = 'connected' | 'connecting' | 'expand-group' | 'group' | 'group-build' | 'idle';

function isSonosDevice(device: DlnaDevice): boolean {
    return device.id.toUpperCase().includes('RINCON');
}

export const DlnaCastButton = () => {
    const { setSettings } = useSettingsStoreActions();
    const { setVolume } = usePlayerActions();
    const volume = usePlayerVolume();
    const settings = usePlaybackSettings();

    const [screen, setScreen] = useState<Screen>('idle');
    const [showPopover, setShowPopover] = useState(false);
    const [devices, setDevices] = useState<DlnaDevice[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [connectedDeviceName, setConnectedDeviceName] = useState('');
    const [groupMemberList, setGroupMemberList] = useState<GroupMember[]>([]);
    const coordinatorRef = useRef<DlnaDevice | null>(null);

    const previousPlayerTypeRef = useRef<PlayerType>(
        settings.type === PlayerType.DLNA ? PlayerType.WEB : settings.type,
    );

    const isConnected = screen === 'connected' || screen === 'group';
    const hasSonosDevices = devices.some(isSonosDevice);

    useEffect(() => {
        if (!ipc) return;
        const handleGroupState = (_: unknown, state: GroupMember[]) => {
            setGroupMemberList(state);
            if (state.length > 1) {
                setScreen('group');
                setConnectedDeviceName(`Group (${state.length})`);
            } else if (state.length === 1) {
                setScreen('connected');
                setConnectedDeviceName(state[0].device.name);
                coordinatorRef.current = state[0].device as DlnaDevice;
            }
        };
        ipc.on('renderer-dlna-group-state', handleGroupState);
        return () => {
            ipc.removeAllListeners('renderer-dlna-group-state');
        };
    }, []);

    const handleDiscover = useCallback(async () => {
        if (!dlnaPlayer) return;
        setIsLoading(true);
        try {
            setDevices(await dlnaPlayer.discover());
        } catch {
            setDevices([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const refreshGroupState = useCallback(async () => {
        if (!dlnaPlayer) return;
        try {
            setGroupMemberList(await dlnaPlayer.getGroupState());
        } catch {
            // Catch
        }
    }, []);

    const handleSelect = useCallback(
        async (device: DlnaDevice) => {
            if (!dlnaPlayer) return;
            if (settings.type !== PlayerType.DLNA) {
                previousPlayerTypeRef.current = settings.type;
            }
            setScreen('connecting');
            const result = await dlnaPlayer.connect(device);
            if (result.success) {
                coordinatorRef.current = device;
                setConnectedDeviceName(device.name);
                setGroupMemberList([{ device, isCoordinator: true, volume: result.volume }]);
                setVolume(result.volume);
                setSettings({
                    playback: {
                        ...settings,
                        previousLocalVolume: volume,
                        previousPlayerType:
                            settings.type !== PlayerType.DLNA ? settings.type : PlayerType.WEB,
                        type: PlayerType.DLNA,
                    },
                });
                setScreen('connected');
            } else {
                setScreen('idle');
            }
        },
        [setSettings, setVolume, settings, volume],
    );

    const handleGroupConfirm = useCallback(
        async (selected: DlnaDevice[], coordinator: DlnaDevice) => {
            if (!dlnaPlayer || selected.length < 2) return;
            if (settings.type !== PlayerType.DLNA) {
                previousPlayerTypeRef.current = settings.type;
            }
            setScreen('connecting');
            const result = await dlnaPlayer.connect(coordinator);
            if (!result.success) {
                setScreen('group-build');
                return;
            }
            coordinatorRef.current = coordinator;
            setVolume(result.volume);
            setSettings({
                playback: {
                    ...settings,
                    previousLocalVolume: volume,
                    previousPlayerType:
                        settings.type !== PlayerType.DLNA ? settings.type : PlayerType.WEB,
                    type: PlayerType.DLNA,
                },
            });
            const initialMembers: GroupMember[] = [
                { device: coordinator, isCoordinator: true, volume: result.volume },
            ];
            for (const member of selected.filter((d) => d.id !== coordinator.id)) {
                const r = await dlnaPlayer.addGroupMember(member);
                if (r.success) {
                    initialMembers.push({ device: member, isCoordinator: false, volume: 50 });
                } else {
                    toast.error({
                        message: `Cannot add ${member.name}. It might not be in the same Sonos system.`,
                        title: 'Failed to Add Speaker',
                    });
                }
            }
            setGroupMemberList(initialMembers);
            setConnectedDeviceName(`Group (${initialMembers.length})`);
            setScreen('group');
        },
        [setSettings, setVolume, settings, volume],
    );

    const handleExpandGroupConfirm = useCallback(
        async (selected: DlnaDevice[], coordinator: DlnaDevice) => {
            if (!dlnaPlayer) return;
            const toAdd = selected.filter((d) => d.id !== coordinator.id);
            const newMembers = [...groupMemberList];
            for (const member of toAdd) {
                const r = await dlnaPlayer.addGroupMember(member);
                if (r.success) {
                    newMembers.push({ device: member, isCoordinator: false, volume: 50 });
                } else {
                    toast.error({
                        message: `Cannot add ${member.name}. It might not be in the same Sonos system.`,
                        title: 'Failed to Add Speaker',
                    });
                }
            }
            setGroupMemberList(newMembers);
            setConnectedDeviceName(`Group (${newMembers.length})`);
            setScreen('group');
        },
        [groupMemberList],
    );

    const handleRemoveMember = useCallback(async (deviceId: string) => {
        if (!dlnaPlayer) return;
        await dlnaPlayer.removeGroupMember(deviceId);
        setGroupMemberList((prev) => {
            const next = prev.filter((m) => m.device.id !== deviceId);
            if (next.length === 1) {
                setConnectedDeviceName(next[0].device.name);
                setScreen('connected');
            } else {
                setConnectedDeviceName(`Group (${next.length})`);
            }
            return next;
        });
    }, []);

    const handleDisconnect = useCallback(async () => {
        if (!dlnaPlayer) return;
        await dlnaPlayer.disconnect();
        setScreen('idle');
        setConnectedDeviceName('');
        setGroupMemberList([]);
        coordinatorRef.current = null;
        setShowPopover(false);
        const nextType =
            previousPlayerTypeRef.current === PlayerType.DLNA
                ? PlayerType.WEB
                : previousPlayerTypeRef.current;
        setSettings({ playback: { ...settings, type: nextType } });
        if (settings.previousLocalVolume !== undefined) setVolume(settings.previousLocalVolume);
    }, [setSettings, setVolume, settings]);

    useEffect(() => {
        if (settings.previousLocalVolume !== undefined) {
            const typeToRestore =
                settings.previousPlayerType === PlayerType.DLNA
                    ? PlayerType.WEB
                    : (settings.previousPlayerType ?? previousPlayerTypeRef.current);
            setSettings({
                playback: {
                    ...settings,
                    previousLocalVolume: undefined,
                    previousPlayerType: undefined,
                    type: typeToRestore,
                },
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (!isElectron()) return null;

    const expandGroupDevices = devices.filter(
        (d) =>
            d.id === coordinatorRef.current?.id ||
            (isSonosDevice(d) && !groupMemberList.some((m) => m.device.id === d.id)),
    );

    return (
        <Popover onChange={setShowPopover} opened={showPopover} position="top">
            <Popover.Target>
                <ActionIcon
                    icon="cast"
                    iconProps={{ color: isConnected ? 'primary' : undefined, size: 'lg' }}
                    onClick={(e) => {
                        e.stopPropagation();
                        const opening = !showPopover;
                        setShowPopover(opening);
                        if (opening) {
                            if (!isConnected) {
                                setScreen('idle');
                                void handleDiscover();
                            } else {
                                void refreshGroupState();
                            }
                        }
                    }}
                    size="sm"
                    tooltip={{
                        label: isConnected
                            ? screen === 'group'
                                ? `Casting to group (${groupMemberList.length})`
                                : `Casting to ${connectedDeviceName}`
                            : 'Cast to DLNA device',
                        openDelay: 0,
                    }}
                    variant="subtle"
                />
            </Popover.Target>

            <Popover.Dropdown style={{ minWidth: 340 }}>
                <div onClick={(e) => e.stopPropagation()}>
                    {screen === 'connecting' && (
                        <Group p="sm">
                            <Loader color="gray" size={12} type="bars" />
                            <Text c="dimmed">Connecting…</Text>
                        </Group>
                    )}
                    {screen === 'group-build' && (
                        <GroupBuilder
                            devices={devices}
                            isLoading={isLoading}
                            onCancel={() => setScreen('idle')}
                            onConfirm={handleGroupConfirm}
                            onRefresh={handleDiscover}
                        />
                    )}
                    {screen === 'expand-group' && coordinatorRef.current && (
                        <GroupBuilder
                            devices={expandGroupDevices}
                            isLoading={isLoading}
                            lockedCoordinator={coordinatorRef.current}
                            onCancel={() =>
                                setScreen(groupMemberList.length > 1 ? 'group' : 'connected')
                            }
                            onConfirm={handleExpandGroupConfirm}
                            onRefresh={handleDiscover}
                        />
                    )}
                    {screen === 'idle' && (
                        <>
                            <Text fw="600" pb="md" size="sm" ta="center">
                                DLNA Devices
                            </Text>

                            <DeviceList
                                devices={devices}
                                isLoading={isLoading}
                                onSelect={handleSelect}
                            />
                            {!isLoading && (
                                <Group gap="xs" mt="sm">
                                    <Button
                                        flex={
                                            hasSonosDevices && devices.length >= 2 ? 1 : undefined
                                        }
                                        fullWidth={!hasSonosDevices || devices.length < 2}
                                        leftSection={<AppIcon.refresh size={12} />}
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            void handleDiscover();
                                        }}
                                        size="xs"
                                        variant="outline"
                                    >
                                        Refresh
                                    </Button>
                                    {hasSonosDevices && devices.length >= 2 && (
                                        <Button
                                            flex={1}
                                            leftSection={<AppIcon.group size={12} />}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setScreen('group-build');
                                            }}
                                            size="xs"
                                            variant="outline"
                                        >
                                            Create Group
                                        </Button>
                                    )}
                                </Group>
                            )}
                        </>
                    )}
                    {screen === 'connected' && (
                        <>
                            <Text fw="600" pb="md" size="sm" ta="center">
                                Now casting
                            </Text>

                            <Text c="dimmed" size="sm">
                                {connectedDeviceName}
                            </Text>
                            <Group gap="xs" mt="sm">
                                {coordinatorRef.current &&
                                    isSonosDevice(coordinatorRef.current) && (
                                        <Button
                                            flex={1}
                                            leftSection={<AppIcon.group size={12} />}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setScreen('expand-group');
                                                void handleDiscover();
                                            }}
                                            size="xs"
                                            variant="outline"
                                        >
                                            Add to Group
                                        </Button>
                                    )}
                                <Button
                                    color="red"
                                    flex={1}
                                    fullWidth={
                                        !(
                                            coordinatorRef.current &&
                                            isSonosDevice(coordinatorRef.current)
                                        )
                                    }
                                    onClick={handleDisconnect}
                                    size="xs"
                                    style={{ color: 'var(--mantine-color-red-4, #ff6b6b)' }}
                                    variant="outline"
                                >
                                    Disconnect
                                </Button>
                            </Group>
                        </>
                    )}
                    {screen === 'group' && (
                        <>
                            <Text fw="600" pb="md" size="sm" ta="center">
                                Group ({groupMemberList.length} speakers)
                            </Text>

                            {groupMemberList.map((member) => (
                                <Group
                                    justify="space-between"
                                    key={member.device.id}
                                    px="sm"
                                    py={4}
                                >
                                    <Group>
                                        <Text
                                            c={member.isCoordinator ? 'primary' : undefined}
                                            size="sm"
                                        >
                                            {member.device.name}
                                        </Text>
                                        {member.isCoordinator && <AppIcon.star size={12} />}
                                    </Group>

                                    {!member.isCoordinator && (
                                        <Button
                                            color="red"
                                            onClick={() => handleRemoveMember(member.device.id)}
                                            size="compact-xs"
                                            style={{
                                                color: 'var(--mantine-color-red-4, #ff6b6b)',
                                            }}
                                            variant="subtle"
                                        >
                                            Remove
                                        </Button>
                                    )}
                                </Group>
                            ))}

                            <Group gap="xs" mt="sm">
                                <Button
                                    flex={1}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setScreen('expand-group');
                                        void handleDiscover();
                                    }}
                                    size="xs"
                                    variant="outline"
                                >
                                    Add Speaker
                                </Button>
                                <Button
                                    color="red"
                                    flex={1}
                                    onClick={handleDisconnect}
                                    size="xs"
                                    style={{ color: 'var(--mantine-color-red-4, #ff6b6b)' }}
                                    variant="outline"
                                >
                                    Disconnect All
                                </Button>
                            </Group>
                        </>
                    )}
                </div>
            </Popover.Dropdown>
        </Popover>
    );
};
