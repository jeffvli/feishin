import { MouseEvent, useEffect } from 'react';
import { Flex, Group } from '@mantine/core';
import { useHotkeys, useMediaQuery } from '@mantine/hooks';
import isElectron from 'is-electron';
import { HiOutlineQueueList } from 'react-icons/hi2';
import {
    RiVolumeUpFill,
    RiVolumeDownFill,
    RiVolumeMuteFill,
    RiHeartLine,
    RiHeartFill,
} from 'react-icons/ri';
import {
    useAppStoreActions,
    useCurrentServer,
    useCurrentSong,
    useHotkeySettings,
    useMuted,
    useSidebarStore,
    useSpeed,
    useVolume,
} from '/@/renderer/store';
import { useRightControls } from '../hooks/use-right-controls';
import { PlayerButton } from './player-button';
import { LibraryItem, ServerType, Song } from '/@/renderer/api/types';
import { useCreateFavorite, useDeleteFavorite, useSetRating } from '/@/renderer/features/shared';
import { DropdownMenu, Rating } from '/@/renderer/components';
import { PlayerbarSlider } from '/@/renderer/features/player/components/playerbar-slider';

const ipc = isElectron() ? window.electron.ipc : null;
const remote = isElectron() ? window.electron.remote : null;

const PLAYBACK_SPEEDS = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];

export const RightControls = () => {
    const isMinWidth = useMediaQuery('(max-width: 480px)');
    const volume = useVolume();
    const muted = useMuted();
    const server = useCurrentServer();
    const currentSong = useCurrentSong();
    const { setSideBar } = useAppStoreActions();
    const { rightExpanded: isQueueExpanded } = useSidebarStore();
    const { bindings } = useHotkeySettings();
    const {
        handleVolumeSlider,
        handleVolumeWheel,
        handleMute,
        handleVolumeDown,
        handleVolumeUp,
        handleSpeed,
    } = useRightControls();

    const speed = useSpeed();

    const updateRatingMutation = useSetRating({});
    const addToFavoritesMutation = useCreateFavorite({});
    const removeFromFavoritesMutation = useDeleteFavorite({});

    const handleAddToFavorites = () => {
        if (!currentSong) return;

        addToFavoritesMutation.mutate({
            query: {
                id: [currentSong.id],
                type: LibraryItem.SONG,
            },
            serverId: currentSong?.serverId,
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

    const handleClearRating = (_e: MouseEvent<HTMLDivElement> | null, rating?: number) => {
        if (!currentSong || !rating) return;

        updateRatingMutation.mutate({
            query: {
                item: [currentSong],
                rating: 0,
            },
            serverId: currentSong?.serverId,
        });
    };

    const handleRemoveFromFavorites = () => {
        if (!currentSong) return;

        removeFromFavoritesMutation.mutate({
            query: {
                id: [currentSong.id],
                type: LibraryItem.SONG,
            },
            serverId: currentSong?.serverId,
        });
    };

    const handleToggleFavorite = () => {
        if (!currentSong) return;

        if (currentSong.userFavorite) {
            handleRemoveFromFavorites();
        } else {
            handleAddToFavorites();
        }
    };

    const handleToggleQueue = () => {
        setSideBar({ rightExpanded: !isQueueExpanded });
    };

    const isSongDefined = Boolean(currentSong?.id);
    const showRating = isSongDefined && server?.type === ServerType.NAVIDROME;

    useHotkeys([
        [bindings.volumeDown.isGlobal ? '' : bindings.volumeDown.hotkey, handleVolumeDown],
        [bindings.volumeUp.isGlobal ? '' : bindings.volumeUp.hotkey, handleVolumeUp],
        [bindings.volumeMute.isGlobal ? '' : bindings.volumeMute.hotkey, handleMute],
        [bindings.toggleQueue.isGlobal ? '' : bindings.toggleQueue.hotkey, handleToggleQueue],
        [bindings.rate0.isGlobal ? '' : bindings.rate0.hotkey, () => handleClearRating(null, 0)],
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
                        size="sm"
                        value={currentSong?.userRating || 0}
                        onChange={handleUpdateRating}
                        onClick={handleClearRating}
                    />
                )}
            </Group>
            <Group
                noWrap
                align="center"
                spacing="xs"
            >
                <DropdownMenu>
                    <DropdownMenu.Target>
                        <PlayerButton
                            icon={<>{speed} x</>}
                            tooltip={{
                                label: 'Playback speed',
                                openDelay: 500,
                            }}
                            variant="secondary"
                        />
                    </DropdownMenu.Target>
                    <DropdownMenu.Dropdown>
                        {PLAYBACK_SPEEDS.map((speed) => (
                            <DropdownMenu.Item
                                key={`speed-select-${speed}`}
                                onClick={() => handleSpeed(Number(speed))}
                            >
                                {speed}
                            </DropdownMenu.Item>
                        ))}
                    </DropdownMenu.Dropdown>
                </DropdownMenu>
                <PlayerButton
                    icon={
                        currentSong?.userFavorite ? (
                            <RiHeartFill
                                color="var(--primary-color)"
                                size="1.1rem"
                            />
                        ) : (
                            <RiHeartLine size="1.1rem" />
                        )
                    }
                    sx={{
                        svg: {
                            fill: !currentSong?.userFavorite
                                ? undefined
                                : 'var(--primary-color) !important',
                        },
                    }}
                    tooltip={{
                        label: currentSong?.userFavorite ? 'Unfavorite' : 'Favorite',
                        openDelay: 500,
                    }}
                    variant="secondary"
                    onClick={handleToggleFavorite}
                />
                {!isMinWidth ? (
                    <PlayerButton
                        icon={<HiOutlineQueueList size="1.1rem" />}
                        tooltip={{ label: 'View queue', openDelay: 500 }}
                        variant="secondary"
                        onClick={handleToggleQueue}
                    />
                ) : null}
                <Group
                    noWrap
                    spacing="xs"
                >
                    <PlayerButton
                        icon={
                            muted ? (
                                <RiVolumeMuteFill size="1.2rem" />
                            ) : volume > 50 ? (
                                <RiVolumeUpFill size="1.2rem" />
                            ) : (
                                <RiVolumeDownFill size="1.2rem" />
                            )
                        }
                        tooltip={{ label: muted ? 'Muted' : volume, openDelay: 500 }}
                        variant="secondary"
                        onClick={handleMute}
                        onWheel={handleVolumeWheel}
                    />
                    {!isMinWidth ? (
                        <PlayerbarSlider
                            max={100}
                            min={0}
                            size={6}
                            value={volume}
                            w="60px"
                            onChange={handleVolumeSlider}
                            onWheel={handleVolumeWheel}
                        />
                    ) : null}
                </Group>
            </Group>
            <Group h="calc(100% / 3)" />
        </Flex>
    );
};
