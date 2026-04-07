import isElectron from 'is-electron';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
    usePlaybackSettings,
    usePlayerActions,
    usePlayerVolume,
    useSettingsStoreActions,
} from '/@/renderer/store';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
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
    if (isLoading) return <div style={s.hint}>Searching for devices…</div>;
    if (devices.length === 0) return <div style={s.hint}>No DLNA devices found</div>;
    return (
        <>
            {devices.map((device) => {
                const disabled = disabledIds.includes(device.id);
                return (
                    <button
                        disabled={disabled}
                        key={device.id}
                        onClick={() => !disabled && onSelect(device)}
                        style={{
                            ...s.deviceBtn,
                            color: disabled ? '#555' : '#e0e0e0',
                            cursor: disabled ? 'default' : 'pointer',
                        }}
                        type="button"
                    >
                        {device.name}
                        {disabled && (
                            <span style={{ color: '#6c9fff', fontSize: '0.7rem', marginLeft: 6 }}>
                                connected
                            </span>
                        )}
                    </button>
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
            <div style={s.sectionHeader}>
                {lockedCoordinator ? 'Add Speakers' : 'Select Group Speakers'}
            </div>
            {isLoading && <div style={s.hint}>Searching…</div>}
            {!isLoading && devices.length === 0 && <div style={s.hint}>No Sonos devices found</div>}
            {devices.map((device) => {
                const isLocked = lockedCoordinator?.id === device.id;
                const isChecked = checked.some((d) => d.id === device.id);
                const isCoord = device.id === coordinator?.id;
                return (
                    <button
                        key={device.id}
                        onClick={() => toggle(device)}
                        style={{
                            ...s.deviceBtn,
                            background: isChecked ? 'rgba(108,159,255,0.15)' : 'transparent',
                            cursor: isLocked ? 'default' : 'pointer',
                        }}
                        type="button"
                    >
                        <span
                            style={{
                                background: isChecked ? '#6c9fff' : 'transparent',
                                border: `2px solid ${isChecked ? '#6c9fff' : '#555'}`,
                                borderRadius: 3,
                                display: 'inline-block',
                                flexShrink: 0,
                                height: 12,
                                marginRight: 8,
                                width: 12,
                            }}
                        />
                        {device.name}
                        {isCoord && (
                            <span style={{ color: '#6c9fff', fontSize: '0.7rem', marginLeft: 6 }}>
                                coordinator
                            </span>
                        )}
                    </button>
                );
            })}
            {!lockedCoordinator && <div style={s.hint}>First selected = coordinator</div>}
            <div
                style={{
                    borderTop: '1px solid #444',
                    display: 'flex',
                    gap: 6,
                    marginTop: 6,
                    padding: '6px 8px 2px',
                }}
            >
                <button
                    disabled={isLoading}
                    onClick={onRefresh}
                    style={{ ...s.actionBtn, color: '#6c9fff', flex: 1 }}
                    type="button"
                >
                    Refresh
                </button>
                <button
                    onClick={onCancel}
                    style={{ ...s.actionBtn, color: '#aaa', flex: 1 }}
                    type="button"
                >
                    Cancel
                </button>
                <button
                    disabled={!canConfirm}
                    onClick={() => coordinator && onConfirm(checked, coordinator)}
                    style={{
                        ...s.actionBtn,
                        color: canConfirm ? '#6c9fff' : '#555',
                        flex: 1,
                        fontWeight: 600,
                    }}
                    type="button"
                >
                    {lockedCoordinator ? 'Add' : 'Connect'}
                </button>
            </div>
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

    const previousPlayerTypeRef = useRef<PlayerType>(settings.type);
    const buttonRef = useRef<HTMLDivElement>(null);
    const [popoverPos, setPopoverPos] = useState({ left: 0, top: 0 });

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
            previousPlayerTypeRef.current = settings.type;
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
                        previousPlayerType: settings.type,
                        type: PlayerType.DLNA,
                    },
                });
                setScreen('connected');
                setShowPopover(true);
            } else {
                setScreen('idle');
            }
        },
        [setSettings, setVolume, settings, volume],
    );

    const handleGroupConfirm = useCallback(
        async (selected: DlnaDevice[], coordinator: DlnaDevice) => {
            if (!dlnaPlayer || selected.length < 2) return;
            previousPlayerTypeRef.current = settings.type;
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
                    previousPlayerType: settings.type,
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
            setShowPopover(true);
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
        setSettings({ playback: { ...settings, type: previousPlayerTypeRef.current } });
        if (settings.previousLocalVolume !== undefined) setVolume(settings.previousLocalVolume);
    }, [setSettings, setVolume, settings]);

    const handleToggle = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation();
            if (showPopover) {
                setShowPopover(false);
                return;
            }
            setShowPopover(true);
            if (!isConnected) {
                handleDiscover();
                setScreen('idle');
            } else refreshGroupState();
        },
        [isConnected, showPopover, handleDiscover, refreshGroupState],
    );

    useEffect(() => {
        if (!showPopover) return;
        const close = () => setShowPopover(false);
        const timer = setTimeout(() => document.addEventListener('click', close), 100);
        return () => {
            clearTimeout(timer);
            document.removeEventListener('click', close);
        };
    }, [showPopover]);

    useEffect(() => {
        if (showPopover && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setPopoverPos({ left: rect.left + rect.width / 2, top: rect.top - 8 });
        }
    }, [showPopover]);

    useEffect(() => {
        if (settings.previousLocalVolume !== undefined) {
            setSettings({
                playback: {
                    ...settings,
                    previousLocalVolume: undefined,
                    previousPlayerType: undefined,
                    type: settings.previousPlayerType ?? previousPlayerTypeRef.current,
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
        <div ref={buttonRef} style={{ position: 'relative' }}>
            <ActionIcon
                icon={isConnected ? 'wifiOn' : 'wifiOff'}
                iconProps={{ color: isConnected ? 'primary' : undefined, size: 'lg' }}
                onClick={handleToggle}
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

            {showPopover && (
                <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        ...s.popover,
                        left: `${popoverPos.left}px`,
                        top: `${popoverPos.top}px`,
                    }}
                >
                    {screen === 'connecting' && <div style={s.hint}>Connecting…</div>}

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
                            <div style={s.sectionHeader}>DLNA Devices</div>
                            <DeviceList
                                devices={devices}
                                isLoading={isLoading}
                                onSelect={handleSelect}
                            />
                            {!isLoading && (
                                <div
                                    style={{
                                        borderTop: '1px solid #444',
                                        display: 'flex',
                                        gap: 6,
                                        marginTop: 4,
                                        padding: '6px 8px 2px',
                                    }}
                                >
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDiscover();
                                        }}
                                        style={{
                                            ...s.actionBtn,
                                            color: '#6c9fff',
                                            flex:
                                                hasSonosDevices && devices.length >= 2
                                                    ? 1
                                                    : undefined,
                                            width:
                                                hasSonosDevices && devices.length >= 2
                                                    ? undefined
                                                    : '100%',
                                        }}
                                        type="button"
                                    >
                                        Refresh
                                    </button>
                                    {hasSonosDevices && devices.length >= 2 && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setScreen('group-build');
                                            }}
                                            style={{ ...s.actionBtn, color: '#a78bfa', flex: 1 }}
                                            type="button"
                                        >
                                            Create Group
                                        </button>
                                    )}
                                </div>
                            )}
                        </>
                    )}

                    {screen === 'connected' && (
                        <>
                            <div style={s.sectionHeader}>Now Casting</div>
                            <div style={s.hint}>{connectedDeviceName}</div>
                            <div
                                style={{
                                    borderTop: '1px solid #444',
                                    display: 'flex',
                                    gap: 6,
                                    padding: '6px 8px 2px',
                                }}
                            >
                                {coordinatorRef.current &&
                                    isSonosDevice(coordinatorRef.current) && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setScreen('expand-group');
                                                handleDiscover();
                                            }}
                                            style={{ ...s.actionBtn, color: '#a78bfa', flex: 1 }}
                                            type="button"
                                        >
                                            Add to Group
                                        </button>
                                    )}
                                <button
                                    onClick={handleDisconnect}
                                    style={{ ...s.actionBtn, color: '#ff6b6b', flex: 1 }}
                                    type="button"
                                >
                                    Disconnect
                                </button>
                            </div>
                        </>
                    )}

                    {screen === 'group' && (
                        <>
                            <div style={s.sectionHeader}>
                                Group ({groupMemberList.length} speakers)
                            </div>
                            {groupMemberList.map((m) => (
                                <div
                                    key={m.device.id}
                                    style={{
                                        alignItems: 'center',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        padding: '4px 12px',
                                    }}
                                >
                                    <span
                                        style={{
                                            color: m.isCoordinator ? '#6c9fff' : '#e0e0e0',
                                            fontSize: '0.8rem',
                                        }}
                                    >
                                        {m.device.name}
                                        {m.isCoordinator && (
                                            <span
                                                style={{
                                                    color: '#6c9fff',
                                                    fontSize: '0.7rem',
                                                    marginLeft: 4,
                                                }}
                                            >
                                                ★
                                            </span>
                                        )}
                                    </span>
                                    {!m.isCoordinator && (
                                        <button
                                            onClick={() => handleRemoveMember(m.device.id)}
                                            style={{
                                                ...s.actionBtn,
                                                color: '#ff6b6b',
                                                fontSize: '0.7rem',
                                                padding: '2px 6px',
                                            }}
                                            type="button"
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>
                            ))}
                            <div
                                style={{
                                    borderTop: '1px solid #444',
                                    display: 'flex',
                                    gap: 6,
                                    marginTop: 4,
                                    padding: '6px 8px 2px',
                                }}
                            >
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setScreen('expand-group');
                                        handleDiscover();
                                    }}
                                    style={{ ...s.actionBtn, color: '#a78bfa', flex: 1 }}
                                    type="button"
                                >
                                    Add Speaker
                                </button>
                                <button
                                    onClick={handleDisconnect}
                                    style={{ ...s.actionBtn, color: '#ff6b6b', flex: 1 }}
                                    type="button"
                                >
                                    Disconnect All
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

const s = {
    actionBtn: {
        background: 'transparent',
        border: 'none',
        borderRadius: 4,
        cursor: 'pointer',
        fontSize: '0.75rem',
        padding: '6px 8px',
        textAlign: 'center' as const,
    },
    deviceBtn: {
        alignItems: 'center',
        background: 'transparent',
        border: 'none',
        borderRadius: 4,
        color: '#e0e0e0',
        cursor: 'pointer',
        display: 'flex',
        fontSize: '0.8rem',
        padding: '6px 12px',
        textAlign: 'left' as const,
        width: '100%',
    },
    hint: { color: '#888', fontSize: '0.8rem', padding: '8px 12px' },
    popover: {
        backgroundColor: '#1a1a2e',
        border: '1px solid #333',
        borderRadius: 8,
        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
        minWidth: 240,
        padding: '8px 0',
        position: 'fixed' as const,
        transform: 'translateX(-50%) translateY(-100%)',
        zIndex: 9999,
    },
    sectionHeader: {
        borderBottom: '1px solid #444',
        color: '#e0e0e0',
        fontSize: '0.75rem',
        fontWeight: 600,
        padding: '4px 12px 8px',
        textTransform: 'uppercase' as const,
    },
} as const;
