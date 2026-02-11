import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { usePlayerEvents } from '/@/renderer/features/player/audio-player/hooks/use-player-events';
import { usePlayer } from '/@/renderer/features/player/context/player-context';
import { usePlayerStatus, usePlayerStoreBase } from '/@/renderer/store/player.store';
import {
    useSleepTimerActions,
    useSleepTimerActive,
    useSleepTimerMode,
    useSleepTimerRemaining,
    useSleepTimerStore,
} from '/@/renderer/store/sleep-timer.store';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Button } from '/@/shared/components/button/button';
import { Flex } from '/@/shared/components/flex/flex';
import { Group } from '/@/shared/components/group/group';
import { NumberInput } from '/@/shared/components/number-input/number-input';
import { Popover } from '/@/shared/components/popover/popover';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';
import { PlayerStatus } from '/@/shared/types/types';

const PRESET_OPTIONS = [
    { minutes: 0, mode: 'endOfSong' as const },
    { minutes: 5, mode: 'timed' as const },
    { minutes: 10, mode: 'timed' as const },
    { minutes: 15, mode: 'timed' as const },
    { minutes: 30, mode: 'timed' as const },
    { minutes: 45, mode: 'timed' as const },
    { minutes: 60, mode: 'timed' as const },
    { minutes: 120, mode: 'timed' as const },
];

