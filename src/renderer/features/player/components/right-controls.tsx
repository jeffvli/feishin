import { t } from 'i18next';
import isElectron from 'is-electron';
import { useCallback, useEffect, useRef, useState, WheelEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { PopoverPlayQueue } from '/@/renderer/features/now-playing/components/popover-play-queue';
import { DlnaCastButton } from '/@/renderer/features/player/components/dlna-cast-button';
import { PlayerConfig } from '/@/renderer/features/player/components/player-config';
import { CustomPlayerbarSlider } from '/@/renderer/features/player/components/playerbar-slider';
import { SleepTimerButton } from '/@/renderer/features/player/components/sleep-timer-button';
import { usePlayer } from '/@/renderer/features/player/context/player-context';
import { useSetRating } from '/@/renderer/features/shared/hooks/use-set-rating';
import { useCreateFavorite } from '/@/renderer/features/shared/mutations/create-favorite-mutation';
import { useDeleteFavorite } from '/@/renderer/features/shared/mutations/delete-favorite-mutation';
import {
    useAppStoreActions,
    useAutoDJSettings,
    useCurrentServer,
    useFullScreenPlayerStore,
    useGeneralSettings,
    useHotkeySettings,
    usePlayerData,
    usePlayerMuted,
    usePlayerSong,
    usePlayerVolume,
    useSetFullScreenPlayerStore,
    useSettingsStoreActions,
    useSidebarRightExpanded,
    useSideQueueType,
    useVolumeWheelStep,
    useVolumeWidth,
} from '/@/renderer/store';
import { useFullScreenPlayerStoreActions } from '/@/renderer/store/full-screen-player.store';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Button } from '/@/shared/components/button/button';
import { Flex } from '/@/shared/components/flex/flex';
import { Group } from '/@/shared/components/group/group';
import { Rating } from '/@/shared/components/rating/rating';
import { useHotkeys } from '/@/shared/hooks/use-hotkeys';
import { useMediaQuery } from '/@/shared/hooks/use-media-query';
import { useThrottledCallback } from '/@/shared/hooks/use-throttled-callback';
import { useThrottledValue } from '/@/shared/hooks/use-throttled-value';
import { LibraryItem, QueueSong, ServerType } from '/@/shared/types/domain-types';

const dlnaPlayer = isElectron() ? window.api.dlnaPlayer : null;
const ipc = isElectron() ? window.api.ipc : null;

interface DlnaGroupMember {
    device: { id: string; name: string };
    isCoordinator: boolean;
    volume: number;
}

interface SpeakerProperties {
    bass: number;
    crossfade: boolean;
    ledState: boolean;
    loudness: boolean;
    touchControls: boolean;
    treble: number;
}

const isSonosMember = (device: { id: string }) => device.id.toUpperCase().includes('RINCON');

const calculateVolumeUp = (volume: number, step: number) => Math.min(100, volume + step);
const calculateVolumeDown = (volume: number, step: number) => Math.max(0, volume - step);

