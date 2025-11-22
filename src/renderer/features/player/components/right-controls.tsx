import { useCallback, WheelEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { PlayerConfig } from '/@/renderer/features/player/components/player-config';
import { CustomPlayerbarSlider } from '/@/renderer/features/player/components/playerbar-slider';
import { usePlayer } from '/@/renderer/features/player/context/player-context';
import { useCreateFavorite } from '/@/renderer/features/shared/mutations/create-favorite-mutation';
import { useDeleteFavorite } from '/@/renderer/features/shared/mutations/delete-favorite-mutation';
import { useSetRating } from '/@/renderer/features/shared/mutations/set-rating-mutation';
import {
    useAppStoreActions,
    useCurrentServer,
    useGeneralSettings,
    useHotkeySettings,
    usePlayerData,
    usePlayerMuted,
    usePlayerVolume,
    useSettingsStore,
    useSidebarStore,
} from '/@/renderer/store';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Flex } from '/@/shared/components/flex/flex';
import { Group } from '/@/shared/components/group/group';
import { Rating } from '/@/shared/components/rating/rating';
import { useHotkeys } from '/@/shared/hooks/use-hotkeys';
import { useMediaQuery } from '/@/shared/hooks/use-media-query';
import { LibraryItem, QueueSong, ServerType } from '/@/shared/types/domain-types';

const calculateVolumeUp = (volume: number, volumeWheelStep: number) => {
    let volumeToSet;
    const newVolumeGreaterThanHundred = volume + volumeWheelStep > 100;
    if (newVolumeGreaterThanHundred) {
        volumeToSet = 100;
    } else {
        volumeToSet = volume + volumeWheelStep;
    }

    return volumeToSet;
};

const calculateVolumeDown = (volume: number, volumeWheelStep: number) => {
    let volumeToSet;
    const newVolumeLessThanZero = volume - volumeWheelStep < 0;
    if (newVolumeLessThanZero) {
        volumeToSet = 0;
    } else {
        volumeToSet = volume - volumeWheelStep;
    }

    return volumeToSet;
};

export const RightControls = () => {
    const { t } = useTranslation();
    const isMinWidth = useMediaQuery('(max-width: 480px)');
    const volume = usePlayerVolume();
    const muted = usePlayerMuted();
    const server = useCurrentServer();
    const { currentSong, previousSong } = usePlayerData();
    const { setSideBar } = useAppStoreActions();
    const { rightExpanded: isQueueExpanded } = useSidebarStore();
    const { bindings } = useHotkeySettings();
    const { volumeWheelStep } = useGeneralSettings();
    const volumeWidth = useSettingsStore((state) => state.general.volumeWidth);
    const { mediaToggleMute, setVolume } = usePlayer();
    const updateRatingMutation = useSetRating({});
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

    const handleUpdateRating = (rating: number) => {
        if (!currentSong) return;

        updateRatingMutation.mutate({
            apiClientProps: { serverId: currentSong?._serverId || '' },
            query: {
                id: [currentSong.id],
                rating,
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

    const handleVolumeDown = useCallback(() => {
        setVolume(volume - 1);
    }, [setVolume, volume]);

    const handleVolumeUp = useCallback(() => {
        setVolume(volume + 1);
    }, [setVolume, volume]);

    const handleMute = useCallback(() => {
        mediaToggleMute();
    }, [mediaToggleMute]);

    const handleVolumeSlider = useCallback(
        (e: number) => {
            setVolume(e);
        },
        [setVolume],
    );

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

    const handleToggleQueue = () => {
        setSideBar({ rightExpanded: !isQueueExpanded });
    };

    const isSongDefined = Boolean(currentSong?.id);
    const showRating =
        isSongDefined &&
        (server?.type === ServerType.NAVIDROME || server?.type === ServerType.SUBSONIC);

    useHotkeys([
        [bindings.volumeDown.isGlobal ? '' : bindings.volumeDown.hotkey, handleVolumeDown],
        [bindings.volumeUp.isGlobal ? '' : bindings.volumeUp.hotkey, handleVolumeUp],
        [bindings.volumeMute.isGlobal ? '' : bindings.volumeMute.hotkey, handleMute],
        [bindings.toggleQueue.isGlobal ? '' : bindings.toggleQueue.hotkey, handleToggleQueue],
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
        [bindings.rate0.isGlobal ? '' : bindings.rate0.hotkey, () => handleUpdateRating(0)],
        [bindings.rate1.isGlobal ? '' : bindings.rate1.hotkey, () => handleUpdateRating(1)],
        [bindings.rate2.isGlobal ? '' : bindings.rate2.hotkey, () => handleUpdateRating(2)],
        [bindings.rate3.isGlobal ? '' : bindings.rate3.hotkey, () => handleUpdateRating(3)],
        [bindings.rate4.isGlobal ? '' : bindings.rate4.hotkey, () => handleUpdateRating(4)],
        [bindings.rate5.isGlobal ? '' : bindings.rate5.hotkey, () => handleUpdateRating(5)],
    ]);

    return (
        <Flex align="flex-end" direction="column" h="100%" px="1rem" py="0.5rem">
            <Group h="calc(100% / 3)">
                {showRating && (
                    <Rating
                        onChange={handleUpdateRating}
                        size="xs"
                        value={currentSong?.userRating || 0}
                    />
                )}
            </Group>
            <Group align="center" gap="xs" wrap="nowrap">
                <PlayerConfig />
                <ActionIcon
                    icon="favorite"
                    iconProps={{
                        fill: currentSong?.userFavorite ? 'favorite' : undefined,
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
                <ActionIcon
                    icon={isQueueExpanded ? 'panelRightClose' : 'panelRightOpen'}
                    iconProps={{
                        size: 'lg',
                    }}
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
                        onWheel={handleVolumeWheel}
                        size={6}
                        value={volume}
                        w={volumeWidth}
                    />
                ) : null}
            </Group>
            <Group h="calc(100% / 3)" />
        </Flex>
    );
};
