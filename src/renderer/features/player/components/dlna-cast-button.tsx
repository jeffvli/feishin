import { Loader } from '@mantine/core';
import isElectron from 'is-electron';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
    usePlaybackSettings,
    usePlayerActions,
    usePlayerVolume,
    useSettingsStoreActions,
} from '/@/renderer/store';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Button } from '/@/shared/components/button/button';
import { Divider } from '/@/shared/components/divider/divider';
import { Group } from '/@/shared/components/group/group';
import { AppIcon } from '/@/shared/components/icon/icon';
import { Popover } from '/@/shared/components/popover/popover';
import { Text } from '/@/shared/components/text/text';
import { PlayerType } from '/@/shared/types/types';

interface DlnaDevice {
    controlUrl: string;
    id: string;
    location: string;
    name: string;
    renderingControlUrl: string;
}

const dlnaPlayer = isElectron() ? window.api.dlnaPlayer : null;

interface DeviceListProps {
    devices: DlnaDevice[];
    isLoading: boolean;
    onSelect: (device: DlnaDevice) => void;
}

const DeviceList = ({ devices, isLoading, onSelect }: DeviceListProps) => {
    if (isLoading) {
        return (
            <Group p={'sm'}>
                <Loader color="gray" size={12} type="bars" />
                <Text c={'dimmed'}>Searching for devices..</Text>
            </Group>
        );
    }

    if (devices.length === 0) {
        return (
            <Group p={'sm'}>
                <AppIcon.circleSlash size={12} />
                <Text c={'dimmed'}>No DLNA devices found</Text>
            </Group>
        );
    }

    return (
        <>
            {devices.map((device) => (
                <div
                    key={device.id}
                    onClick={() => onSelect(device)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') onSelect(device);
                    }}
                    role="button"
                    style={{
                        borderRadius: '4px',
                        color: '#e0e0e0',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        padding: '6px 12px',
                    }}
                    tabIndex={0}
                >
                    {device.name}
                </div>
            ))}
        </>
    );
};

export const DlnaCastButton = () => {
    const { setSettings } = useSettingsStoreActions();
    const { setVolume } = usePlayerActions();
    const [isConnected, setIsConnected] = useState(false);
    const [connectedDeviceName, setConnectedDeviceName] = useState('');
    const [showPopover, setShowPopover] = useState(false);
    const [devices, setDevices] = useState<DlnaDevice[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const volume = usePlayerVolume();
    const settings = usePlaybackSettings();
    const previousPlayerTypeRef = useRef<PlayerType>(settings.type);

    const handleDiscover = useCallback(async () => {
        if (!dlnaPlayer) return;
        setIsLoading(true);
        try {
            const found = await dlnaPlayer.discover();
            setDevices(found);
        } catch {
            setDevices([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleSelect = useCallback(
        async (device: DlnaDevice) => {
            if (!dlnaPlayer) return;
            previousPlayerTypeRef.current = settings.type;
            const result = await dlnaPlayer.connect(device);
            if (result.success) {
                setIsConnected(true);
                setConnectedDeviceName(device.name);
                setShowPopover(false);
                setVolume(result.volume);
                setSettings({
                    playback: {
                        ...settings,
                        previousLocalVolume: volume,
                        previousPlayerType: settings.type,
                        type: result.success ? PlayerType.DLNA : settings.type,
                    },
                });
            }
        },
        [setSettings, setVolume, settings, volume],
    );

    const handleDisconnect = useCallback(async () => {
        if (!dlnaPlayer) return;
        await dlnaPlayer.disconnect();
        setIsConnected(false);
        setConnectedDeviceName('');
        setShowPopover(false);
        setSettings({
            playback: { ...settings, type: previousPlayerTypeRef.current },
        });
        if (settings.previousLocalVolume !== undefined) {
            setVolume(settings.previousLocalVolume);
        }
    }, [setSettings, setVolume, settings]);

    const handleToggle = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation();
            if (showPopover) {
                setShowPopover(false);
            } else {
                setShowPopover(true);
                if (!isConnected) {
                    handleDiscover();
                }
            }
        },
        [isConnected, showPopover, handleDiscover],
    );

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

    return (
        <Popover
            onChange={(val) => {
                setShowPopover(val);
                if (val) handleDiscover();
            }}
            opened={showPopover}
            position={'top'}
        >
            <Popover.Target>
                <ActionIcon
                    icon={'cast'}
                    iconProps={{
                        color: isConnected ? 'primary' : undefined,
                        size: 'lg',
                    }}
                    onClick={handleToggle}
                    size="sm"
                    tooltip={{
                        label: isConnected
                            ? `Casting to ${connectedDeviceName}`
                            : 'Cast to DLNA device',
                        openDelay: 0,
                    }}
                    variant="subtle"
                />
            </Popover.Target>
            <Popover.Dropdown>
                <div onClick={(e) => e.stopPropagation()}>
                    {isConnected ? (
                        <>
                            <Text
                                pb={'sm'}
                                style={{
                                    color: '#e0e0e0',
                                }}
                            >
                                Now casting
                            </Text>
                            <Divider mb={'sm'} />

                            <Text c={'dimmed'} size={'sm'}>
                                {connectedDeviceName}
                            </Text>

                            <div>
                                <Button
                                    color={'red'}
                                    fullWidth
                                    mt={'sm'}
                                    onClick={handleDisconnect}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleDisconnect();
                                    }}
                                    style={{
                                        borderRadius: '4px',
                                        color: '#ff6b6b',
                                        cursor: 'pointer',
                                        fontSize: '0.8rem',
                                        padding: '6px 12px',
                                        textAlign: 'center',
                                    }}
                                    tabIndex={0}
                                >
                                    Disconnect
                                </Button>
                            </div>
                        </>
                    ) : (
                        <>
                            <Text
                                pb={'sm'}
                                style={{
                                    color: '#e0e0e0',
                                }}
                            >
                                DLNA Devices
                            </Text>
                            <Divider mb={'sm'} />

                            <DeviceList
                                devices={devices}
                                isLoading={isLoading}
                                onSelect={handleSelect}
                            />
                            {!isLoading && (
                                <Button
                                    fullWidth
                                    leftSection={<AppIcon.refresh size={12}></AppIcon.refresh>}
                                    mt={'sm'}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDiscover();
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleDiscover();
                                    }}
                                    size={'xs'}
                                    ta={'center'}
                                    tabIndex={0}
                                    variant={'outline'}
                                >
                                    Refresh
                                </Button>
                            )}
                        </>
                    )}
                </div>
            </Popover.Dropdown>
        </Popover>
    );
};