const SpeakerPropertiesPopover = ({
    deviceId,
    deviceName,
    onClose,
    triggerRect,
}: {
    deviceId: string;
    deviceName: string;
    onClose: () => void;
    triggerRect: DOMRect;
}) => {
    const [speakerProps, setSpeakerProps] = useState<null | SpeakerProperties>(null);
    const [loading, setLoading] = useState(true);
    const leftCenter = triggerRect.left + triggerRect.width / 2;
    const left = Math.min(window.innerWidth - 150, leftCenter);
    const bottom = window.innerHeight - triggerRect.top + 6;
    useEffect(() => {
        if (!dlnaPlayer) {
            setLoading(false);
            return;
        }
        dlnaPlayer
            .getSpeakerProperties(deviceId)
            .then((p) => {
                setSpeakerProps(p);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [deviceId]);
    useEffect(() => {
        const close = (e: MouseEvent) => {
            const target = e.target as Element;
            if (!target.closest('[data-speaker-props-popover]')) onClose();
        };
        const timer = setTimeout(() => document.addEventListener('mousedown', close), 50);
        return () => {
            clearTimeout(timer);
            document.removeEventListener('mousedown', close);
        };
    }, [onClose]);
    const set = <K extends keyof SpeakerProperties>(key: K, value: SpeakerProperties[K]) => {
        if (!speakerProps) return;
        const next = { ...speakerProps, [key]: value };
        setSpeakerProps(next);
        ipc?.send('dlna-set-speaker-property', { deviceId, property: key, value });
    };
    return (
        <div
            data-speaker-props-popover
            onClick={(e) => e.stopPropagation()}
            style={{
                background: 'var(--theme-colors-surface, #1a1a2e)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 10,
                bottom: `${bottom}px`,
                boxShadow: '0 -4px 20px rgba(0,0,0,0.55)',
                left: `${left}px`,
                minWidth: 280,
                padding: '10px 14px 12px',
                position: 'fixed',
                transform: 'translateX(-50%)',
                zIndex: 9999,
            }}
        >
            <div
                style={{
                    alignItems: 'center',
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: 10,
                }}
            >
                <span
                    style={{
                        color: 'var(--theme-colors-primary, #6c9fff)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        maxWidth: 240,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {deviceName}
                </span>
                <button
                    onClick={onClose}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#888',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        lineHeight: 1,
                        padding: '0 0 0 8px',
                    }}
                    type="button"
                >
                    ✕
                </button>
            </div>
            {loading && (
                <div style={{ color: '#888', fontSize: '0.75rem', textAlign: 'center' }}>
                    Loading…
                </div>
            )}
            {!loading && !speakerProps && (
                <div style={{ color: '#ff6b6b', fontSize: '0.75rem', textAlign: 'center' }}>
                    Could not load properties
                </div>
            )}
            {!loading && speakerProps && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <PropSlider
                        label="Bass"
                        max={10}
                        min={-10}
                        onChange={(v) => set('bass', v)}
                        value={speakerProps.bass}
                    />
                    <PropSlider
                        label="Treble"
                        max={10}
                        min={-10}
                        onChange={(v) => set('treble', v)}
                        value={speakerProps.treble}
                    />
                    <PropToggle
                        label="Loudness"
                        onChange={(v) => set('loudness', v)}
                        value={speakerProps.loudness}
                    />
                    <PropToggle
                        label="Crossfade"
                        onChange={(v) => set('crossfade', v)}
                        value={speakerProps.crossfade}
                    />
                    <PropToggle
                        label="Status Light"
                        onChange={(v) => set('ledState', v)}
                        value={speakerProps.ledState}
                    />
                    <PropToggle
                        label="Touch Controls"
                        onChange={(v) => set('touchControls', v)}
                        value={speakerProps.touchControls}
                    />
                </div>
            )}
        </div>
    );
};

const labelStyle: React.CSSProperties = {
    color: 'var(--theme-colors-subtext, #aaa)',
    flex: '0 0 auto',
    fontSize: '0.68rem',
    width: 80,
};

const PropSlider = ({
    label,
    max,
    min,
    onChange,
    value,
}: {
    label: string;
    max: number;
    min: number;
    onChange: (v: number) => void;
    value: number;
}) => {
    const handleWheel = (e: WheelEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const step = 1;
        const next =
            e.deltaY > 0 || e.deltaX > 0
                ? Math.max(min, value - step)
                : Math.min(max, value + step);
        onChange(next);
    };
    return (
        <div
            onWheel={handleWheel}
            style={{ alignItems: 'center', display: 'flex', gap: 12, width: '100%' }}
        >
            <span style={labelStyle}>{label}</span>
            <div style={{ flex: 1 }}>
                <CustomPlayerbarSlider
                    max={max}
                    min={min}
                    onChange={onChange}
                    onClick={(e) => e.stopPropagation()}
                    size={6}
                    value={value}
                    w="100%"
                />
            </div>
        </div>
    );
};

const PropToggle = ({
    label,
    onChange,
    value,
}: {
    label: string;
    onChange: (v: boolean) => void;
    value: boolean;
}) => (
    <div
        onClick={() => onChange(!value)}
        style={{
            alignItems: 'center',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
        }}
    >
        <span style={labelStyle}>{label}</span>
        <span
            style={{
                background: value ? 'var(--theme-colors-primary, #6c9fff)' : '#444',
                borderRadius: 10,
                display: 'inline-block',
                height: 16,
                position: 'relative',
                transition: 'background 150ms',
                width: 30,
            }}
        >
            <span
                style={{
                    background: '#fff',
                    borderRadius: '50%',
                    bottom: 2,
                    left: value ? 16 : 2,
                    position: 'absolute',
                    top: 2,
                    transition: 'left 150ms',
                    width: 12,
                }}
            />
        </span>
    </div>
);

const GroupMemberVolumeRow = ({
    disabled,
    handleMemberVolume,
    isMinWidth,
    member,
    muted,
    onLongPress,
    onMuteToggle,
    volumeWheelStep,
    volumeWidth,
}: {
    disabled?: boolean;
    handleMemberVolume: (id: string, val: number) => void;
    isMinWidth: boolean;
    member: DlnaGroupMember;
    muted: boolean;
    onLongPress: (deviceId: string, rect: DOMRect) => void;
    onMuteToggle: (deviceId: string, muted: boolean) => void;
    volumeWheelStep: number;
    volumeWidth: number | string;
}) => {
    const { t } = useTranslation();
    const isSonos = isSonosMember(member.device);
    const longPressTimer = useRef<NodeJS.Timeout | null>(null);
    const wasLongPress = useRef(false);

    const handleWheel = useCallback(
        (e: WheelEvent<HTMLButtonElement | HTMLDivElement>) => {
            e.preventDefault();
            e.stopPropagation();
            const volumeToSet =
                e.deltaY > 0 || e.deltaX > 0
                    ? calculateVolumeDown(member.volume, volumeWheelStep)
                    : calculateVolumeUp(member.volume, volumeWheelStep);
            handleMemberVolume(member.device.id, volumeToSet);
            if (muted && volumeToSet > 0) onMuteToggle(member.device.id, false);
        },
        [handleMemberVolume, member.device.id, member.volume, volumeWheelStep, muted, onMuteToggle],
    );

    const startLongPress = useCallback(
        (e: React.PointerEvent<HTMLElement>) => {
            if (!isSonos) return;
            wasLongPress.current = false;
            const rect = e.currentTarget.getBoundingClientRect();
            longPressTimer.current = setTimeout(() => {
                longPressTimer.current = null;
                wasLongPress.current = true;
                onLongPress(member.device.id, rect);
            }, 500);
        },
        [isSonos, member.device.id, onLongPress],
    );

    const cancelLongPress = useCallback(() => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    }, []);

    return (
        <div
            style={{
                marginBottom: '10px',
                opacity: disabled ? 0.4 : 1,
                pointerEvents: disabled ? 'none' : 'auto',
                transition: 'opacity 0.2s',
            }}
        >
            <div
                style={{
                    color: 'var(--theme-colors-subtext, #aaa)',
                    fontSize: '0.68rem',
                    marginBottom: '4px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                }}
            >
                {member.device.name}
            </div>
            <div style={{ alignItems: 'center', display: 'flex', gap: '4px' }}>
                <span
                    onPointerDown={startLongPress}
                    onPointerLeave={cancelLongPress}
                    onPointerUp={cancelLongPress}
                    style={{ display: 'inline-flex' }}
                >
                    <ActionIcon
                        icon={
                            muted ? 'volumeMute' : member.volume > 50 ? 'volumeMax' : 'volumeNormal'
                        }
                        iconProps={{ color: muted ? 'muted' : undefined, size: 'xl' }}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (wasLongPress.current) return;
                            onMuteToggle(member.device.id, !muted);
                        }}
                        onWheel={handleWheel}
                        size="sm"
                        tooltip={{
                            label: isSonos
                                ? 'Long press for speaker properties'
                                : muted
                                  ? t('player.muted', { postProcess: 'titleCase' })
                                  : member.volume,
                            openDelay: 0,
                        }}
                        variant="subtle"
                    />
                </span>
                {!isMinWidth ? (
                    <CustomPlayerbarSlider
                        max={100}
                        min={0}
                        onChange={(val) => {
                            handleMemberVolume(member.device.id, val);
                            if (muted && val > 0) onMuteToggle(member.device.id, false);
                            if (!muted && val === 0) onMuteToggle(member.device.id, true);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        onWheel={handleWheel}
                        size={6}
                        value={member.volume}
                        w={volumeWidth}
                    />
                ) : null}
            </div>
        </div>
    );
};

const VolumeButton = () => {
    const { bindings } = useHotkeySettings();
    const volume = usePlayerVolume();
    const muted = usePlayerMuted();
    const volumeWheelStep = useVolumeWheelStep();
    const volumeWidth = useVolumeWidth();
    const { decreaseVolume, increaseVolume, mediaToggleMute, setVolume } = usePlayer();
    const isMinWidth = useMediaQuery('(max-width: 480px)');
    const { t } = useTranslation();

    const [sliderValue, setSliderValue] = useState(volume);
    const throttledVolume = useThrottledValue(sliderValue, 100);

    // Sync throttled value to actual volume
    const [groupMembers, setGroupMembers] = useState<DlnaGroupMember[]>([]);
    const [isHovered, setIsHovered] = useState(false);
    const [isShiftDown, setIsShiftDown] = useState(false);
    const groupMembersRef = useRef<DlnaGroupMember[]>([]);
    const [memberMutes, setMemberMutes] = useState<Record<string, boolean>>({});
    const [propsTarget, setPropsTarget] = useState<null | {
        deviceId: string;
        deviceName: string;
        rect: DOMRect;
    }>(null);
    const coordLongPressTimer = useRef<NodeJS.Timeout | null>(null);
    const wasCoordLongPress = useRef(false);
    const coordButtonRef = useRef<HTMLSpanElement>(null);

    const isGroupMode = groupMembers.length > 1;
    const coordinator = groupMembers.find((m) => m.isCoordinator) ?? groupMembers[0];
    const nonCoordinators = groupMembers.filter((m) => !m.isCoordinator);
    const coordinatorIsSonos = coordinator ? isSonosMember(coordinator.device) : false;
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'Shift') setIsShiftDown(true);
        };
        const up = (e: KeyboardEvent) => {
            if (e.key === 'Shift') setIsShiftDown(false);
        };
        window.addEventListener('keydown', down);
        window.addEventListener('keyup', up);
        return () => {
            window.removeEventListener('keydown', down);
            window.removeEventListener('keyup', up);
        };
    }, []);

    useEffect(() => {
        if (!ipc) return;
        const handleGroupState = (_: unknown, state: DlnaGroupMember[]) => {
            groupMembersRef.current = state;
            setGroupMembers(state);
            setMemberMutes((prev) => {
                const next: Record<string, boolean> = {};
                for (const m of state) next[m.device.id] = prev[m.device.id] ?? false;
                return next;
            });
        };
        const handleMemberVolume = (_: unknown, payload: { deviceId: string; volume: number }) => {
            setGroupMembers((prev) => {
                const next = prev.map((m) =>
                    m.device.id === payload.deviceId ? { ...m, volume: payload.volume } : m,
                );
                groupMembersRef.current = next;
                return next;
            });
        };
        ipc.on('renderer-dlna-group-state', handleGroupState);
        ipc.on('renderer-dlna-group-member-volume', handleMemberVolume);
        return () => {
            ipc.removeAllListeners('renderer-dlna-group-state');
            ipc.removeAllListeners('renderer-dlna-group-member-volume');
        };
    }, []);

    useEffect(() => {
        setGroupMembers((prev) => {
            if (prev.length === 0) return prev;
            const next = prev.map((m) => (m.isCoordinator ? { ...m, volume } : m));
            groupMembersRef.current = next;
            return next;
        });
    }, [volume]);

    useEffect(() => {
        setVolume(throttledVolume);
    }, [throttledVolume, setVolume]);

    // Sync external volume changes to local state
    useEffect(() => {
        setSliderValue(volume);
    }, [volume]);

    const handleMuteToggle = useCallback((deviceId: string, newMuted: boolean) => {
        setMemberMutes((prev) => ({ ...prev, [deviceId]: newMuted }));
        ipc?.send('dlna-group-member-mute', { deviceId, muted: newMuted });
    }, []);

    const handleMemberVolume = useCallback((deviceId: string, val: number) => {
        dlnaPlayer?.setGroupMemberVolume(deviceId, val);
        setGroupMembers((prev) => {
            const next = prev.map((m) => (m.device.id === deviceId ? { ...m, volume: val } : m));
            groupMembersRef.current = next;
            return next;
        });
    }, []);

    const applyDeltaToGroup = useCallback(
        (newVol: number) => {
            const delta = newVol - sliderValue;
            if (delta === 0) return;
            groupMembersRef.current.forEach((m) => {
                if (!m.isCoordinator) {
                    const vol =
                        newVol === 0
                            ? 0
                            : newVol === 100
                              ? 100
                              : Math.min(100, Math.max(0, m.volume + delta));
                    handleMemberVolume(m.device.id, vol);
                }
            });
        },
        [sliderValue, handleMemberVolume],
    );

    const handleVolumeDown = useCallback(
        () => decreaseVolume(volumeWheelStep),
        [decreaseVolume, volumeWheelStep],
    );
    const handleVolumeUp = useCallback(
        () => increaseVolume(volumeWheelStep),
        [increaseVolume, volumeWheelStep],
    );
    const handleMute = useCallback(() => mediaToggleMute(), [mediaToggleMute]);

    const handleVolumeSlider = useCallback(
        (e: number) => {
            if (isGroupMode && isShiftDown) applyDeltaToGroup(e);
            setSliderValue(e);
        },
        [isGroupMode, isShiftDown, applyDeltaToGroup],
    );

    const handleVolumeWheel = useCallback(
        (e: WheelEvent<HTMLButtonElement | HTMLDivElement>) => {
            e.preventDefault();
            e.stopPropagation();
            const v =
                e.deltaY > 0 || e.deltaX > 0
                    ? calculateVolumeDown(sliderValue, volumeWheelStep)
                    : calculateVolumeUp(sliderValue, volumeWheelStep);
            if (isGroupMode && isShiftDown) applyDeltaToGroup(v);
            setSliderValue(v);
        },
        [sliderValue, volumeWheelStep, isGroupMode, isShiftDown, applyDeltaToGroup],
    );

    const handleVolumeDownThrottled = useThrottledCallback(handleVolumeDown, 100);
    const handleVolumeUpThrottled = useThrottledCallback(handleVolumeUp, 100);

    useHotkeys([
        [bindings.volumeDown.isGlobal ? '' : bindings.volumeDown.hotkey, handleVolumeDownThrottled],
        [bindings.volumeUp.isGlobal ? '' : bindings.volumeUp.hotkey, handleVolumeUpThrottled],
        [bindings.volumeMute.isGlobal ? '' : bindings.volumeMute.hotkey, handleMute],
    ]);

    const handleLongPress = useCallback((deviceId: string, rect: DOMRect) => {
        const device = groupMembersRef.current.find((m) => m.device.id === deviceId);
        if (!device) return;
        setPropsTarget({ deviceId, deviceName: device.device.name, rect });
    }, []);

    const startCoordLongPress = useCallback(() => {
        if (!coordinatorIsSonos || !coordinator) return;
        wasCoordLongPress.current = false;
        const rect = coordButtonRef.current?.getBoundingClientRect();
        if (!rect) return;
        coordLongPressTimer.current = setTimeout(() => {
            coordLongPressTimer.current = null;
            wasCoordLongPress.current = true;
            setPropsTarget({
                deviceId: coordinator.device.id,
                deviceName: coordinator.device.name,
                rect,
            });
        }, 500);
    }, [coordinatorIsSonos, coordinator]);

    const cancelCoordLongPress = useCallback(() => {
        if (coordLongPressTimer.current) {
            clearTimeout(coordLongPressTimer.current);
            coordLongPressTimer.current = null;
        }
    }, []);

    return (
        <div
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{ position: 'relative' }}
        >
            {propsTarget && (
                <SpeakerPropertiesPopover
                    deviceId={propsTarget.deviceId}
                    deviceName={propsTarget.deviceName}
                    onClose={() => setPropsTarget(null)}
                    triggerRect={propsTarget.rect}
                />
            )}
            {isGroupMode && (
                <div
                    style={{
                        background: 'var(--theme-colors-surface, rgba(20, 20, 35, 0.97))',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '10px',
                        bottom: '-12px',
                        boxShadow: '0 -6px 20px rgba(0, 0, 0, 0.45)',
                        left: '-10px',
                        opacity: isHovered ? 1 : 0,
                        padding: '0 10px 45px 10px',
                        pointerEvents: isHovered ? 'auto' : 'none',
                        position: 'absolute',
                        right: '-10px',
                        transform: isHovered ? 'translateY(0)' : 'translateY(6px)',
                        transition: 'opacity 180ms ease, transform 180ms ease',
                        zIndex: 200,
                    }}
                >
                    <div
                        style={{
                            color: 'var(--theme-colors-subtext, #888)',
                            fontSize: '0.62rem',
                            padding: '8px 0',
                            textAlign: 'center',
                        }}
                    >
                        {isShiftDown
                            ? "Modifying all speakers' volumes"
                            : "Hold Shift to modify all speakers' volumes"}
                    </div>
                    <div
                        style={{
                            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                            margin: '0 -10px 10px -10px',
                        }}
                    />
                    {nonCoordinators.map((m) => (
                        <GroupMemberVolumeRow
                            disabled={isShiftDown}
                            handleMemberVolume={handleMemberVolume}
                            isMinWidth={isMinWidth}
                            key={m.device.id}
                            member={m}
                            muted={memberMutes[m.device.id] ?? false}
                            onLongPress={handleLongPress}
                            onMuteToggle={handleMuteToggle}
                            volumeWheelStep={volumeWheelStep}
                            volumeWidth={volumeWidth}
                        />
                    ))}
                    <div
                        style={{
                            color: 'var(--theme-colors-primary, #6c9fff)',
                            fontSize: '0.68rem',
                            marginBottom: '4px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {coordinator?.device.name}
                    </div>
                </div>
            )}
            <div
                style={{
                    alignItems: 'center',
                    display: 'flex',
                    gap: '4px',
                    position: 'relative',
                    zIndex: 201,
                }}
            >
                <span
                    onPointerDown={startCoordLongPress}
                    onPointerLeave={cancelCoordLongPress}
                    onPointerUp={cancelCoordLongPress}
                    ref={coordButtonRef}
                    style={{ display: 'inline-flex' }}
                >
                    <ActionIcon
                        icon={muted ? 'volumeMute' : volume > 50 ? 'volumeMax' : 'volumeNormal'}
                        iconProps={{ color: muted ? 'muted' : undefined, size: 'xl' }}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (wasCoordLongPress.current) return;
                            const newMuteState = !muted;
                            if (isGroupMode && isShiftDown) {
                                const newMutes: Record<string, boolean> = {};
                                groupMembersRef.current.forEach((m) => {
                                    if (!m.isCoordinator) {
                                        newMutes[m.device.id] = newMuteState;
                                        ipc?.send('dlna-group-member-mute', {
                                            deviceId: m.device.id,
                                            muted: newMuteState,
                                        });
                                    }
                                });
                                setMemberMutes((prev) => ({ ...prev, ...newMutes }));
                            }
                            handleMute();
                        }}
                        onWheel={handleVolumeWheel}
                        size="sm"
                        tooltip={{
                            label: coordinatorIsSonos
                                ? 'Long press for speaker properties'
                                : muted
                                  ? t('player.muted', { postProcess: 'titleCase' })
                                  : volume,
                            openDelay: 0,
                        }}
                        variant="subtle"
                    />
                </span>
                {!isMinWidth ? (
                    <CustomPlayerbarSlider
                        max={100}
                        min={0}
                        onChange={handleVolumeSlider}
                        onClick={(e) => e.stopPropagation()}
                        onWheel={handleVolumeWheel}
                        size={6}
                        value={sliderValue}
                        w={volumeWidth}
                    />
                ) : null}
            </div>
        </div>
    );
};

