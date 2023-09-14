import { MouseEvent, useCallback, useEffect } from 'react';
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
    RiUploadCloud2Line,
    RiDownloadCloud2Line,
} from 'react-icons/ri';
import {
    useAppStoreActions,
    useCurrentServer,
    useCurrentSong,
    useHotkeySettings,
    useMuted,
    usePlayerStore,
    useSidebarStore,
    useVolume,
} from '/@/renderer/store';
import { useRightControls } from '../hooks/use-right-controls';
import { PlayerButton } from './player-button';
import { LibraryItem, QueueSong, ServerType, Song } from '/@/renderer/api/types';
import { useCreateFavorite, useDeleteFavorite, useSetRating } from '/@/renderer/features/shared';
import { Rating, toast } from '/@/renderer/components';
import { PlayerbarSlider } from '/@/renderer/features/player/components/playerbar-slider';
import { api } from '/@/renderer/api';
import { usePlayQueueAdd } from '/@/renderer/features/player/hooks/use-playqueue-add';
import { Play } from '/@/renderer/types';

const ipc = isElectron() ? window.electron.ipc : null;
const remote = isElectron() ? window.electron.remote : null;

export const RightControls = () => {
    const isMinWidth = useMediaQuery('(max-width: 480px)');
    const volume = useVolume();
    const muted = useMuted();
    const server = useCurrentServer();
    const currentSong = useCurrentSong();
    const { setSideBar } = useAppStoreActions();
    const { rightExpanded: isQueueExpanded } = useSidebarStore();
    const { bindings } = useHotkeySettings();
    const { handleVolumeSlider, handleVolumeWheel, handleMute, handleVolumeDown, handleVolumeUp } =
        useRightControls();

    const updateRatingMutation = useSetRating({});
    const addToFavoritesMutation = useCreateFavorite({});
    const removeFromFavoritesMutation = useDeleteFavorite({});
    const handlePlayQueueAdd = usePlayQueueAdd();

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

    const handleClearRating = (_e: MouseEvent<HTMLDivElement>, rating?: number) => {
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

    const handleSaveQueue = useCallback(() => {
        if (server === null) return;

        const { current, queue } = usePlayerStore.getState();
        let songIds: string[] = [];

        if (queue.shuffled.length > 0) {
            const queueMapping: Record<string, QueueSong> = {};
            for (const song of queue.default) {
                queueMapping[song.uniqueId] = song;
            }
            for (const shuffledId of queue.shuffled) {
                songIds.push(queueMapping[shuffledId].id);
            }
        } else {
            songIds = queue.default.map((song) => song.id);
        }

        api.controller
            .savePlayQueue({
                apiClientProps: { server },
                query: {
                    current: current.song?.id,
                    currentIndex: current.index,
                    positionMs: current.song ? Math.round(current.time * 1000) : undefined,
                    songs: songIds,
                },
            })
            .then(() => {
                return toast.success({ message: '', title: 'Saved play queue' });
            })
            .catch((error) => {
                toast.error({
                    message: 'This is most likely because your queue is too large (> 1000 tracks)',
                    title: 'Failed to save play queue',
                });
                console.error(error);
            });
    }, [server]);

    const handleRestoreQueue = useCallback(async () => {
        if (server === null) return;

        const queue = await api.controller.getPlayQueue({ apiClientProps: { server } });
        handlePlayQueueAdd?.({
            byData: queue?.entry,
            initialIndex: queue?.currentIndex,
            playType: Play.NOW,
        });
    }, [handlePlayQueueAdd, server]);

    useHotkeys([
        [bindings.volumeDown.isGlobal ? '' : bindings.volumeDown.hotkey, handleVolumeDown],
        [bindings.volumeUp.isGlobal ? '' : bindings.volumeUp.hotkey, handleVolumeUp],
        [bindings.volumeMute.isGlobal ? '' : bindings.volumeMute.hotkey, handleMute],
        [bindings.toggleQueue.isGlobal ? '' : bindings.toggleQueue.hotkey, handleToggleQueue],
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
                <PlayerButton
                    icon={<HiOutlineQueueList size="1.1rem" />}
                    tooltip={{ label: 'View queue', openDelay: 500 }}
                    variant="secondary"
                    onClick={handleToggleQueue}
                />
                {server && (
                    <>
                        <PlayerButton
                            icon={<RiUploadCloud2Line size="1.1rem" />}
                            tooltip={{ label: 'Save queue', openDelay: 500 }}
                            variant="secondary"
                            onClick={handleSaveQueue}
                        />
                        <PlayerButton
                            icon={<RiDownloadCloud2Line size="1.1rem" />}
                            tooltip={{ label: 'Restore queue', openDelay: 500 }}
                            variant="secondary"
                            onClick={handleRestoreQueue}
                        />
                    </>
                )}
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
