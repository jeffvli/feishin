import type { WheelEvent } from 'react';

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

const adjustVolume = (volume: number, step: number, increase: boolean) =>
    Math.min(100, Math.max(0, volume + (increase ? step : -step)));

const GroupMemberVolumeRow = ({
    disabled,
    handleMemberVolume,
    isMinWidth,
    member,
    muted,
    onMuteToggle,
    volumeWheelStep,
    volumeWidth,
}: {
    disabled: boolean;
    handleMemberVolume: (id: string, volume: number) => void;
    isMinWidth: boolean;
    member: DlnaGroupMember;
    muted: boolean;
    onMuteToggle: (deviceId: string, muted: boolean) => void;
    volumeWheelStep: number;
    volumeWidth: number | string;
}) => {
    const { t } = useTranslation();

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

    return (
        <div className={styles.member} data-disabled={disabled}>
            <Text className={styles.memberName} size="xs">
                {member.device.name}
            </Text>
            <div className={styles.volumeControl}>
                <span className={styles.iconTarget}>
                    <ActionIcon
                        icon={
                            muted ? 'volumeMute' : member.volume > 50 ? 'volumeMax' : 'volumeNormal'
                        }
                        iconProps={{ color: muted ? 'muted' : undefined, size: 'xl' }}
                        onClick={(event) => {
                            event.stopPropagation();
                            onMuteToggle(member.device.id, !muted);
                        }}
                        onWheel={handleWheel}
                        size="sm"
                        tooltip={{ label: muted ? t('player.muted') : member.volume, openDelay: 0 }}
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
    const isGroupMode = groupMembers.length > 1;
    const showGroupVolumePanel =
        isGroupMode && !groupMembers.some((member) => member.device.isPair);
    const coordinator = groupMembers.find((member) => member.isCoordinator) ?? groupMembers[0];
    const nonCoordinators = groupMembers.filter((member) => !member.isCoordinator);

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

    return (
        <div className={styles.root}>
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
                <span className={styles.iconTarget}>
                    <ActionIcon
                        icon={muted ? 'volumeMute' : volume > 50 ? 'volumeMax' : 'volumeNormal'}
                        iconProps={{ color: muted ? 'muted' : undefined, size: 'xl' }}
                        onClick={(event) => {
                            event.stopPropagation();
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
                        tooltip={{ label: muted ? t('player.muted') : volume, openDelay: 0 }}
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