export const RightControls = () => {
    const { showRatings } = useGeneralSettings();
    return (
        <Flex align="flex-end" direction="column" h="100%" px="1rem" py="0.5rem">
            <Group h="calc(100% / 3)">
                {showRatings && <RatingButton />}
                <AutoDJButton />
            </Group>
            <Group align="center" gap="xs" wrap="nowrap">
                <DlnaCastButton />
                <SleepTimerButton />
                <PlayerConfig />
                <LyricsButton />
                <FavoriteButton />
                <QueueButton />
                <VolumeButton />
            </Group>
            <Group h="calc(100% / 3)" />
        </Flex>
    );
};

const AutoDJButton = () => {
    const { t } = useTranslation();
    const settings = useAutoDJSettings();
    const { setSettings } = useSettingsStoreActions();
    return (
        <Button
            onClick={(e) => {
                e.stopPropagation();
                setSettings({ autoDJ: { ...settings, enabled: !settings.enabled } });
            }}
            size="compact-xs"
            style={{ color: settings.enabled ? 'var(--theme-colors-primary)' : undefined }}
            uppercase
            variant="transparent"
        >
            {t('setting.autoDJ')}
        </Button>
    );
};

const QueueButton = () => {
    const { t } = useTranslation();
    const isSidebarRightExpanded = useSidebarRightExpanded();
    const { setSideBar } = useAppStoreActions();
    const sideQueueType = useSideQueueType();
    const { bindings } = useHotkeySettings();
    const [popoverOpened, setPopoverOpened] = useState(false);
    const handleToggleQueue = () => {
        if (sideQueueType === 'sideQueue') setSideBar({ rightExpanded: !isSidebarRightExpanded });
        else setPopoverOpened((prev) => !prev);
    };
    useHotkeys([
        [bindings.toggleQueue.isGlobal ? '' : bindings.toggleQueue.hotkey, handleToggleQueue],
    ]);
    if (sideQueueType === 'sideQueue') {
        return (
            <ActionIcon
                icon={isSidebarRightExpanded ? 'panelRightClose' : 'panelRightOpen'}
                iconProps={{ size: 'lg' }}
                onClick={(e) => {
                    e.stopPropagation();
                    handleToggleQueue();
                }}
                size="sm"
                tooltip={{
                    label: t('player.viewQueue', { postProcess: 'titleCase' }),
                    openDelay: 0,
                }}
                variant="subtle"
            />
        );
    }
    return (
        <PopoverPlayQueue
            onClose={() => setPopoverOpened(false)}
            onToggle={(e) => {
                e.stopPropagation();
                handleToggleQueue();
            }}
            opened={popoverOpened}
        />
    );
};

