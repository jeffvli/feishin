import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { usePlayerEvents } from '/@/renderer/features/player/audio-player/hooks/use-player-events';
import { usePlayer } from '/@/renderer/features/player/context/player-context';
import {
    usePlayerShuffle,
    usePlayerStatus,
    usePlayerStoreBase,
} from '/@/renderer/store/player.store';
import {
    useSleepTimerActions,
    useSleepTimerActive,
    useSleepTimerMode,
    useSleepTimerRemaining,
    useSleepTimerStore,
} from '/@/renderer/store/sleep-timer.store';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Button } from '/@/shared/components/button/button';
import { Divider } from '/@/shared/components/divider/divider';
import { Flex } from '/@/shared/components/flex/flex';
import { Grid } from '/@/shared/components/grid/grid';
import { Group } from '/@/shared/components/group/group';
import { NumberInput } from '/@/shared/components/number-input/number-input';
import { Popover } from '/@/shared/components/popover/popover';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';
import { PlayerShuffle, PlayerStatus } from '/@/shared/types/types';

const PRESET_OPTIONS = [
    { minutes: 0, mode: 'endOfSong' as const },
    { minutes: 0, mode: 'endOfAlbum' as const },
    { minutes: 5, mode: 'timed' as const },
    { minutes: 10, mode: 'timed' as const },
    { minutes: 15, mode: 'timed' as const },
    { minutes: 30, mode: 'timed' as const },
    { minutes: 45, mode: 'timed' as const },
    { minutes: 60, mode: 'timed' as const },
    { minutes: 120, mode: 'timed' as const },
    { minutes: 180, mode: 'timed' as const },
    { minutes: 240, mode: 'timed' as const },
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
    const { cancelTimer, setRemaining, setTargetAlbumId } = useSleepTimerActions();
    const { mediaPause } = usePlayer();

    const mediaPauseRef = useRef(mediaPause);
    mediaPauseRef.current = mediaPause;

    // End of album mode. Set the pauseOnNextSongEnd flag whenever the current track
    // is the last one of the target album.
    const evaluateEndOfAlbum = useCallback(() => {
        const { currentSong, nextSong } = usePlayerStoreBase.getState().getPlayerData();

        if (!currentSong) {
            return;
        }

        let target = useSleepTimerStore.getState().targetAlbumId;

        if (target === null) {
            target = currentSong.albumId;
            setTargetAlbumId(target);
        }

        if (currentSong.albumId !== target) {
            usePlayerStoreBase.getState().setPauseOnNextSongEnd(false);
            cancelTimer();
            return;
        }

        const isLastOfAlbum = !nextSong || nextSong.albumId !== currentSong.albumId;
        usePlayerStoreBase.getState().setPauseOnNextSongEnd(isLastOfAlbum);
    }, [cancelTimer, setTargetAlbumId]);

    const handleOnCurrentSongChange = useCallback(() => {
        if (!active) {
            return;
        }

        // Cancel and pause on song change in end-of-song mode
        if (mode === 'endOfSong') {
            cancelTimer();
            mediaPauseRef.current();
            return;
        }

        // Cancel and pause song change in end-of-album mode
        if (mode === 'endOfAlbum') {
            evaluateEndOfAlbum();
        }
    }, [active, mode, cancelTimer, evaluateEndOfAlbum, mediaPauseRef]);

    const status = usePlayerStatus();

    useEffect(() => {
        if (!active || mode !== 'timed' || status !== PlayerStatus.PLAYING) {
            return undefined;
        }

        let lastTick = Date.now();
        const interval = window.setInterval(() => {
            const now = Date.now();
            const elapsedSeconds = Math.floor((now - lastTick) / 1000);

            if (elapsedSeconds < 1) {
                return;
            }

            lastTick += elapsedSeconds * 1000;
            const remaining = useSleepTimerStore.getState().remaining;

            if (remaining <= elapsedSeconds) {
                cancelTimer();
                mediaPauseRef.current();
            } else {
                setRemaining(remaining - elapsedSeconds);
            }
        }, 1000);

        return () => window.clearInterval(interval);
    }, [active, cancelTimer, mode, setRemaining, status]);

    usePlayerEvents(
        {
            onCurrentSongChange: handleOnCurrentSongChange,
        },
        [handleOnCurrentSongChange],
    );

    // End-of-song mode: set the pauseOnNextSongEnd flag so that
    // mediaAutoNext returns PAUSED status when the current song ends.
    // This is a generic player mechanism — the web player handles it
    // without needing to know about the sleep timer.
    // End-of-album mode: set the same flag conditionally, here we run
    // the intial evaluation in case the timer was started while already
    // on the last track of the album
    useEffect(() => {
        if (!active) {
            return;
        }

        if (mode === 'endOfSong') {
            usePlayerStoreBase.getState().setPauseOnNextSongEnd(true);

            return () => {
                usePlayerStoreBase.getState().setPauseOnNextSongEnd(false);
            };
        }

        if (mode === 'endOfAlbum') {
            evaluateEndOfAlbum();

            return () => {
                usePlayerStoreBase.getState().setPauseOnNextSongEnd(false);
            };
        }

        return undefined;
    }, [active, mode, evaluateEndOfAlbum]);
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
    const { cancelTimer, startEndOfAlbumTimer, startEndOfSongTimer, startTimedTimer } =
        useSleepTimerActions();
    const { mediaPause } = usePlayer();
    const shuffle = usePlayerShuffle();
    // Track level shuffle scatters and album across a play queue making 'end-of-album'
    // meaningless. Album shuffle keeps each album intact, so keep 'end-of-'album
    // enabled there
    const isTrackShuffle = shuffle === PlayerShuffle.TRACK;

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
            } else if (option.mode === 'endOfAlbum') {
                startEndOfAlbumTimer();
            } else {
                startTimedTimer(option.minutes * 60);
            }
            setShowCustom(false);
            setOpened(false);
        },
        [startEndOfAlbumTimer, startEndOfSongTimer, startTimedTimer],
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
            return t('player.sleepTimer_endOfSong');
        }
        if (option.mode === 'endOfAlbum') {
            return t('player.sleepTimer_endOfAlbum');
        }
        if (option.minutes >= 60) {
            return t('player.sleepTimer_hours', {
                count: option.minutes / 60,
            });
        }
        return t('player.sleepTimer_minutes', {
            count: option.minutes,
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
                        label: t('player.sleepTimer'),
                        openDelay: 0,
                    }}
                    variant="subtle"
                />
            </Popover.Target>
            <Popover.Dropdown>
                <Stack gap="xs" p="xs">
                    <Text fw="600" pb="md" size="sm" ta="center">
                        {t('player.sleepTimer')}
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
                                    {t('player.sleepTimer_endOfSong')}
                                </Text>
                            ) : mode === 'endOfAlbum' ? (
                                <Text c="primary" size="sm">
                                    {t('player.sleepTimer_endOfAlbum')}
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
                                {t('player.sleepTimer_cancel')}
                            </Button>
                        </Flex>
                    )}

                    {PRESET_OPTIONS.filter(
                        (option) => option.mode === 'endOfSong' || option.mode === 'endOfAlbum',
                    ).map((option) => {
                        const disabled = option.mode === 'endOfAlbum' && isTrackShuffle;

                        return (
                            <Button
                                disabled={disabled}
                                fullWidth
                                justify="flex-start"
                                key={option.mode}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handlePreset(option);
                                }}
                                size="xs"
                                variant="outline"
                            >
                                {getPresetLabel(option)}
                            </Button>
                        );
                    })}

                    <Divider my="md" />

                    <Grid gap="xs">
                        {PRESET_OPTIONS.filter((option) => option.mode === 'timed').map(
                            (option, index) => (
                                <Grid.Col key={index} span={4}>
                                    <Button
                                        fullWidth
                                        justify="flex-start"
                                        key={index}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handlePreset(option);
                                        }}
                                        size="xs"
                                        variant="outline"
                                    >
                                        {getPresetLabel(option)}
                                    </Button>
                                </Grid.Col>
                            ),
                        )}
                    </Grid>

                    <Divider my="md" />

                    {!showCustom ? (
                        <Button
                            fullWidth
                            justify="flex-start"
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowCustom(true);
                            }}
                            size="xs"
                            ta="center"
                            variant="outline"
                        >
                            {t('player.sleepTimer_custom')}
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
                                    {t('player.sleepTimer_setCustom')}
                                </Button>
                                <Button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowCustom(false);
                                    }}
                                    size="xs"
                                    variant="default"
                                >
                                    {t('common.cancel')}
                                </Button>
                            </Group>
                        </Stack>
                    )}
                </Stack>
            </Popover.Dropdown>
        </Popover>
    );
};
