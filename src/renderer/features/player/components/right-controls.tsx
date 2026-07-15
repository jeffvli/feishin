import { t } from 'i18next';
import { useCallback, useEffect, useMemo, useState, WheelEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { PopoverPlayQueue } from '/@/renderer/features/now-playing/components/popover-play-queue';
import { PlayerConfig } from '/@/renderer/features/player/components/player-config';
import { CustomPlayerbarSlider } from '/@/renderer/features/player/components/playerbar-slider';
import { SleepTimerButton } from '/@/renderer/features/player/components/sleep-timer-button';
import { usePlayer } from '/@/renderer/features/player/context/player-context';
import { useAudioDevices } from '/@/renderer/features/settings/components/playback/audio-settings';
import { useSetRating } from '/@/renderer/features/shared/hooks/use-set-rating';
import { useCreateFavorite } from '/@/renderer/features/shared/mutations/create-favorite-mutation';
import { useDeleteFavorite } from '/@/renderer/features/shared/mutations/delete-favorite-mutation';
import { useHotkeys } from '/@/renderer/hooks/use-hotkeys';
import {
    AUTO_DJ_MODE,
    AUTO_DJ_STRATEGY,
    type AutoDJStrategy,
    useAppStoreActions,
    useAutoDJSettings,
    useCurrentServer,
    useFullScreenPlayerStore,
    useGeneralSettings,
    useHotkeySettings,
    usePlaybackSettings,
    usePlaybackType,
    usePlayerData,
    usePlayerMuted,
    usePlayerSong,
    usePlayerVolume,
    useSetFullScreenPlayerStore,
    useSettingsStoreActions,
    useSidebarRightExpanded,
    useSideQueueType,
    useVolumeMax,
    useVolumeWheelStep,
    useVolumeWidth,
} from '/@/renderer/store';
import { useFullScreenPlayerStoreActions } from '/@/renderer/store/full-screen-player.store';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Button } from '/@/shared/components/button/button';
import { ContextMenu } from '/@/shared/components/context-menu/context-menu';
import { Flex } from '/@/shared/components/flex/flex';
import { Group } from '/@/shared/components/group/group';
import { NumberInput } from '/@/shared/components/number-input/number-input';
import { Paper } from '/@/shared/components/paper/paper';
import { Popover } from '/@/shared/components/popover/popover';
import { Rating } from '/@/shared/components/rating/rating';
import { SegmentedControl } from '/@/shared/components/segmented-control/segmented-control';
import { Select } from '/@/shared/components/select/select';
import { Stack } from '/@/shared/components/stack/stack';
import { Switch } from '/@/shared/components/switch/switch';
import { Text } from '/@/shared/components/text/text';
import { useMediaQuery } from '/@/shared/hooks/use-media-query';
import { useThrottledCallback } from '/@/shared/hooks/use-throttled-callback';
import { useThrottledValue } from '/@/shared/hooks/use-throttled-value';
import { LibraryItem, QueueSong, ServerType } from '/@/shared/types/domain-types';
import { PlayerType } from '/@/shared/types/types';

const calculateVolumeUp = (volume: number, volumeWheelStep: number, volumeMax: number) => {
    let volumeToSet: number;
    const newVolumeGreaterThanMax = volume + volumeWheelStep > volumeMax;
    if (newVolumeGreaterThanMax) {
        volumeToSet = volumeMax;
    } else {
        volumeToSet = volume + volumeWheelStep;
    }

    return volumeToSet;
};