const LyricsButton = () => {
    const setFullScreenPlayerStore = useSetFullScreenPlayerStore();
    const activeTab = useFullScreenPlayerStore((state) => state.activeTab);
    const { setStore } = useFullScreenPlayerStoreActions();
    const { expanded: isFullScreenPlayerExpanded } = useFullScreenPlayerStore();
    return (
        <ActionIcon
            icon="microphone"
            iconProps={{
                color: activeTab === 'lyrics' && isFullScreenPlayerExpanded ? 'primary' : undefined,
                size: 'lg',
            }}
            onClick={(e) => {
                e.stopPropagation();
                if (!isFullScreenPlayerExpanded) setStore({ activeTab: 'lyrics' });
                setFullScreenPlayerStore({ expanded: !isFullScreenPlayerExpanded });
            }}
            role="button"
            size="sm"
            tooltip={{ label: t('player.lyrics', { postProcess: 'titleCase' }), openDelay: 0 }}
            variant="subtle"
        />
    );
};

const FavoriteButton = () => {
    const currentSong = usePlayerSong();
    const { bindings } = useHotkeySettings();
    const addToFavoritesMutation = useCreateFavorite({});
    const removeFromFavoritesMutation = useDeleteFavorite({});
    const handleAddToFavorites = (song: QueueSong | undefined) => {
        if (!song?.id) return;
        addToFavoritesMutation.mutate({
            apiClientProps: { serverId: song._serverId || '' },
            query: { id: [song.id], type: LibraryItem.SONG },
        });
    };
    const handleRemoveFromFavorites = (song: QueueSong | undefined) => {
        if (!song?.id) return;
        removeFromFavoritesMutation.mutate({
            apiClientProps: { serverId: song._serverId || '' },
            query: { id: [song.id], type: LibraryItem.SONG },
        });
    };
    const handleToggleFavorite = (song: QueueSong | undefined) => {
        if (!song?.id) return;
        song.userFavorite ? handleRemoveFromFavorites(song) : handleAddToFavorites(song);
    };
    useFavoritePreviousSongHotkeys({
        handleAddToFavorites,
        handleRemoveFromFavorites,
        handleToggleFavorite,
    });
    useHotkeys([
        [
            bindings.favoriteCurrentAdd.isGlobal ? '' : bindings.favoriteCurrentAdd.hotkey,
            () => handleAddToFavorites(currentSong),
        ],
        [
            bindings.favoriteCurrentRemove.isGlobal ? '' : bindings.favoriteCurrentRemove.hotkey,
            () => handleRemoveFromFavorites(currentSong),
        ],
        [
            bindings.favoriteCurrentToggle.isGlobal ? '' : bindings.favoriteCurrentToggle.hotkey,
            () => handleToggleFavorite(currentSong),
        ],
    ]);
    return (
        <ActionIcon
            icon="favorite"
            iconProps={{ fill: currentSong?.userFavorite ? 'primary' : undefined, size: 'lg' }}
            onClick={(e) => {
                e.stopPropagation();
                handleToggleFavorite(currentSong);
            }}
            size="sm"
            tooltip={{
                label: currentSong?.userFavorite
                    ? t('player.unfavorite', { postProcess: 'titleCase' })
                    : t('player.favorite', { postProcess: 'titleCase' }),
                openDelay: 0,
            }}
            variant="subtle"
        />
    );
};

