import { t } from 'i18next';
import { useCallback, useEffect, useState, WheelEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { PopoverPlayQueue } from '/@/renderer/features/now-playing/components/popover-play-queue';
import { PlayerConfig } from '/@/renderer/features/player/components/player-config';
import { CustomPlayerbarSlider } from '/@/renderer/features/player/components/playerbar-slider';
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

const calculateVolumeUp = (volume: number, volumeWheelStep: number) => {
    let volumeToSet: number;
    const newVolumeGreaterThanHundred = volume + volumeWheelStep > 100;
    if (newVolumeGreaterThanHundred) {
        volumeToSet = 100;
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

    const toggleAutoDJ = () => {
        setSettings({
            autoDJ: {
                ...settings,
                enabled: !settings.enabled,
            },
        });
    };

    return (
        <Button
            onClick={(e) => {
                e.stopPropagation();
                toggleAutoDJ();
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
                    label: t('player.viewQueue', { postProcess: 'titleCase' }),
                    openDelay: 0,
                }}
                variant="subtle"
            />
        );
    }

    return (
        <PopoverPlayQueue
            onClose={handlePopoverClose}
            onToggle={handleToggleQueue}
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
                label: t('player.lyrics', { postProcess: 'titleCase' }),
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
    const { decreaseVolume, increaseVolume, mediaToggleMute, setVolume } = usePlayer();
    const isMinWidth = useMediaQuery('(max-width: 480px)');

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
                volumeToSet = calculateVolumeUp(volume, volumeWheelStep);
            }

            setVolume(volumeToSet);
        },
        [setVolume, volume, volumeWheelStep],
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
                    label: muted ? t('player.muted', { postProcess: 'titleCase' }) : volume,
                    openDelay: 0,
                }}
                variant="subtle"
            />
            {!isMinWidth ? (
                <CustomPlayerbarSlider
                    max={100}
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
