import type { CSSProperties, WheelEvent } from 'react';

import isElectron from 'is-electron';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import styles from './volume-button.module.css';

import { CustomPlayerbarSlider } from '/@/renderer/features/player/components/playerbar-slider';
import { usePlayer } from '/@/renderer/features/player/context/player-context';
import { useHotkeys } from '/@/renderer/hooks/use-hotkeys';
import {
    useHotkeySettings,
    usePlayerMuted,
    usePlayerVolume,
    useVolumeWheelStep,
    useVolumeWidth,
} from '/@/renderer/store';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Paper } from '/@/shared/components/paper/paper';
import { Switch } from '/@/shared/components/switch/switch';
import { Text } from '/@/shared/components/text/text';
import { useMediaQuery } from '/@/shared/hooks/use-media-query';
import { useThrottledCallback } from '/@/shared/hooks/use-throttled-callback';
import { useThrottledValue } from '/@/shared/hooks/use-throttled-value';

const dlnaPlayer = isElectron() ? window.api.dlnaPlayer : null;
const dlnaPlayerListener = isElectron() ? window.api.dlnaPlayerListener : null;
const ipc = isElectron() ? window.api.ipc : null;

interface DlnaGroupMember {
    device: { id: string; isPair?: boolean; name: string };
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

const adjustVolume = (volume: number, step: number, increase: boolean) =>
    Math.min(100, Math.max(0, volume + (increase ? step : -step)));

const isSonosMember = (device: { id: string }) => device.id.toUpperCase().includes('RINCON');

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
    const { t } = useTranslation();
    const [speakerProps, setSpeakerProps] = useState<null | SpeakerProperties>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!dlnaPlayer) {
            setLoading(false);
            return;
        }

        dlnaPlayer
            .getSpeakerProperties(deviceId)
            .then((properties) => setSpeakerProps(properties))
            .catch(() => setSpeakerProps(null))
            .finally(() => setLoading(false));
    }, [deviceId]);

    useEffect(() => {
        const close = (event: MouseEvent) => {
            const target = event.target as Element;
            if (!target.closest('[data-speaker-properties]')) onClose();
        };
        const timer = setTimeout(() => document.addEventListener('mousedown', close), 50);

        return () => {
            clearTimeout(timer);
            document.removeEventListener('mousedown', close);
        };
    }, [onClose]);

    const setProperty = <K extends keyof SpeakerProperties>(
        property: K,
        value: SpeakerProperties[K],
    ) => {
        if (!speakerProps) return;
        setSpeakerProps({ ...speakerProps, [property]: value });
        ipc?.send('dlna-set-speaker-property', { deviceId, property, value });
    };

    return (
        <div data-speaker-properties onClick={(event) => event.stopPropagation()}>
            <Paper
                className={styles.speakerProperties}
                radius="md"
                shadow="xl"
                style={
                    {
                        '--speaker-properties-bottom': `${window.innerHeight - triggerRect.top}px`,
                        '--speaker-properties-left': `${triggerRect.left + triggerRect.width / 2}px`,
                    } as CSSProperties
                }
            >
                <Text c="primary" className={styles.speakerName} fw={600} size="xs">
                    {deviceName}
                </Text>
                {loading && (
                    <Text c="dimmed" size="xs" ta="center">
                        {t('dlna.speakerProperties.loading')}
                    </Text>
                )}
                {!loading && !speakerProps && (
                    <Text c="red" size="xs" ta="center">
                        {t('dlna.speakerProperties.loadFailed')}
                    </Text>
                )}
                {!loading && speakerProps && (
                    <div className={styles.properties}>
                        <PropertySlider
                            label={t('dlna.speakerProperties.bass')}
                            max={10}
                            min={-10}
                            onChange={(value) => setProperty('bass', value)}
                            value={speakerProps.bass}
                        />
                        <PropertySlider
                            label={t('dlna.speakerProperties.treble')}
                            max={10}
                            min={-10}
                            onChange={(value) => setProperty('treble', value)}
                            value={speakerProps.treble}
                        />
                        <PropertyToggle
                            label={t('dlna.speakerProperties.loudness')}
                            onChange={(value) => setProperty('loudness', value)}
                            value={speakerProps.loudness}
                        />
                        <PropertyToggle
                            label={t('dlna.speakerProperties.crossfade')}
                            onChange={(value) => setProperty('crossfade', value)}
                            value={speakerProps.crossfade}
                        />
                        <PropertyToggle
                            label={t('dlna.speakerProperties.ledState')}
                            onChange={(value) => setProperty('ledState', value)}
                            value={speakerProps.ledState}
                        />
                        <PropertyToggle
                            label={t('dlna.speakerProperties.touchControls')}
                            onChange={(value) => setProperty('touchControls', value)}
                            value={speakerProps.touchControls}
                        />
                    </div>
                )}
            </Paper>
        </div>
    );
};

