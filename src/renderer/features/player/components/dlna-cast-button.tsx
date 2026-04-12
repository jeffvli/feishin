import { Loader } from '@mantine/core';
import isElectron from 'is-electron';
import { useCallback, useEffect, useRef, useState } from 'react';

import { playerHandoff } from '../audio-player/engine/player-handoff';

import {
    usePlaybackSettings,
    usePlayerActions,
    usePlayerVolume,
    useSettingsStoreActions,
} from '/@/renderer/store';
import { useTimestampStoreBase } from '/@/renderer/store/timestamp.store';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Button } from '/@/shared/components/button/button';
import { Divider } from '/@/shared/components/divider/divider';
import { Group } from '/@/shared/components/group/group';
import { AppIcon } from '/@/shared/components/icon/icon';
import { Popover } from '/@/shared/components/popover/popover';
import { Text } from '/@/shared/components/text/text';
import { toast } from '/@/shared/components/toast/toast';
import { PlayerType } from '/@/shared/types/types';

interface DlnaDevice {
    controlUrl: string;
    id: string;
    location: string;
    name: string;
    renderingControlUrl: string;
}

interface GroupMember {
    device: DlnaDevice;
    isCoordinator: boolean;
    volume: number;
}

const dlnaPlayer = isElectron() ? window.api.dlnaPlayer : null;
const ipc = isElectron() ? window.api.ipc : null;

type Screen = 'connected' | 'connecting' | 'expand-group' | 'group' | 'group-build' | 'idle';

function isSonosDevice(device: DlnaDevice): boolean {
    return device.id.toUpperCase().includes('RINCON');
}

const DeviceList = ({
    devices,
    disabledIds = [],
    isLoading,
    onSelect,
}: {
    devices: DlnaDevice[];
    disabledIds?: string[];
    isLoading: boolean;
    onSelect: (device: DlnaDevice) => void;
}) => {
    if (isLoading) {
        return (
            <Group p="sm">
                <Loader color="gray" size={12} type="bars" />
                <Text c="dimmed">Searching for devices…</Text>
            </Group>
        );
    }

    if (devices.length === 0) {
        return (
            <Group p="sm">
                <AppIcon.circleSlash size={12} />
                <Text c="dimmed">No DLNA devices found</Text>
            </Group>
        );
    }

    return (
        <>
            {devices.map((device) => {
                const disabled = disabledIds.includes(device.id);
                return (
                    <div
                        key={device.id}
                        onClick={() => !disabled && onSelect(device)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !disabled) onSelect(device);
                        }}
                        role="button"
                        style={{
                            borderRadius: '4px',
                            color: disabled ? '#555' : '#e0e0e0',
                            cursor: disabled ? 'default' : 'pointer',
                            fontSize: '0.8rem',
                            padding: '6px 12px',
                        }}
                        tabIndex={disabled ? -1 : 0}
                    >
                        {device.name}
                        {disabled && (
                            <Text c="primary" display="inline" ml={6} size="xs">
                                connected
                            </Text>
                        )}
                    </div>
                );
            })}
        </>
    );
};