const useFavoritePreviousSongHotkeys = ({
    handleAddToFavorites,
    handleRemoveFromFavorites,
    handleToggleFavorite,
}: {
    handleAddToFavorites: (song: QueueSong | undefined) => void;
    handleRemoveFromFavorites: (song: QueueSong | undefined) => void;
    handleToggleFavorite: (song: QueueSong | undefined) => void;
}) => {
    const { bindings } = useHotkeySettings();
    const { previousSong } = usePlayerData();
    useHotkeys([
        [
            bindings.favoritePreviousAdd.isGlobal ? '' : bindings.favoritePreviousAdd.hotkey,
            () => handleAddToFavorites(previousSong),
        ],
        [
            bindings.favoritePreviousRemove.isGlobal ? '' : bindings.favoritePreviousRemove.hotkey,
            () => handleRemoveFromFavorites(previousSong),
        ],
        [
            bindings.favoritePreviousToggle.isGlobal ? '' : bindings.favoritePreviousToggle.hotkey,
            () => handleToggleFavorite(previousSong),
        ],
    ]);
    return null;
};

const RatingButton = () => {
    const server = useCurrentServer();
    const currentSong = usePlayerSong();
    const setRating = useSetRating();
    const { bindings } = useHotkeySettings();
    const isSongDefined = Boolean(currentSong?.id);
    const showRating =
        isSongDefined &&
        (server?.type === ServerType.NAVIDROME || server?.type === ServerType.SUBSONIC);
    const handleUpdateRating = (rating: number) => {
        if (!currentSong) return;
        setRating(currentSong._serverId, [currentSong.id], LibraryItem.SONG, rating);
    };
    useHotkeys([
        [bindings.rate0.isGlobal ? '' : bindings.rate0.hotkey, () => handleUpdateRating(0)],
        [bindings.rate1.isGlobal ? '' : bindings.rate1.hotkey, () => handleUpdateRating(1)],
        [bindings.rate2.isGlobal ? '' : bindings.rate2.hotkey, () => handleUpdateRating(2)],
        [bindings.rate3.isGlobal ? '' : bindings.rate3.hotkey, () => handleUpdateRating(3)],
        [bindings.rate4.isGlobal ? '' : bindings.rate4.hotkey, () => handleUpdateRating(4)],
        [bindings.rate5.isGlobal ? '' : bindings.rate5.hotkey, () => handleUpdateRating(5)],
    ]);
    return (
        <>
            {showRating && (
                <Rating
                    onChange={handleUpdateRating}
                    size="xs"
                    value={currentSong?.userRating || 0}
                />
            )}
        </>
    );
};
