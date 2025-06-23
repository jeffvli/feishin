import { useHotkeys, useMediaQuery } from '@mantine/hooks';
import isElectron from 'is-electron';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { PlayerbarSlider } from '/@/renderer/features/player/components/playerbar-slider';
import { useRightControls } from '/@/renderer/features/player/hooks/use-right-controls';
import { useCreateFavorite, useDeleteFavorite, useSetRating } from '/@/renderer/features/shared';
import {
    useAppStoreActions,
    useCurrentServer,
    useCurrentSong,
    useHotkeySettings,
    useMuted,
    usePreviousSong,
    useSettingsStore,
    useSidebarStore,
    useSpeed,
    useVolume,
} from '/@/renderer/store';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { DropdownMenu } from '/@/shared/components/dropdown-menu/dropdown-menu';
import { Flex } from '/@/shared/components/flex/flex';
import { Group } from '/@/shared/components/group/group';
import { Rating } from '/@/shared/components/rating/rating';
import { Slider } from '/@/shared/components/slider/slider';
import { LibraryItem, QueueSong, ServerType, Song } from '/@/shared/types/domain-types';

const ipc = isElectron() ? window.api.ipc : null;
const remote = isElectron() ? window.api.remote : null;

export const RightControls = () => {
    const { t } = useTranslation();
    const isMinWidth = useMediaQuery('(max-width: 480px)');
    const volume = useVolume();
    const muted = useMuted();
    const server = useCurrentServer();
    const currentSong = useCurrentSong();
    const previousSong = usePreviousSong();
    const { setSideBar } = useAppStoreActions();
    const { rightExpanded: isQueueExpanded } = useSidebarStore();
    const { bindings } = useHotkeySettings();
    const {
        handleMute,
        handleSpeed,
        handleVolumeDown,
        handleVolumeSlider,
        handleVolumeUp,
        handleVolumeWheel,
    } = useRightControls();

    const speed = useSpeed();
    const volumeWidth = useSettingsStore((state) => state.general.volumeWidth);

    const updateRatingMutation = useSetRating({});
    const addToFavoritesMutation = useCreateFavorite({});
    const removeFromFavoritesMutation = useDeleteFavorite({});

    const handleAddToFavorites = (song: QueueSong | undefined) => {
        if (!song?.id) return;

        addToFavoritesMutation.mutate({
            query: {
                id: [song.id],
                type: LibraryItem.SONG,
            },
            serverId: song?.serverId,
        });
    };

    const handleUpdateRating = (rating: number) => {
        if (!currentSong) return;

        updateRatingMutation.mutate({
            query: {
                item: [currentSong],
                rating,
            },
            serverId: currentSong?.serverId,
        });
    };

    const handleRemoveFromFavorites = (song: QueueSong | undefined) => {
        if (!song?.id) return;

        removeFromFavoritesMutation.mutate({
            query: {
                id: [song.id],
                type: LibraryItem.SONG,
            },
            serverId: song?.serverId,
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

    const handleToggleQueue = () => {
        setSideBar({ rightExpanded: !isQueueExpanded });
    };

    const formatPlaybackSpeedSliderLabel = (value: number) => {
        const bpm = Number(currentSong?.bpm);
        if (bpm > 0) {
            return `${value} x / ${(bpm * value).toFixed(1)} BPM`;
        }
        return `${value} x`;
    };

    const isSongDefined = Boolean(currentSong?.id);
    const showRating = isSongDefined && server?.type === ServerType.NAVIDROME;

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

    useEffect(() => {
        if (remote) {
            remote.requestFavorite((_event, { favorite, id, serverId }) => {
                const mutator = favorite ? addToFavoritesMutation : removeFromFavoritesMutation;
                mutator.mutate({
                    query: {
                        id: [id],
                        type: LibraryItem.SONG,
                    },
                    serverId,
                });
            });

            remote.requestRating((_event, { id, rating, serverId }) => {
                updateRatingMutation.mutate({
                    query: {
                        item: [
                            {
                                id,
                                itemType: LibraryItem.SONG,
                                serverId,
                            } as Song, // This is not a type-safe cast, but it works because those are all the prop
                        ],
                        rating,
                    },
                    serverId,
                });
            });

            return () => {
                ipc?.removeAllListeners('request-favorite');
                ipc?.removeAllListeners('request-rating');
            };
        }

        return () => {};
    }, [addToFavoritesMutation, removeFromFavoritesMutation, updateRatingMutation]);

    return (
        <Flex
            align="flex-end"
            direction="column"
            h="100%"
            px="1rem"
            py="0.5rem"
        >
            <Group h="calc(100% / 3)">
                {showRating && (
                    <Rating
                        onChange={handleUpdateRating}
                        size="xs"
                        value={currentSong?.userRating || 0}
                    />
                )}
            </Group>
            <Group
                align="center"
                gap="xs"
                wrap="nowrap"
            >
                <DropdownMenu
                    arrowOffset={12}
                    offset={0}
                    position="top-end"
                    width={425}
                    withArrow
                >
                    <DropdownMenu.Target>
                        <ActionIcon
                            icon="mediaSpeed"
                            iconProps={{
                                size: 'lg',
                            }}
                            size="sm"
                            tooltip={{
                                label: t('player.playbackSpeed', { postProcess: 'sentenceCase' }),
                                openDelay: 0,
                            }}
                            variant="transparent"
                        />
                    </DropdownMenu.Target>
                    <DropdownMenu.Dropdown>
                        <Slider
                            label={formatPlaybackSpeedSliderLabel}
                            marks={[
                                { label: '0.5', value: 0.5 },
                                { label: '0.75', value: 0.75 },
                                { label: '1', value: 1 },
                                { label: '1.25', value: 1.25 },
                                { label: '1.5', value: 1.5 },
                            ]}
                            max={1.5}
                            min={0.5}
                            onChange={handleSpeed}
                            onDoubleClick={() => handleSpeed(1)}
                            step={0.01}
                            styles={{
                                markLabel: {
                                    paddingTop: '0.5rem',
                                },
                                root: {
                                    margin: '1rem 1rem 2rem 1rem',
                                },
                            }}
                            value={speed}
                        />
                    </DropdownMenu.Dropdown>
                </DropdownMenu>
                <ActionIcon
                    icon="favorite"
                    iconProps={{
                        fill: currentSong?.userFavorite ? 'primary' : undefined,
                        size: 'lg',
                    }}
                    onClick={() => handleToggleFavorite(currentSong)}
                    size="sm"
                    tooltip={{
                        label: currentSong?.userFavorite
                            ? t('player.unfavorite', { postProcess: 'titleCase' })
                            : t('player.favorite', { postProcess: 'titleCase' }),
                        openDelay: 0,
                    }}
                    variant="transparent"
                />
                <ActionIcon
                    icon={isQueueExpanded ? 'panelRightClose' : 'panelRightOpen'}
                    iconProps={{
                        size: 'lg',
                    }}
                    onClick={handleToggleQueue}
                    size="sm"
                    tooltip={{
                        label: t('player.viewQueue', { postProcess: 'titleCase' }),
                        openDelay: 0,
                    }}
                    variant="transparent"
                />
                <ActionIcon
                    icon={muted ? 'volumeMute' : volume > 50 ? 'volumeMax' : 'volumeNormal'}
                    iconProps={{
                        color: muted ? 'muted' : undefined,
                        size: 'xl',
                    }}
                    onClick={handleMute}
                    onWheel={handleVolumeWheel}
                    size="sm"
                    tooltip={{
                        label: muted ? t('player.muted', { postProcess: 'titleCase' }) : volume,
                        openDelay: 0,
                    }}
                    variant="transparent"
                />
                {!isMinWidth ? (
                    <PlayerbarSlider
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