const PropertySlider = ({
    label,
    max,
    min,
    onChange,
    value,
}: {
    label: string;
    max: number;
    min: number;
    onChange: (value: number) => void;
    value: number;
}) => {
    const handleWheel = (event: WheelEvent) => {
        event.preventDefault();
        event.stopPropagation();
        onChange(
            event.deltaY > 0 || event.deltaX > 0
                ? Math.max(min, value - 1)
                : Math.min(max, value + 1),
        );
    };

    return (
        <div className={styles.propertySlider} onWheel={handleWheel}>
            <Text size="xs">{label}</Text>
            <CustomPlayerbarSlider
                max={max}
                min={min}
                onChange={onChange}
                onClick={(event) => event.stopPropagation()}
                size={6}
                value={value}
                w="100%"
            />
            <Text c="dimmed" size="xs" ta="right">
                {value > 0 ? `+${value}` : value}
            </Text>
        </div>
    );
};

const PropertyToggle = ({
    label,
    onChange,
    value,
}: {
    label: string;
    onChange: (value: boolean) => void;
    value: boolean;
}) => (
    <Switch
        checked={value}
        className={styles.propertyToggle}
        label={label}
        labelPosition="left"
        onChange={(event) => onChange(event.currentTarget.checked)}
        size="xs"
    />
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
    disabled: boolean;
    handleMemberVolume: (id: string, volume: number) => void;
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
        (event: WheelEvent<HTMLButtonElement | HTMLDivElement>) => {
            event.preventDefault();
            event.stopPropagation();
            const nextVolume = adjustVolume(
                member.volume,
                volumeWheelStep,
                event.deltaY <= 0 && event.deltaX <= 0,
            );
            handleMemberVolume(member.device.id, nextVolume);
            if (muted && nextVolume > 0) onMuteToggle(member.device.id, false);
        },
        [handleMemberVolume, member.device.id, member.volume, muted, onMuteToggle, volumeWheelStep],
    );

    const startLongPress = useCallback(
        (event: React.PointerEvent<HTMLElement>) => {
            if (!isSonos) return;
            wasLongPress.current = false;
            const rect = event.currentTarget.getBoundingClientRect();
            longPressTimer.current = setTimeout(() => {
                longPressTimer.current = null;
                wasLongPress.current = true;
                onLongPress(member.device.id, rect);
            }, 500);
        },
        [isSonos, member.device.id, onLongPress],
    );

    const cancelLongPress = useCallback(() => {
        if (!longPressTimer.current) return;
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
    }, []);

    return (
        <div className={styles.member} data-disabled={disabled}>
            <Text className={styles.memberName} size="xs">
                {member.device.name}
            </Text>
            <div className={styles.volumeControl}>
                <span
                    className={styles.iconTarget}
                    onPointerDown={startLongPress}
                    onPointerLeave={cancelLongPress}
                    onPointerUp={cancelLongPress}
                >
                    <ActionIcon
                        icon={
                            muted ? 'volumeMute' : member.volume > 50 ? 'volumeMax' : 'volumeNormal'
                        }
                        iconProps={{ color: muted ? 'muted' : undefined, size: 'xl' }}
                        onClick={(event) => {
                            event.stopPropagation();
                            if (!wasLongPress.current) onMuteToggle(member.device.id, !muted);
                        }}
                        onWheel={handleWheel}
                        size="sm"
                        tooltip={{
                            label: isSonos
                                ? t('dlna.speakerProperties.longPressHint')
                                : muted
                                  ? t('player.muted')
                                  : member.volume,
                            openDelay: 0,
                        }}
                        variant="subtle"
                    />
                </span>
                {!isMinWidth && (
                    <CustomPlayerbarSlider
                        max={100}
                        min={0}
                        onChange={(value) => {
                            handleMemberVolume(member.device.id, value);
                            if (muted && value > 0) onMuteToggle(member.device.id, false);
                            if (!muted && value === 0) onMuteToggle(member.device.id, true);
                        }}
                        onClick={(event) => event.stopPropagation()}
                        onWheel={handleWheel}
                        size={6}
                        value={member.volume}
                        w={volumeWidth}
                    />
                )}
            </div>
        </div>
    );
};