function formatRemaining(totalSeconds: number): string {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = Math.floor(totalSeconds % 60);

    if (h > 0) {
        return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${m}:${String(s).padStart(2, '0')}`;
}

const useSleepTimer = () => {
    const active = useSleepTimerActive();
    const mode = useSleepTimerMode();
    const { cancelTimer, setRemaining } = useSleepTimerActions();
    const { mediaPause } = usePlayer();

    const mediaPauseRef = useRef(mediaPause);
    mediaPauseRef.current = mediaPause;

    const handleOnCurrentSongChange = useCallback(() => {
        if (!active) {
            return;
        }

        // Cancel and pause on song change in end-of-song mode
        if (mode === 'endOfSong') {
            cancelTimer();
            mediaPauseRef.current();
        }
    }, [active, mode, cancelTimer, mediaPauseRef]);

    const status = usePlayerStatus();

    const handleOnPlayerProgress = useCallback(() => {
        if (!active) {
            return;
        }

        if (status !== PlayerStatus.PLAYING) {
            return;
        }

        // Count down in timed mode
        if (mode === 'timed') {
            const remaining = useSleepTimerStore.getState().remaining;

            if (remaining <= 0) {
                cancelTimer();
                mediaPauseRef.current();
            } else {
                setRemaining(Math.max(0, remaining - 1));
            }
        }
    }, [active, cancelTimer, mode, setRemaining, status]);

    usePlayerEvents(
        {
            onCurrentSongChange: handleOnCurrentSongChange,
            onPlayerProgress: handleOnPlayerProgress,
        },
        [handleOnCurrentSongChange, handleOnPlayerProgress],
    );

    // End-of-song mode: subscribe to player index changes
    useEffect(() => {
        if (!active || mode !== 'endOfSong') return;

        const initialIndex = usePlayerStoreBase.getState().player.index;

        const unsub = usePlayerStoreBase.subscribe(
            (state) => state.player.index,
            (index) => {
                if (index !== initialIndex) {
                    cancelTimer();
                    mediaPauseRef.current();
                }
            },
        );

        return () => unsub();
    }, [active, mode, cancelTimer]);
};

export const SleepTimerHookInner = () => {
    useSleepTimer();
    return null;
};

export const SleepTimerHook = () => {
    const active = useSleepTimerActive();

    if (!active) {
        return null;
    }

    return React.createElement(SleepTimerHookInner);
};

export const SleepTimerButton = () => {
    const { t } = useTranslation();
    const active = useSleepTimerActive();
    const mode = useSleepTimerMode();
    const remaining = useSleepTimerRemaining();
    const { cancelTimer, startEndOfSongTimer, startTimedTimer } = useSleepTimerActions();
    const { mediaPause } = usePlayer();

    const [showCustom, setShowCustom] = useState(false);
    const [customHours, setCustomHours] = useState<number>(0);
    const [customMinutes, setCustomMinutes] = useState<number>(20);
    const [customSeconds, setCustomSeconds] = useState<number>(0);
    const [opened, setOpened] = useState(false);

    const mediaPauseRef = useRef(mediaPause);
    mediaPauseRef.current = mediaPause;

    const handlePreset = useCallback(
        (option: (typeof PRESET_OPTIONS)[number]) => {
            if (option.mode === 'endOfSong') {
                startEndOfSongTimer();
            } else {
                startTimedTimer(option.minutes * 60);
            }
            setShowCustom(false);
            setOpened(false);
        },
        [startEndOfSongTimer, startTimedTimer],
    );

    const handleCustomStart = useCallback(() => {
        const totalSeconds = customHours * 3600 + customMinutes * 60 + customSeconds;
        if (totalSeconds > 0) {
            startTimedTimer(totalSeconds);
            setShowCustom(false);
            setOpened(false);
        }
    }, [customHours, customMinutes, customSeconds, startTimedTimer]);

    const handleCancel = useCallback(() => {
        cancelTimer();
        setShowCustom(false);
    }, [cancelTimer]);

    const getPresetLabel = (option: (typeof PRESET_OPTIONS)[number]) => {
        if (option.mode === 'endOfSong') {
            return t('player.sleepTimer_endOfSong', { postProcess: 'sentenceCase' });
        }
        if (option.minutes >= 60) {
            return t('player.sleepTimer_hours', {
                count: option.minutes / 60,
                postProcess: 'sentenceCase',
            });
        }
        return t('player.sleepTimer_minutes', {
            count: option.minutes,
            postProcess: 'sentenceCase',
        });
    };

    return (
        <Popover onChange={setOpened} opened={opened} position="top" width={260}>
            <Popover.Target>
                <ActionIcon
                    icon={active ? 'sleepTimer' : 'sleepTimerOff'}
                    iconProps={{
                        color: active ? 'primary' : undefined,
                        size: 'lg',
                    }}
                    onClick={(e) => {
                        e.stopPropagation();
                        setOpened((prev) => !prev);
                    }}
                    size="sm"
                    tooltip={{
                        label: t('player.sleepTimer', { postProcess: 'titleCase' }),
                        openDelay: 0,
                    }}
                    variant="subtle"
                />
            </Popover.Target>
            <Popover.Dropdown>
                <Stack gap="xs" p="xs">
                    <Text fw="600" size="sm" ta="center">
                        {t('player.sleepTimer', { postProcess: 'titleCase' })}
                    </Text>

                    {active && (
                        <Flex
                            align="center"
                            direction="column"
                            gap={4}
                            mb="xs"
                            style={{
                                background: 'var(--theme-colors-surface)',
                                borderRadius: 'var(--theme-radius-md)',
                                padding: 'var(--theme-spacing-sm) var(--theme-spacing-md)',
                            }}
                        >
                            {mode === 'endOfSong' ? (
                                <Text c="primary" size="sm">
                                    {t('player.sleepTimer_endOfSong', {
                                        postProcess: 'sentenceCase',
                                    })}
                                </Text>
                            ) : (
                                <Text c="primary" fw="600" size="lg">
                                    {formatRemaining(remaining)}
                                </Text>
                            )}
                            <Button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleCancel();
                                }}
                                size="compact-xs"
                                variant="subtle"
                            >
                                {t('player.sleepTimer_cancel', { postProcess: 'titleCase' })}
                            </Button>
                        </Flex>
                    )}

                    {PRESET_OPTIONS.map((option, index) => (
                        <Button
                            fullWidth
                            justify="flex-start"
                            key={index}
                            onClick={(e) => {
                                e.stopPropagation();
                                handlePreset(option);
                            }}
                            size="xs"
                            variant="subtle"
                        >
                            {getPresetLabel(option)}
                        </Button>
                    ))}

                    {!showCustom ? (
                        <Button
                            fullWidth
                            justify="flex-start"
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowCustom(true);
                            }}
                            size="xs"
                            variant="subtle"
                        >
                            {t('player.sleepTimer_custom', { postProcess: 'sentenceCase' })}
                        </Button>
                    ) : (
                        <Stack gap="xs">
                            <Group gap={4} wrap="nowrap">
                                <NumberInput
                                    max={23}
                                    min={0}
                                    onChange={(val) => setCustomHours(Number(val) || 0)}
                                    placeholder="hr"
                                    size="xs"
                                    value={customHours}
                                />
                                <Text>:</Text>
                                <NumberInput
                                    max={59}
                                    min={0}
                                    onChange={(val) => setCustomMinutes(Number(val) || 0)}
                                    placeholder="min"
                                    size="xs"
                                    value={customMinutes}
                                />
                                <Text>:</Text>
                                <NumberInput
                                    max={59}
                                    min={0}
                                    onChange={(val) => setCustomSeconds(Number(val) || 0)}
                                    placeholder="sec"
                                    size="xs"
                                    value={customSeconds}
                                />
                            </Group>
                            <Group gap="xs" grow>
                                <Button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleCustomStart();
                                    }}
                                    size="xs"
                                    variant="filled"
                                >
                                    {t('player.sleepTimer_setCustom', { postProcess: 'titleCase' })}
                                </Button>
                                <Button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowCustom(false);
                                    }}
                                    size="xs"
                                    variant="default"
                                >
                                    {t('common.cancel', { postProcess: 'titleCase' })}
                                </Button>
                            </Group>
                        </Stack>
                    )}
                </Stack>
            </Popover.Dropdown>
        </Popover>
    );
};