const calculateVolumeDown = (volume: number, volumeWheelStep: number) => {
    let volumeToSet: number;
    const newVolumeLessThanZero = volume - volumeWheelStep < 0;
    if (newVolumeLessThanZero) {
        volumeToSet = 0;
    } else {
        volumeToSet = volume - volumeWheelStep;
    }

    return volumeToSet;
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

    const itemLabels = useMemo(() => {
        return {
            description: t('setting.autoDJ_itemCount_description'),
            title: t('setting.autoDJ_itemCount'),
        };
    }, [t]);

    const strategySelectData = useMemo(
        () => [
            {
                label: t('setting.autoDJ_strategy_option_similar'),
                value: AUTO_DJ_STRATEGY.SIMILAR,
            },
            {
                label: t('setting.autoDJ_strategy_option_library_random'),
                value: AUTO_DJ_STRATEGY.LIBRARY_RANDOM,
            },
        ],
        [t],
    );

    const strategyLabels =
        settings.mode === AUTO_DJ_MODE.ALBUMS
            ? {
                  description: '',
                  title: t('setting.autoDJ_albumStrategy'),
              }
            : {
                  description: '',
                  title: t('setting.autoDJ_songStrategy'),
              };

    const strategyValue =
        settings.mode === AUTO_DJ_MODE.ALBUMS
            ? (settings.albumStrategy ?? AUTO_DJ_STRATEGY.SIMILAR)
            : (settings.songStrategy ?? AUTO_DJ_STRATEGY.SIMILAR);

    return (
        <Popover position="top-end" withArrow>
            <Popover.Target>
                <Button
                    onClick={(e) => {
                        e.stopPropagation();
                    }}
                    size="compact-xs"
                    style={{ color: settings.enabled ? 'var(--theme-colors-primary)' : undefined }}
                    uppercase
                    variant="transparent"
                >
                    {t('setting.autoDJ')}
                </Button>
            </Popover.Target>
            <Popover.Dropdown maw={320} miw={260} onClick={(e) => e.stopPropagation()} p="sm">
                <Stack gap="sm">
                    <Paper p="md" radius="md">
                        <Group align="center" gap="xs" justify="space-between" wrap="nowrap">
                            <Text fw={600} isNoSelect size="sm">
                                {t('setting.autoDJ_enabled')}
                            </Text>
                            <Switch
                                checked={settings.enabled}
                                onChange={(e) =>
                                    setSettings({
                                        autoDJ: { enabled: e.currentTarget.checked },
                                    })
                                }
                            />
                        </Group>
                    </Paper>
                    <SegmentedControl
                        data={[
                            { label: t('setting.autoDJ_mode_songs'), value: AUTO_DJ_MODE.SONGS },
                            {
                                label: t('setting.autoDJ_mode_albums'),
                                value: AUTO_DJ_MODE.ALBUMS,
                            },
                        ]}
                        onChange={(value) =>
                            setSettings({
                                autoDJ: {
                                    mode: value as 'albums' | 'songs',
                                },
                            })
                        }
                        value={settings.mode}
                        w="100%"
                    />
                    <Select
                        comboboxProps={{ withinPortal: false }}
                        data={strategySelectData}
                        description={strategyLabels.description}
                        label={strategyLabels.title}
                        onChange={(value) => {
                            if (!value) return;
                            setSettings({
                                autoDJ:
                                    settings.mode === AUTO_DJ_MODE.ALBUMS
                                        ? { albumStrategy: value as AutoDJStrategy }
                                        : { songStrategy: value as AutoDJStrategy },
                            });
                        }}
                        size="md"
                        value={strategyValue}
                        w="100%"
                    />
                    <NumberInput
                        aria-label={itemLabels.title}
                        description={itemLabels.description}
                        hideControls={false}
                        label={itemLabels.title}
                        max={50}
                        min={1}
                        onChange={(e) =>
                            setSettings({
                                autoDJ: {
                                    itemCount: Number(e),
                                },
                            })
                        }
                        size="md"
                        value={Number(settings.itemCount)}
                    />
                    <NumberInput
                        aria-label={t('setting.autoDJ_timing')}
                        description={t('setting.autoDJ_timing_description')}
                        hideControls={false}
                        label={t('setting.autoDJ_timing')}
                        max={5}
                        min={1}
                        onChange={(e) =>
                            setSettings({
                                autoDJ: {
                                    timing: Number(e),
                                },
                            })
                        }
                        size="md"
                        value={Number(settings.timing)}
                    />
                </Stack>
            </Popover.Dropdown>
        </Popover>
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
        if (sideQueueType === 'sideQueue') {
            setSideBar({ rightExpanded: !isSidebarRightExpanded });
        } else {
            setPopoverOpened((prev) => !prev);
        }
    };

    const handlePopoverClose = () => {
        setPopoverOpened(false);
    };

    useHotkeys([
        [bindings.toggleQueue.isGlobal ? '' : bindings.toggleQueue.hotkey, handleToggleQueue],
    ]);

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();

        if (sideQueueType === 'sideQueue') {
            return handleToggleQueue();
        }
    };

    if (sideQueueType === 'sideQueue') {
        return (
            <ActionIcon
                icon={isSidebarRightExpanded ? 'panelRightClose' : 'panelRightOpen'}
                iconProps={{
                    size: 'lg',
                }}
                onClick={handleClick}
                size="sm"
                tooltip={{
                    label: t('player.viewQueue'),
                    openDelay: 0,
                }}
                variant="subtle"
            />
        );
    }

    return (
        <PopoverPlayQueue
            onClose={handlePopoverClose}
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

    const expandFullScreenPlayer = () => {
        setFullScreenPlayerStore({ expanded: !isFullScreenPlayerExpanded });
    };

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
                expandFullScreenPlayer();
            }}
            role="button"
            size="sm"
            tooltip={{
                label: t('player.lyrics'),
                openDelay: 0,
            }}
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
            apiClientProps: { serverId: song?._serverId || '' },
            query: {
                id: [song.id],
                type: LibraryItem.SONG,
            },
        });
    };

    const handleRemoveFromFavorites = (song: QueueSong | undefined) => {
        if (!song?.id) return;

        removeFromFavoritesMutation.mutate({
            apiClientProps: { serverId: song?._serverId || '' },
            query: {
                id: [song.id],
                type: LibraryItem.SONG,
            },
        });
    };

    const handleToggleFavorite = (song: QueueSong | undefined) => {
        if (!song?.id) return;

        if (song.userFavorite) {
            handleRemoveFromFavorites(song);
        } else {
            handleAddToFavorites(song);
        }
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
            iconProps={{
                fill: currentSong?.userFavorite ? 'primary' : undefined,
                size: 'lg',
            }}
            onClick={(e) => {
                e.stopPropagation();
                handleToggleFavorite(currentSong);
            }}
            size="sm"
            tooltip={{
                label: currentSong?.userFavorite ? t('player.unfavorite') : t('player.favorite'),
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

    const isSongDefined = Boolean(currentSong?.id);
    const showRating =
        isSongDefined &&
        (server?.type === ServerType.NAVIDROME || server?.type === ServerType.SUBSONIC);

    const handleUpdateRating = (rating: number) => {
        if (!currentSong) return;

        setRating(currentSong._serverId, [currentSong.id], LibraryItem.SONG, rating);
    };

    const { bindings } = useHotkeySettings();

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

const VolumeButton = () => {
    const { bindings } = useHotkeySettings();
    const volume = usePlayerVolume();
    const muted = usePlayerMuted();
    const volumeWheelStep = useVolumeWheelStep();
    const volumeWidth = useVolumeWidth();
    const volumeMax = useVolumeMax();
    const { decreaseVolume, increaseVolume, mediaToggleMute, setVolume } = usePlayer();
    const isMinWidth = useMediaQuery('(max-width: 480px)');

    const playbackType = usePlaybackType();
    const playbackSettings = usePlaybackSettings();
    const { setSettings } = useSettingsStoreActions();
    const audioDevices = useAudioDevices(playbackType);

    const currentAudioDeviceId =
        playbackType === PlayerType.LOCAL
            ? playbackSettings.mpvAudioDeviceId
            : playbackSettings.audioDeviceId;

    const handleSelectAudioDevice = useCallback(
        (deviceId: null | string) => {
            setSettings({
                playback:
                    playbackType === PlayerType.LOCAL
                        ? { mpvAudioDeviceId: deviceId }
                        : { audioDeviceId: deviceId },
            });
        },
        [playbackType, setSettings],
    );

    const [sliderValue, setSliderValue] = useState(volume);

    const throttledVolume = useThrottledValue(sliderValue, 100);

    // Sync throttled value to actual volume
    useEffect(() => {
        setVolume(throttledVolume);
    }, [throttledVolume, setVolume]);

    // Sync external volume changes to local state
    useEffect(() => {
        setSliderValue(volume);
    }, [volume]);

    const handleVolumeDown = useCallback(() => {
        decreaseVolume(volumeWheelStep);
    }, [decreaseVolume, volumeWheelStep]);

    const handleVolumeUp = useCallback(() => {
        increaseVolume(volumeWheelStep);
    }, [increaseVolume, volumeWheelStep]);

    const handleVolumeSlider = useCallback((e: number) => {
        setSliderValue(e);
    }, []);

    const handleMute = useCallback(() => {
        mediaToggleMute();
    }, [mediaToggleMute]);

    const handleVolumeWheel = useCallback(
        (e: WheelEvent<HTMLButtonElement | HTMLDivElement>) => {
            let volumeToSet;
            if (e.deltaY > 0 || e.deltaX > 0) {
                volumeToSet = calculateVolumeDown(volume, volumeWheelStep);
            } else {
                volumeToSet = calculateVolumeUp(volume, volumeWheelStep, volumeMax);
            }

            setVolume(volumeToSet);
        },
        [setVolume, volume, volumeWheelStep, volumeMax],
    );

    const handleVolumeDownThrottled = useThrottledCallback(handleVolumeDown, 100);
    const handleVolumeUpThrottled = useThrottledCallback(handleVolumeUp, 100);

    useHotkeys([
        [bindings.volumeDown.isGlobal ? '' : bindings.volumeDown.hotkey, handleVolumeDownThrottled],
        [bindings.volumeUp.isGlobal ? '' : bindings.volumeUp.hotkey, handleVolumeUpThrottled],
        [bindings.volumeMute.isGlobal ? '' : bindings.volumeMute.hotkey, handleMute],
    ]);

    return (
        <>
            <ContextMenu>
                <ContextMenu.Target>
                    {/*
                     * ActionIcon renders a Mantine Tooltip wrapper, which does not
                     * forward the onContextMenu/ref that Radix injects via asChild to
                     * the underlying button. Wrap in a real DOM node so right-click
                     * reliably opens the menu.
                     */}
                    <div style={{ alignItems: 'center', display: 'flex' }}>
                        <ActionIcon
                            icon={muted ? 'volumeMute' : volume > 50 ? 'volumeMax' : 'volumeNormal'}
                            iconProps={{
                                color: muted ? 'muted' : undefined,
                                size: 'xl',
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleMute();
                            }}
                            onWheel={handleVolumeWheel}
                            size="sm"
                            tooltip={{
                                label: muted ? t('player.muted') : volume,
                                openDelay: 0,
                            }}
                            variant="subtle"
                        />
                    </div>
                </ContextMenu.Target>
                <ContextMenu.Content>
                    <ContextMenu.Item
                        isSelected={!currentAudioDeviceId}
                        onSelect={() => handleSelectAudioDevice(null)}
                    >
                        {t('setting.audioDeviceDefault', { defaultValue: 'System default' })}
                    </ContextMenu.Item>
                    {audioDevices.length > 0 && <ContextMenu.Divider />}
                    {audioDevices.map((device) => (
                        <ContextMenu.Item
                            isSelected={device.value === currentAudioDeviceId}
                            key={device.value}
                            onSelect={() => handleSelectAudioDevice(device.value)}
                        >
                            {device.label || device.value}
                        </ContextMenu.Item>
                    ))}
                </ContextMenu.Content>
            </ContextMenu>
            {!isMinWidth ? (
                <CustomPlayerbarSlider
                    max={volumeMax}
                    min={0}
                    onChange={handleVolumeSlider}
                    onClick={(e) => {
                        e.stopPropagation();
                    }}
                    onWheel={handleVolumeWheel}
                    size={6}
                    value={sliderValue}
                    w={volumeWidth}
                />
            ) : null}
        </>
    );
};