export const DlnaVolumeButton = () => {
    const { t } = useTranslation();
    const { bindings } = useHotkeySettings();
    const volume = usePlayerVolume();
    const muted = usePlayerMuted();
    const volumeWheelStep = useVolumeWheelStep();
    const volumeWidth = useVolumeWidth();
    const { decreaseVolume, increaseVolume, mediaToggleMute, setVolume } = usePlayer();
    const isMinWidth = useMediaQuery('(max-width: 480px)');
    const [sliderValue, setSliderValue] = useState(volume);
    const throttledVolume = useThrottledValue(sliderValue, 100);
    const [groupMembers, setGroupMembers] = useState<DlnaGroupMember[]>([]);
    const groupMembersRef = useRef<DlnaGroupMember[]>([]);
    const [isShiftDown, setIsShiftDown] = useState(false);
    const [memberMutes, setMemberMutes] = useState<Record<string, boolean>>({});
    const [propertiesTarget, setPropertiesTarget] = useState<null | {
        deviceId: string;
        deviceName: string;
        rect: DOMRect;
    }>(null);
    const coordinatorLongPressTimer = useRef<NodeJS.Timeout | null>(null);
    const wasCoordinatorLongPress = useRef(false);
    const coordinatorButtonRef = useRef<HTMLSpanElement>(null);

    const isGroupMode = groupMembers.length > 1;
    const showGroupVolumePanel =
        isGroupMode && !groupMembers.some((member) => member.device.isPair);
    const coordinator = groupMembers.find((member) => member.isCoordinator) ?? groupMembers[0];
    const nonCoordinators = groupMembers.filter((member) => !member.isCoordinator);
    const coordinatorIsSonos = coordinator ? isSonosMember(coordinator.device) : false;

    useEffect(() => {
        const updateShiftState = (event: KeyboardEvent) => setIsShiftDown(event.shiftKey);
        window.addEventListener('keydown', updateShiftState);
        window.addEventListener('keyup', updateShiftState);
        return () => {
            window.removeEventListener('keydown', updateShiftState);
            window.removeEventListener('keyup', updateShiftState);
        };
    }, []);

    useEffect(() => {
        if (!dlnaPlayer || !dlnaPlayerListener) return;

        const setGroupState = (state: DlnaGroupMember[]) => {
            groupMembersRef.current = state;
            setGroupMembers(state);
            setMemberMutes((current) =>
                Object.fromEntries(
                    state.map((member) => [member.device.id, current[member.device.id] ?? false]),
                ),
            );
        };
        const handleGroupState = (_: unknown, state: DlnaGroupMember[]) => setGroupState(state);
        const handleMemberVolume = (_: unknown, payload: { deviceId: string; volume: number }) => {
            setGroupMembers((current) => {
                const next = current.map((member) =>
                    member.device.id === payload.deviceId
                        ? { ...member, volume: payload.volume }
                        : member,
                );
                groupMembersRef.current = next;
                return next;
            });
        };
        const unsubscribeGroupState = dlnaPlayerListener.rendererDlnaGroupState(handleGroupState);
        const unsubscribeMemberVolume =
            dlnaPlayerListener.rendererDlnaGroupMemberVolume(handleMemberVolume);
        void dlnaPlayer.getGroupState().then(setGroupState);

        return () => {
            unsubscribeGroupState();
            unsubscribeMemberVolume();
        };
    }, []);

    useEffect(() => {
        setGroupMembers((current) => {
            if (current.length === 0) return current;
            const next = current.map((member) =>
                member.isCoordinator ? { ...member, volume } : member,
            );
            groupMembersRef.current = next;
            return next;
        });
    }, [volume]);

    useEffect(() => {
        setVolume(throttledVolume);
    }, [setVolume, throttledVolume]);

    useEffect(() => {
        setSliderValue(volume);
    }, [volume]);

    const handleMuteToggle = useCallback((deviceId: string, nextMuted: boolean) => {
        setMemberMutes((current) => ({ ...current, [deviceId]: nextMuted }));
        ipc?.send('dlna-group-member-mute', { deviceId, muted: nextMuted });
    }, []);

    const handleMemberVolume = useCallback((deviceId: string, nextVolume: number) => {
        void dlnaPlayer?.setGroupMemberVolume(deviceId, nextVolume);
        setGroupMembers((current) => {
            const next = current.map((member) =>
                member.device.id === deviceId ? { ...member, volume: nextVolume } : member,
            );
            groupMembersRef.current = next;
            return next;
        });
    }, []);

    const applyVolumeToGroup = useCallback(
        (nextVolume: number) => {
            groupMembersRef.current.forEach((member) => {
                if (!member.isCoordinator) handleMemberVolume(member.device.id, nextVolume);
            });
        },
        [handleMemberVolume],
    );

    const handleMute = useCallback(() => mediaToggleMute(), [mediaToggleMute]);
    const handleVolumeSlider = useCallback(
        (nextVolume: number) => {
            if (showGroupVolumePanel && !isShiftDown) applyVolumeToGroup(nextVolume);
            setSliderValue(nextVolume);
        },
        [applyVolumeToGroup, isShiftDown, showGroupVolumePanel],
    );
    const handleVolumeWheel = useCallback(
        (event: WheelEvent<HTMLButtonElement | HTMLDivElement>) => {
            event.preventDefault();
            event.stopPropagation();
            const nextVolume = adjustVolume(
                sliderValue,
                volumeWheelStep,
                event.deltaY <= 0 && event.deltaX <= 0,
            );
            if (showGroupVolumePanel && !isShiftDown) applyVolumeToGroup(nextVolume);
            setSliderValue(nextVolume);
        },
        [applyVolumeToGroup, isShiftDown, showGroupVolumePanel, sliderValue, volumeWheelStep],
    );

    const handleVolumeDown = useThrottledCallback(() => decreaseVolume(volumeWheelStep), 100);
    const handleVolumeUp = useThrottledCallback(() => increaseVolume(volumeWheelStep), 100);

    useHotkeys([
        [bindings.volumeDown.isGlobal ? '' : bindings.volumeDown.hotkey, handleVolumeDown],
        [bindings.volumeUp.isGlobal ? '' : bindings.volumeUp.hotkey, handleVolumeUp],
        [bindings.volumeMute.isGlobal ? '' : bindings.volumeMute.hotkey, handleMute],
    ]);

    const handleLongPress = useCallback((deviceId: string, rect: DOMRect) => {
        const member = groupMembersRef.current.find((item) => item.device.id === deviceId);
        if (!member) return;
        setPropertiesTarget({ deviceId, deviceName: member.device.name, rect });
    }, []);

    const startCoordinatorLongPress = useCallback(() => {
        if (!coordinatorIsSonos || !coordinator) return;
        wasCoordinatorLongPress.current = false;
        const rect = coordinatorButtonRef.current?.getBoundingClientRect();
        if (!rect) return;
        coordinatorLongPressTimer.current = setTimeout(() => {
            coordinatorLongPressTimer.current = null;
            wasCoordinatorLongPress.current = true;
            setPropertiesTarget({
                deviceId: coordinator.device.id,
                deviceName: coordinator.device.name,
                rect,
            });
        }, 500);
    }, [coordinator, coordinatorIsSonos]);

    const cancelCoordinatorLongPress = useCallback(() => {
        if (!coordinatorLongPressTimer.current) return;
        clearTimeout(coordinatorLongPressTimer.current);
        coordinatorLongPressTimer.current = null;
    }, []);

    return (
        <div className={styles.root}>
            {propertiesTarget && (
                <SpeakerPropertiesPopover
                    deviceId={propertiesTarget.deviceId}
                    deviceName={propertiesTarget.deviceName}
                    onClose={() => setPropertiesTarget(null)}
                    triggerRect={propertiesTarget.rect}
                />
            )}
            {showGroupVolumePanel && (
                <Paper className={styles.groupPanel} radius="md" shadow="xl">
                    <Text c="dimmed" className={styles.groupMode} size="xs" ta="center">
                        {isShiftDown
                            ? t('dlna.volume.individualControl')
                            : t('dlna.volume.groupControl')}
                    </Text>
                    <div className={styles.divider} />
                    {nonCoordinators.map((member) => (
                        <GroupMemberVolumeRow
                            disabled={!isShiftDown}
                            handleMemberVolume={handleMemberVolume}
                            isMinWidth={isMinWidth}
                            key={member.device.id}
                            member={member}
                            muted={memberMutes[member.device.id] ?? false}
                            onLongPress={handleLongPress}
                            onMuteToggle={handleMuteToggle}
                            volumeWheelStep={volumeWheelStep}
                            volumeWidth={volumeWidth}
                        />
                    ))}
                    <Text c="primary" className={styles.memberName} size="xs">
                        {coordinator?.device.name}
                    </Text>
                </Paper>
            )}
            <div className={styles.volumeControl}>
                <span
                    className={styles.iconTarget}
                    onPointerDown={startCoordinatorLongPress}
                    onPointerLeave={cancelCoordinatorLongPress}
                    onPointerUp={cancelCoordinatorLongPress}
                    ref={coordinatorButtonRef}
                >
                    <ActionIcon
                        icon={muted ? 'volumeMute' : volume > 50 ? 'volumeMax' : 'volumeNormal'}
                        iconProps={{ color: muted ? 'muted' : undefined, size: 'xl' }}
                        onClick={(event) => {
                            event.stopPropagation();
                            if (wasCoordinatorLongPress.current) return;
                            const nextMuted = !muted;
                            if (showGroupVolumePanel && !isShiftDown) {
                                const nextMutes = Object.fromEntries(
                                    nonCoordinators.map((member) => {
                                        ipc?.send('dlna-group-member-mute', {
                                            deviceId: member.device.id,
                                            muted: nextMuted,
                                        });
                                        return [member.device.id, nextMuted];
                                    }),
                                );
                                setMemberMutes((current) => ({ ...current, ...nextMutes }));
                            }
                            handleMute();
                        }}
                        onWheel={handleVolumeWheel}
                        size="sm"
                        tooltip={{
                            label: coordinatorIsSonos
                                ? t('dlna.speakerProperties.longPressHint')
                                : muted
                                  ? t('player.muted')
                                  : volume,
                            openDelay: 0,
                        }}
                        variant="subtle"
                    />
                </span>
                {!isMinWidth && (
                    <CustomPlayerbarSlider
                        max={100}
                        min={0}
                        onChange={handleVolumeSlider}
                        onClick={(event) => event.stopPropagation()}
                        onWheel={handleVolumeWheel}
                        size={6}
                        value={sliderValue}
                        w={volumeWidth}
                    />
                )}
            </div>
        </div>
    );
};