const GroupBuilder = ({
    devices,
    isLoading,
    lockedCoordinator,
    onCancel,
    onConfirm,
    onRefresh,
}: {
    devices: DlnaDevice[];
    isLoading: boolean;
    lockedCoordinator?: DlnaDevice;
    onCancel: () => void;
    onConfirm: (selected: DlnaDevice[], coordinator: DlnaDevice) => void;
    onRefresh: () => void;
}) => {
    const [checked, setChecked] = useState<DlnaDevice[]>(
        lockedCoordinator ? [lockedCoordinator] : [],
    );

    const toggle = (device: DlnaDevice) => {
        if (lockedCoordinator && device.id === lockedCoordinator.id) return;
        setChecked((prev) =>
            prev.some((d) => d.id === device.id)
                ? prev.filter((d) => d.id !== device.id)
                : [...prev, device],
        );
    };

    const coordinator = lockedCoordinator ?? checked[0];
    const canConfirm = checked.length >= 2;

    return (
        <>
            <Text pb="xs" style={{ color: '#e0e0e0' }}>
                {lockedCoordinator ? 'Add Speakers' : 'Select Group Speakers'}
            </Text>
            <Divider mb="xs" />

            {isLoading && (
                <Group p="sm">
                    <Loader color="gray" size={12} type="bars" />
                    <Text c="dimmed">Searching…</Text>
                </Group>
            )}
            {!isLoading && devices.length === 0 && (
                <Group p="sm">
                    <AppIcon.circleSlash size={12} />
                    <Text c="dimmed">No Sonos devices found</Text>
                </Group>
            )}

            {devices.map((device) => {
                const isLocked = lockedCoordinator?.id === device.id;
                const isChecked = checked.some((d) => d.id === device.id);
                const isCoord = device.id === coordinator?.id;
                return (
                    <div
                        key={device.id}
                        onClick={() => toggle(device)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') toggle(device);
                        }}
                        role="button"
                        style={{
                            alignItems: 'center',
                            background: isChecked ? 'rgba(108,159,255,0.15)' : 'transparent',
                            borderRadius: '4px',
                            cursor: isLocked ? 'default' : 'pointer',
                            display: 'flex',
                            fontSize: '0.8rem',
                            gap: 8,
                            padding: '6px 12px',
                        }}
                        tabIndex={isLocked ? -1 : 0}
                    >
                        <span
                            style={{
                                background: isChecked ? '#6c9fff' : 'transparent',
                                border: `2px solid ${isChecked ? '#6c9fff' : '#555'}`,
                                borderRadius: 3,
                                display: 'inline-block',
                                flexShrink: 0,
                                height: 12,
                                width: 12,
                            }}
                        />
                        <Text c={isLocked ? 'dimmed' : undefined} size="sm">
                            {device.name}
                        </Text>
                        {isCoord && (
                            <Text c="primary" size="xs">
                                coordinator
                            </Text>
                        )}
                    </div>
                );
            })}

            {!lockedCoordinator && (
                <Text c="dimmed" px="sm" size="xs">
                    First selected = coordinator
                </Text>
            )}

            <Group gap="xs" mt="sm">
                <Button
                    disabled={isLoading}
                    flex={1}
                    leftSection={<AppIcon.refresh size={12} />}
                    onClick={onRefresh}
                    size="xs"
                    variant="outline"
                >
                    Refresh
                </Button>
                <Button color="gray" flex={1} onClick={onCancel} size="xs" variant="outline">
                    Cancel
                </Button>
                <Button
                    disabled={!canConfirm}
                    flex={1}
                    onClick={() => coordinator && onConfirm(checked, coordinator)}
                    size="xs"
                    variant="filled"
                >
                    {lockedCoordinator ? 'Add' : 'Connect'}
                </Button>
            </Group>
        </>
    );
};

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
            const currentTimestamp = useTimestampStoreBase.getState().timestamp;
            if (currentTimestamp > 0) {
                playerHandoff.pendingDlnaSeek = currentTimestamp;
            }
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
                playerHandoff.pendingDlnaSeek = -1;
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
        const position = await dlnaPlayer.getPosition();
        if (position > 0) playerHandoff.pendingLocalSeek = position;
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
                                handleDiscover();
                            } else {
                                refreshGroupState();
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
                            <Text pb="sm" style={{ color: '#e0e0e0' }}>
                                DLNA Devices
                            </Text>
                            <Divider mb="sm" />

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
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDiscover();
                                        }}
                                        size="xs"
                                        variant="outline"
                                    >
                                        Refresh
                                    </Button>
                                    {hasSonosDevices && devices.length >= 2 && (
                                        <Button
                                            flex={1}
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
                            <Text pb="sm" style={{ color: '#e0e0e0' }}>
                                Now casting
                            </Text>
                            <Divider mb="sm" />
                            <Text c="dimmed" size="sm">
                                {connectedDeviceName}
                            </Text>
                            <Group gap="xs" mt="sm">
                                {coordinatorRef.current &&
                                    isSonosDevice(coordinatorRef.current) && (
                                        <Button
                                            flex={1}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setScreen('expand-group');
                                                handleDiscover();
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
                            <Text pb="sm" style={{ color: '#e0e0e0' }}>
                                Group ({groupMemberList.length} speakers)
                            </Text>
                            <Divider mb="sm" />

                            {groupMemberList.map((m) => (
                                <Group justify="space-between" key={m.device.id} px="sm" py={4}>
                                    <Text c={m.isCoordinator ? 'primary' : undefined} size="sm">
                                        {m.device.name}
                                        {m.isCoordinator && (
                                            <Text c="primary" display="inline" ml={4} size="xs">
                                                ★
                                            </Text>
                                        )}
                                    </Text>
                                    {!m.isCoordinator && (
                                        <Button
                                            color="red"
                                            onClick={() => handleRemoveMember(m.device.id)}
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
                                        handleDiscover();
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
