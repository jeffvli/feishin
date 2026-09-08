import { Loader } from '@mantine/core';
import isElectron from 'is-electron';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { DlnaDevice, GroupMember } from './dlna/types';

import { playerHandoff } from '../audio-player/engine/player-handoff';

import { DeviceList } from '/@/renderer/features/player/components/dlna/device-list';
import { GroupBuilder } from '/@/renderer/features/player/components/dlna/group-builder';
import {
    usePlaybackSettings,
    usePlayerActions,
    usePlayerVolume,
    useSettingsStoreActions,
} from '/@/renderer/store';
import { useTimestampStoreBase } from '/@/renderer/store/timestamp.store';
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
const dlnaPlayerListener = isElectron() ? window.api.dlnaPlayerListener : null;

type Screen = 'connected' | 'connecting' | 'expand-group' | 'group' | 'group-build' | 'idle';

function isSonosDevice(device: DlnaDevice): boolean {
    return device.id.toUpperCase().includes('RINCON');
}

export const DlnaCastButton = () => {
    const { setSettings } = useSettingsStoreActions();
    const { t } = useTranslation();
    const { mediaPause, setVolume } = usePlayerActions();
    const volume = usePlayerVolume();
    const settings = usePlaybackSettings();

    const [screen, setScreen] = useState<Screen>('idle');
    const [showPopover, setShowPopover] = useState(false);
    const [devices, setDevices] = useState<DlnaDevice[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [connectedDeviceName, setConnectedDeviceName] = useState('');
    const [groupMemberList, setGroupMemberList] = useState<GroupMember[]>([]);
    const [isShiftDown, setIsShiftDown] = useState(false);
    const coordinatorRef = useRef<DlnaDevice | null>(null);

    const previousPlayerTypeRef = useRef<PlayerType>(
        settings.type === PlayerType.DLNA ? PlayerType.WEB : settings.type,
    );

    const isConnected = settings.type === PlayerType.DLNA;
    const hasSonosDevices = devices.some(isSonosDevice);
    useEffect(() => {
        if (!showPopover) return;
        const onKey = (e: KeyboardEvent) => setIsShiftDown(e.shiftKey);
        window.addEventListener('keydown', onKey);
        window.addEventListener('keyup', onKey);
        return () => {
            window.removeEventListener('keydown', onKey);
            window.removeEventListener('keyup', onKey);
            setIsShiftDown(false);
        };
    }, [showPopover]);
    useEffect(() => {
        if (!dlnaPlayerListener) return;
        const handler = (
            _: unknown,
            payload: { message: string; type: 'error' | 'info' | 'warning' },
        ) => {
            if (payload.type === 'error') {
                toast.error({ message: payload.message });
            } else if (payload.type === 'warning') {
                toast.warn?.({ message: payload.message });
            } else {
                toast.info?.({ message: payload.message });
            }
        };
        dlnaPlayerListener.rendererDlnaToast(handler);
        return () => {
            ipc?.removeAllListeners('renderer-dlna-toast');
        };
    }, []);

    useEffect(() => {
        if (!dlnaPlayerListener) return;
        if (!ipc) return;
        const handleGroupState = (_: unknown, state: GroupMember[]) => {
            setGroupMemberList(state);
            if (state.length > 1) {
                setScreen('group');
                setConnectedDeviceName(t('dlna.castingToGroup', { count: state.length }));
            } else if (state.length === 1) {
                setScreen('connected');
                setConnectedDeviceName(state[0].device.name);
                coordinatorRef.current = state[0].device as DlnaDevice;
            } else {
                if (coordinatorRef.current) {
                    setScreen('connected');
                    setConnectedDeviceName(coordinatorRef.current.name);
                    setGroupMemberList([
                        { device: coordinatorRef.current, isCoordinator: true, volume: 50 },
                    ]);
                }
            }
        };
        dlnaPlayerListener.rendererDlnaGroupState(handleGroupState);
        return () => {
            ipc?.removeAllListeners('renderer-dlna-group-state');
        };
    }, [t]);
    useEffect(() => {
        if (!dlnaPlayerListener) return;
        const handleDiscoveryUpdate = (_: unknown, updated: DlnaDevice[]) => {
            setDevices((current) => {
                if (screen !== 'idle') return current;
                const hasNewGroups = updated.some((d) => d.groupMembers);
                if (!hasNewGroups) return current;
                return updated;
            });
        };
        dlnaPlayerListener.rendererDlnaDiscoveryUpdate(handleDiscoveryUpdate);
        return () => {
            ipc?.removeAllListeners('renderer-dlna-discovery-update');
        };
    }, [screen]);

    const handleDiscover = useCallback(async () => {
        if (!dlnaPlayer) return;
        setDevices([]);
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
                setVolume(result.volume);
                if (result.currentUri && result.currentTransportState !== 'STOPPED') {
                    if (result.currentTransportState === 'PAUSED_PLAYBACK') {
                        playerHandoff.deviceAlreadyPlaying = true;
                        playerHandoff.deviceWasPaused = true;
                    } else {
                        playerHandoff.pendingDlnaSeek = -1;
                        playerHandoff.deviceAlreadyPlaying = true;
                        playerHandoff.deviceWasPaused = false;
                    }
                }
                setSettings({
                    playback: {
                        ...settings,
                        previousLocalVolume: volume,
                        previousPlayerType:
                            settings.type !== PlayerType.DLNA ? settings.type : PlayerType.WEB,
                        type: PlayerType.DLNA,
                    },
                });
                if (device.groupMembers && device.groupMembers.length > 1) {
                    const initialMembers: GroupMember[] = device.groupMembers.map((m) => ({
                        device: m as DlnaDevice,
                        isCoordinator: m.id === device.id,
                        volume: m.id === device.id ? result.volume : 50,
                    }));
                    setGroupMemberList(initialMembers);
                    setConnectedDeviceName(
                        t('dlna.castingToGroup', { count: initialMembers.length }),
                    );
                    setScreen('group');
                } else {
                    setConnectedDeviceName(device.name);
                    setGroupMemberList([{ device, isCoordinator: true, volume: result.volume }]);
                    setScreen('connected');
                }
            } else {
                playerHandoff.pendingDlnaSeek = -1;
                setScreen('idle');
            }
        },
        [setSettings, setVolume, settings, volume, t],
    );

    const handleGroupConfirm = useCallback(
        async (selected: DlnaDevice[], coordinator: DlnaDevice) => {
            if (!dlnaPlayer || selected.length < 2) return;
            const currentTimestamp = useTimestampStoreBase.getState().timestamp;
            if (currentTimestamp > 0) {
                playerHandoff.pendingDlnaSeek = currentTimestamp;
            }
            if (settings.type !== PlayerType.DLNA) {
                previousPlayerTypeRef.current = settings.type;
            }
            setScreen('connecting');
            const result = await dlnaPlayer.connect(coordinator);
            if (!result.success) {
                playerHandoff.pendingDlnaSeek = -1;
                setScreen('group-build');
                return;
            }
            if (result.currentUri && result.currentTransportState !== 'STOPPED') {
                if (result.currentTransportState === 'PAUSED_PLAYBACK') {
                    playerHandoff.deviceAlreadyPlaying = true;
                    playerHandoff.deviceWasPaused = true;
                } else {
                    playerHandoff.pendingDlnaSeek = -1;
                    playerHandoff.deviceAlreadyPlaying = true;
                    playerHandoff.deviceWasPaused = false;
                }
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
                        message: t('dlna.group.failedToAddMessage', { name: member.name }),
                        title: t('dlna.group.failedToAddTitle'),
                    });
                }
            }
            setGroupMemberList(initialMembers);
            setConnectedDeviceName(t('dlna.castingToGroup', { count: initialMembers.length }));
            setScreen('group');
        },
        [setSettings, setVolume, settings, volume, t],
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
                        message: t('dlna.group.failedToAddMessage', { name: member.name }),
                        title: t('dlna.group.failedToAddTitle'),
                    });
                }
            }
            setGroupMemberList(newMembers);
            setConnectedDeviceName(t('dlna.castingToGroup', { count: newMembers.length }));
            setScreen('group');
        },
        [groupMemberList, t],
    );

    const handleRemoveMember = useCallback(
        async (deviceId: string) => {
            if (!dlnaPlayer) return;
            await dlnaPlayer.removeGroupMember(deviceId);
            setGroupMemberList((prev) => {
                const next = prev.filter((m) => m.device.id !== deviceId);
                if (next.length === 1) {
                    setConnectedDeviceName(next[0].device.name);
                    setScreen('connected');
                } else {
                    setConnectedDeviceName(t('dlna.castingToGroup', { count: next.length }));
                }
                return next;
            });
        },
        [t],
    );

    const handleDisconnect = useCallback(async () => {
        if (!dlnaPlayer) return;
        const position = await dlnaPlayer.getPosition();
        if (position > 0) playerHandoff.pendingLocalSeek = position;

        if (isShiftDown) {
            await dlnaPlayer.disconnectPassive();
            mediaPause?.();
        } else {
            await dlnaPlayer.disconnect();
        }

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
        setDevices([]);
        void handleDiscover();
    }, [setSettings, setVolume, settings, handleDiscover, mediaPause, isShiftDown]);

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
            (isSonosDevice(d) &&
                !d.groupMembers &&
                !groupMemberList.some((m) => m.device.id === d.id)),
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
                                ? t('dlna.castingToGroup', { count: groupMemberList.length })
                                : t('dlna.castingToDevice', { name: connectedDeviceName })
                            : t('dlna.castToDevice'),
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
                            <Text c="dimmed">{t('dlna.connecting')}</Text>
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
                                {t('dlna.devices')}
                            </Text>
                            {devices
                                .filter((d) => d.groupMembers && d.groupMembers.length > 1)
                                .map((groupDevice) => (
                                    <div
                                        key={groupDevice.id}
                                        onClick={() => void handleSelect(groupDevice)}
                                        style={{
                                            borderRadius: 6,
                                            cursor: 'pointer',
                                            marginBottom: 4,
                                            padding: '8px 10px',
                                        }}
                                    >
                                        <Text fw={600} size="sm">
                                            {groupDevice.name}
                                        </Text>
                                        {groupDevice.groupMembers!.map((m) => (
                                            <Text
                                                c="dimmed"
                                                fw={m.id === groupDevice.id ? 700 : 400}
                                                key={m.id}
                                                size="xs"
                                                style={{ paddingLeft: 8 }}
                                            >
                                                {m.name}
                                            </Text>
                                        ))}
                                    </div>
                                ))}
                            <DeviceList
                                devices={devices.filter(
                                    (d) => !d.groupMembers || d.groupMembers.length <= 1,
                                )}
                                isLoading={isLoading}
                                onSelect={handleSelect}
                                showEmptyState={devices.length === 0}
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
                                        {t('dlna.group.refresh')}
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
                                            {t('dlna.createGroup')}
                                        </Button>
                                    )}
                                </Group>
                            )}
                        </>
                    )}
                    {screen === 'connected' && (
                        <>
                            <Text fw="600" pb="md" size="sm" ta="center">
                                {t('dlna.nowCasting')}
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
                                            {t('dlna.group.addToGroup')}
                                        </Button>
                                    )}
                                <Button
                                    color={isShiftDown ? 'white' : 'red'}
                                    flex={1}
                                    onClick={handleDisconnect}
                                    size="xs"
                                    style={{
                                        color: isShiftDown
                                            ? undefined
                                            : 'var(--mantine-color-red-4, #ff6b6b)',
                                    }}
                                    variant="outline"
                                >
                                    {t('dlna.disconnect')}
                                </Button>
                            </Group>
                            <Text
                                c="dimmed"
                                mt={6}
                                size="xs"
                                style={{
                                    opacity: isShiftDown ? 0 : 1,
                                    textAlign: 'center',
                                    transition: 'opacity 150ms',
                                }}
                            >
                                {t('dlna.shiftDisconnectHint')}
                            </Text>
                        </>
                    )}
                    {screen === 'group' && (
                        <>
                            <Text fw="600" pb="md" size="sm" ta="center">
                                {t('dlna.group.title', { count: groupMemberList.length })}
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

                                    {!member.isCoordinator && !member.device.isPair && (
                                        <Button
                                            color="red"
                                            onClick={() => handleRemoveMember(member.device.id)}
                                            size="compact-xs"
                                            style={{
                                                color: 'var(--mantine-color-red-4, #ff6b6b)',
                                            }}
                                            variant="subtle"
                                        >
                                            {t('dlna.group.remove')}
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
                                    {t('dlna.group.addSpeaker')}
                                </Button>
                                <Button
                                    color={isShiftDown ? 'white' : 'red'}
                                    flex={1}
                                    onClick={handleDisconnect}
                                    size="xs"
                                    style={{
                                        color: isShiftDown
                                            ? undefined
                                            : 'var(--mantine-color-red-4, #ff6b6b)',
                                    }}
                                    variant="outline"
                                >
                                    {t('dlna.disconnect')}
                                </Button>
                            </Group>
                            <Text
                                c="dimmed"
                                mt={6}
                                size="xs"
                                style={{
                                    opacity: isShiftDown ? 0 : 1,
                                    textAlign: 'center',
                                    transition: 'opacity 150ms',
                                }}
                            >
                                {t('dlna.shiftDisconnectHint')}
                            </Text>
                        </>
                    )}
                </div>
            </Popover.Dropdown>
        </Popover>
    );
};
