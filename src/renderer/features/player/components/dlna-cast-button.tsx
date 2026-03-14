import isElectron from 'is-electron';
import { useCallback, useEffect, useRef, useState } from 'react';

import { usePlayerActions, useSettingsStoreActions } from '/@/renderer/store';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
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
            <div style={{ color: '#e0e0e0', fontSize: '0.8rem', padding: '8px 12px' }}>
                Searching for devices...
            </div>
        );
    }

    if (devices.length === 0) {
        return (
            <div style={{ color: '#888', fontSize: '0.8rem', padding: '8px 12px' }}>
                No DLNA devices found
            </div>
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
    const [previousPlayerType] = useState<PlayerType>(PlayerType.WEB);

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

            const result = await dlnaPlayer.connect(device);
            if (result.success) {
                setIsConnected(true);
                setConnectedDeviceName(device.name);
                setShowPopover(false);
                setVolume(result.volume);
                setSettings({
                    playback: { type: PlayerType.DLNA },
                });
            }
        },
        [setSettings, setVolume],
    );

    const handleDisconnect = useCallback(async () => {
        if (!dlnaPlayer) return;

        await dlnaPlayer.disconnect();
        setIsConnected(false);
        setConnectedDeviceName('');
        setSettings({
            playback: { type: previousPlayerType },
        });
    }, [previousPlayerType, setSettings]);

    const handleToggle = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation();
            if (isConnected) {
                handleDisconnect();
                return;
            }

            if (showPopover) {
                setShowPopover(false);
            } else {
                setShowPopover(true);
                handleDiscover();
            }
        },
        [isConnected, showPopover, handleDisconnect, handleDiscover],
    );

    // Close popover when clicking outside
    useEffect(() => {
        if (!showPopover) return;

        const handleClickOutside = () => setShowPopover(false);
        const timer = setTimeout(() => {
            document.addEventListener('click', handleClickOutside);
        }, 100);

        return () => {
            clearTimeout(timer);
            document.removeEventListener('click', handleClickOutside);
        };
    }, [showPopover]);

    const buttonRef = useRef<HTMLDivElement>(null);
    const [popoverPos, setPopoverPos] = useState<{ left: number; top: number }>({
        left: 0,
        top: 0,
    });

    useEffect(() => {
        if (showPopover && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setPopoverPos({
                left: rect.left + rect.width / 2,
                top: rect.top - 8,
            });
        }
    }, [showPopover]);

    if (!isElectron()) return null;

    return (
        <div ref={buttonRef} style={{ position: 'relative' }}>
            <ActionIcon
                icon={isConnected ? 'wifiOn' : 'wifiOff'}
                iconProps={{
                    color: isConnected ? 'primary' : undefined,
                    size: 'lg',
                }}
                onClick={handleToggle}
                size="sm"
                tooltip={{
                    label: isConnected
                        ? `Casting to ${connectedDeviceName} (click to disconnect)`
                        : 'Cast to DLNA device',
                    openDelay: 0,
                }}
                variant="subtle"
            />
            {showPopover && (
                <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        backgroundColor: '#1a1a2e',
                        border: '1px solid #333',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                        left: `${popoverPos.left}px`,
                        minWidth: '220px',
                        padding: '8px 0',
                        position: 'fixed',
                        top: `${popoverPos.top}px`,
                        transform: 'translateX(-50%) translateY(-100%)',
                        zIndex: 9999,
                    }}
                >
                    <div
                        style={{
                            borderBottom: '1px solid #444',
                            color: '#e0e0e0',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            padding: '4px 12px 8px',
                            textTransform: 'uppercase',
                        }}
                    >
                        DLNA Devices
                    </div>
                    <DeviceList devices={devices} isLoading={isLoading} onSelect={handleSelect} />
                    {!isLoading && (
                        <div
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDiscover();
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleDiscover();
                            }}
                            role="button"
                            style={{
                                borderTop: '1px solid #444',
                                color: '#6c9fff',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                marginTop: '4px',
                                padding: '8px 12px 4px',
                                textAlign: 'center',
                            }}
                            tabIndex={0}
                        >
                            Refresh
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
