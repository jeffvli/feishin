import { RowNode } from '@ag-grid-community/core';
import {
    useClickOutside,
    useMergedRef,
    useResizeObserver,
    useSetState,
    useViewportSize,
} from '@mantine/hooks';
import { closeAllModals, openContextModal, openModal } from '@mantine/modals';
import isElectron from 'is-electron';
import { AnimatePresence } from 'motion/react';
import { createContext, Fragment, ReactNode, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { api } from '/@/renderer/api';
import { controller } from '/@/renderer/api/controller';
import { ContextMenu, ContextMenuButton } from '/@/renderer/components/context-menu/context-menu';
import {
    ContextMenuItemType,
    OpenContextMenuProps,
    useContextMenuEvents,
} from '/@/renderer/features/context-menu/events';
import { ItemDetailsModal } from '/@/renderer/features/item-details/components/item-details-modal';
import { usePlayQueueAdd } from '/@/renderer/features/player';
import { updateSong } from '/@/renderer/features/player/update-remote-song';
import { useDeletePlaylist } from '/@/renderer/features/playlists';
import { useRemoveFromPlaylist } from '/@/renderer/features/playlists/mutations/remove-from-playlist-mutation';
import { useCreateFavorite, useDeleteFavorite, useSetRating } from '/@/renderer/features/shared';
import {
    getServerById,
    useAuthStore,
    useCurrentServer,
    usePlayerStore,
    useQueueControls,
    useSettingsStore,
} from '/@/renderer/store';
import { usePlaybackType } from '/@/renderer/store/settings.store';
import { setQueue, setQueueNext } from '/@/renderer/utils/set-transcoded-queue-data';
import { hasFeature } from '/@/shared/api/utils';
import { Divider } from '/@/shared/components/divider/divider';
import { Group } from '/@/shared/components/group/group';
import { HoverCard } from '/@/shared/components/hover-card/hover-card';
import { Icon } from '/@/shared/components/icon/icon';
import { ConfirmModal } from '/@/shared/components/modal/modal';
import { Portal } from '/@/shared/components/portal/portal';
import { Rating } from '/@/shared/components/rating/rating';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';
import { toast } from '/@/shared/components/toast/toast';
import {
    AnyLibraryItem,
    AnyLibraryItems,
    LibraryItem,
    ServerType,
} from '/@/shared/types/domain-types';
import { ServerFeature } from '/@/shared/types/features-types';
import { Play, PlaybackType } from '/@/shared/types/types';

type ContextMenuContextProps = {
    closeContextMenu: () => void;
    openContextMenu: (args: OpenContextMenuProps) => void;
};

type ContextMenuItem = {
    children?: ContextMenuItem[];
    disabled?: boolean;
    id: string;
    label: ReactNode | string;
    leftIcon?: ReactNode;
    onClick?: (...args: any) => any;
    rightIcon?: ReactNode;
};

const ContextMenuContext = createContext<ContextMenuContextProps>({
    closeContextMenu: () => {},
    openContextMenu: (args: OpenContextMenuProps) => {
        return args;
    },
});

const JELLYFIN_IGNORED_MENU_ITEMS: ContextMenuItemType[] = ['setRating', 'shareItem'];
// const NAVIDROME_IGNORED_MENU_ITEMS: ContextMenuItemType[] = [];
// const SUBSONIC_IGNORED_MENU_ITEMS: ContextMenuItemType[] = [];

const utils = isElectron() ? window.api.utils : null;

export interface ContextMenuProviderProps {
    children: ReactNode;
}

function RatingIcon({ rating }: { rating: number }) {
    return (
        <Rating
            readOnly
            style={{
                pointerEvents: 'none',
                size: 'var(--theme-font-size-md)',
            }}
            value={rating}
        />
    );
}

export const ContextMenuProvider = ({ children }: ContextMenuProviderProps) => {
    const disabledItems = useSettingsStore((state) => state.general.disabledContextMenu);
    const { t } = useTranslation();
    const [opened, setOpened] = useState(false);
    const clickOutsideRef = useClickOutside(() => setOpened(false));

    const viewport = useViewportSize();
    const server = useCurrentServer();
    const serverType = server?.type;
    const [ref, menuRect] = useResizeObserver();
    const [ctx, setCtx] = useSetState<OpenContextMenuProps>({
        data: [],
        dataNodes: [],
        menuItems: [],
        resetGridCache: undefined,
        tableApi: undefined,
        type: LibraryItem.SONG,
        xPos: 0,
        yPos: 0,
    });

    const handlePlayQueueAdd = usePlayQueueAdd();

    const openContextMenu = useCallback(
        (args: OpenContextMenuProps) => {
            const {
                context,
                data,
                dataNodes,
                menuItems,
                resetGridCache,
                tableApi,
                type,
                xPos,
                yPos,
            } = args;

            const serverType = data[0]?.serverType || useAuthStore.getState().currentServer?.type;
            let validMenuItems = menuItems.filter((item) => !disabledItems[item.id]);

            if (serverType === ServerType.JELLYFIN) {
                validMenuItems = menuItems.filter(
                    (item) => !JELLYFIN_IGNORED_MENU_ITEMS.includes(item.id),
                );
            }

            // If the context menu dimension can't be automatically calculated, calculate it manually
            // This is a hacky way since resize observer may not automatically recalculate when not rendered
            const menuHeight = menuRect.height || (validMenuItems.length + 1) * 40;
            const menuWidth = menuRect.width || 220;

            const shouldReverseY = yPos + menuHeight > viewport.height;
            const shouldReverseX = xPos + menuWidth > viewport.width;

            const calculatedXPos = shouldReverseX ? xPos - menuWidth : xPos;
            const calculatedYPos = shouldReverseY ? yPos - menuHeight : yPos;

            setCtx({
                context,
                data,
                dataNodes,
                menuItems: validMenuItems,
                resetGridCache,
                tableApi,
                type,
                xPos: calculatedXPos,
                yPos: calculatedYPos,
            });
            setOpened(true);
        },
        [disabledItems, menuRect.height, menuRect.width, setCtx, viewport.height, viewport.width],
    );

    const closeContextMenu = useCallback(() => {
        setOpened(false);
        setCtx({
            data: [],
            dataNodes: [],
            menuItems: [],
            tableApi: undefined,
            type: LibraryItem.SONG,
            xPos: 0,
            yPos: 0,
        });
    }, [setCtx]);

    useContextMenuEvents({
        closeContextMenu,
        openContextMenu,
    });

    const handlePlay = useCallback(
        (playType: Play) => {
            switch (ctx.type) {
                case LibraryItem.ALBUM:
                    handlePlayQueueAdd?.({
                        byItemType: { id: ctx.data.map((item) => item.id), type: ctx.type },
                        playType,
                    });
                    break;
                case LibraryItem.ALBUM_ARTIST:
                    handlePlayQueueAdd?.({
                        byItemType: { id: ctx.data.map((item) => item.id), type: ctx.type },
                        playType,
                    });
                    break;
                case LibraryItem.ARTIST:
                    handlePlayQueueAdd?.({
                        byItemType: { id: ctx.data.map((item) => item.id), type: ctx.type },
                        playType,
                    });
                    break;
                case LibraryItem.GENRE:
                    handlePlayQueueAdd?.({
                        byItemType: { id: ctx.data.map((item) => item.id), type: ctx.type },
                        playType,
                    });
                    break;
                case LibraryItem.PLAYLIST:
                    for (const item of ctx.data) {
                        handlePlayQueueAdd?.({
                            byItemType: { id: [item.id], type: ctx.type },
                            playType,
                        });
                    }

                    break;
                case LibraryItem.SONG:
                    handlePlayQueueAdd?.({ byData: ctx.data, playType });
                    break;
            }
        },
        [ctx.data, ctx.type, handlePlayQueueAdd],
    );

    const deletePlaylistMutation = useDeletePlaylist({});

    const handleDeletePlaylist = useCallback(() => {
        for (const item of ctx.data) {
            deletePlaylistMutation?.mutate(
                { query: { id: item.id }, serverId: item.serverId },
                {
                    onError: (err) => {
                        toast.error({
                            message: err.message,
                            title: t('error.genericError', { postProcess: 'sentenceCase' }),
                        });
                    },
                    onSuccess: () => {
                        toast.success({
                            message: `Playlist has been deleted`,
                        });

                        ctx.tableApi?.refreshInfiniteCache();
                        ctx.resetGridCache?.();
                    },
                },
            );
        }

        closeAllModals();
    }, [ctx, deletePlaylistMutation, t]);

    const openDeletePlaylistModal = useCallback(() => {
        openModal({
            children: (
                <ConfirmModal onConfirm={handleDeletePlaylist}>
                    <Stack>
                        <Text>{t('common.areYouSure', { postProcess: 'sentenceCase' })}</Text>
                        <ul>
                            {ctx.data.map((item) => (
                                <li key={item.id}>
                                    <Group>
                                        —<Text isMuted>{item.name}</Text>
                                    </Group>
                                </li>
                            ))}
                        </ul>
                    </Stack>
                </ConfirmModal>
            ),
            title: t('page.contextMenu.deletePlaylist', { postProcess: 'titleCase' }),
        });
    }, [ctx.data, handleDeletePlaylist, t]);

    const createFavoriteMutation = useCreateFavorite({});
    const deleteFavoriteMutation = useDeleteFavorite({});
    const handleAddToFavorites = useCallback(() => {
        if (!ctx.dataNodes && !ctx.data) return;

        if (ctx.dataNodes) {
            const nodesToFavorite = ctx.dataNodes.filter((item) => !item.data.userFavorite);

            const nodesByServerId = nodesToFavorite.reduce(
                (acc, node) => {
                    if (!acc[node.data.serverId]) {
                        acc[node.data.serverId] = [];
                    }
                    acc[node.data.serverId].push(node);
                    return acc;
                },
                {} as Record<string, RowNode<any>[]>,
            );

            for (const serverId of Object.keys(nodesByServerId)) {
                const nodes = nodesByServerId[serverId];
                const items = nodes.map((node) => node.data);

                createFavoriteMutation.mutate(
                    {
                        query: {
                            id: items.map((item) => item.id),
                            type: ctx.type,
                        },
                        serverId,
                    },
                    {
                        onError: (err) => {
                            toast.error({
                                message: err.message,
                                title: t('error.genericError', { postProcess: 'sentenceCase' }),
                            });
                        },
                        onSuccess: () => {
                            for (const node of nodes) {
                                node.setData({ ...node.data, userFavorite: true });
                            }
                        },
                    },
                );
            }
        } else {
            const itemsToFavorite = ctx.data.filter((item) => !item.userFavorite);
            const itemsByServerId = (itemsToFavorite as any[]).reduce(
                (acc, item) => {
                    if (!acc[item.serverId]) {
                        acc[item.serverId] = [];
                    }
                    acc[item.serverId].push(item);
                    return acc;
                },
                {} as Record<string, AnyLibraryItems>,
            );

            for (const serverId of Object.keys(itemsByServerId)) {
                const items = itemsByServerId[serverId];

                createFavoriteMutation.mutate(
                    {
                        query: {
                            id: items.map((item: AnyLibraryItem) => item.id),
                            type: ctx.type,
                        },
                        serverId,
                    },
                    {
                        onError: (err) => {
                            toast.error({
                                message: err.message,
                                title: t('error.genericError', { postProcess: 'sentenceCase' }),
                            });
                        },
                    },
                );
            }
        }
    }, [createFavoriteMutation, ctx.data, ctx.dataNodes, ctx.type, t]);

    const handleRemoveFromFavorites = useCallback(() => {
        if (!ctx.dataNodes && !ctx.data) return;

        if (ctx.dataNodes) {
            const nodesToUnfavorite = ctx.dataNodes.filter((item) => item.data.userFavorite);
            const nodesByServerId = nodesToUnfavorite.reduce(
                (acc, node) => {
                    if (!acc[node.data.serverId]) {
                        acc[node.data.serverId] = [];
                    }
                    acc[node.data.serverId].push(node);
                    return acc;
                },
                {} as Record<string, RowNode<any>[]>,
            );

            for (const serverId of Object.keys(nodesByServerId)) {
                const idsToUnfavorite = nodesByServerId[serverId].map((node) => node.data.id);
                deleteFavoriteMutation.mutate(
                    {
                        query: {
                            id: idsToUnfavorite,
                            type: ctx.type,
                        },
                        serverId,
                    },
                    {
                        onSuccess: () => {
                            for (const node of nodesToUnfavorite) {
                                node.setData({ ...node.data, userFavorite: false });
                            }
                        },
                    },
                );
            }
        } else {
            const itemsToUnfavorite = ctx.data.filter((item) => item.userFavorite);
            const itemsByServerId = (itemsToUnfavorite as any[]).reduce(
                (acc, item) => {
                    if (!acc[item.serverId]) {
                        acc[item.serverId] = [];
                    }
                    acc[item.serverId].push(item);
                    return acc;
                },
                {} as Record<string, AnyLibraryItems>,
            );

            for (const serverId of Object.keys(itemsByServerId)) {
                const idsToUnfavorite = itemsByServerId[serverId].map(
                    (item: AnyLibraryItem) => item.id,
                );
                deleteFavoriteMutation.mutate({
                    query: {
                        id: idsToUnfavorite,
                        type: ctx.type,
                    },
                    serverId,
                });
            }
        }
    }, [ctx.data, ctx.dataNodes, ctx.type, deleteFavoriteMutation]);

    const handleAddToPlaylist = useCallback(() => {
        if (!ctx.dataNodes && !ctx.data) return;

        const albumId: string[] = [];
        const artistId: string[] = [];
        const songId: string[] = [];
        const genreId: string[] = [];

        if (ctx.dataNodes) {
            for (const node of ctx.dataNodes) {
                switch (node.data.itemType) {
                    case LibraryItem.ALBUM:
                        albumId.push(node.data.id);
                        break;
                    case LibraryItem.ARTIST:
                        artistId.push(node.data.id);
                        break;
                    case LibraryItem.GENRE:
                        genreId.push(node.data.id);
                        break;
                    case LibraryItem.SONG:
                        songId.push(node.data.id);
                        break;
                }
            }
        } else {
            for (const item of ctx.data) {
                switch (item.itemType) {
                    case LibraryItem.ALBUM:
                        albumId.push(item.id);
                        break;
                    case LibraryItem.ALBUM_ARTIST:
                        artistId.push(item.id);
                        break;
                    case LibraryItem.ARTIST:
                        artistId.push(item.id);
                        break;
                    case LibraryItem.GENRE:
                        genreId.push(item.id);
                        break;
                    case LibraryItem.SONG:
                        songId.push(item.id);
                        break;
                }
            }
        }

        openContextModal({
            innerProps: {
                albumId: albumId.length > 0 ? albumId : undefined,
                artistId: artistId.length > 0 ? artistId : undefined,
                genreId: genreId.length > 0 ? genreId : undefined,
                songId: songId.length > 0 ? songId : undefined,
            },
            modal: 'addToPlaylist',
            size: 'md',
            title: t('page.contextMenu.addToPlaylist', { postProcess: 'sentenceCase' }),
        });
    }, [ctx.data, ctx.dataNodes, t]);

    const removeFromPlaylistMutation = useRemoveFromPlaylist();

    const handleRemoveFromPlaylist = useCallback(() => {
        let songId: string[] | undefined;

        switch (serverType) {
            case ServerType.JELLYFIN:
            case ServerType.NAVIDROME:
                songId = ctx.dataNodes?.map((node) => node.data.playlistItemId);
                break;
            case ServerType.SUBSONIC:
                songId = ctx.dataNodes?.map((node) => node.rowIndex!.toString());
                break;
        }

        const confirm = () => {
            removeFromPlaylistMutation.mutate(
                {
                    query: {
                        id: ctx.context.playlistId,
                        songId: songId || [],
                    },
                    serverId: ctx.data?.[0]?.serverId,
                },
                {
                    onError: (err) => {
                        toast.error({
                            message: err.message,
                            title: t('error.genericError', { postProcess: 'sentenceCase' }),
                        });
                    },
                    onSuccess: () => {
                        ctx.context?.tableRef?.current?.api?.refreshInfiniteCache();
                        closeAllModals();
                    },
                },
            );
        };

        openModal({
            children: (
                <ConfirmModal
                    loading={removeFromPlaylistMutation.isLoading}
                    onConfirm={confirm}
                >
                    {t('common.areYouSure', { postProcess: 'sentenceCase' })}
                </ConfirmModal>
            ),
            title: t('page.contextMenu.removeFromPlaylist', { postProcess: 'sentenceCase' }),
        });
    }, [
        ctx.context?.playlistId,
        ctx.context?.tableRef,
        ctx.data,
        ctx.dataNodes,
        removeFromPlaylistMutation,
        serverType,
        t,
    ]);

    const updateRatingMutation = useSetRating({});

    const handleUpdateRating = useCallback(
        (rating: number) => {
            if (!ctx.dataNodes && !ctx.data) return;

            let uniqueServerIds: string[] = [];
            let items: AnyLibraryItems = [];

            if (ctx.dataNodes) {
                uniqueServerIds = ctx.dataNodes.reduce((acc, node) => {
                    if (!acc.includes(node.data.serverId)) {
                        acc.push(node.data.serverId);
                    }
                    return acc;
                }, [] as string[]);
            } else {
                uniqueServerIds = ctx.data.reduce((acc, item) => {
                    if (!acc.includes(item.serverId)) {
                        acc.push(item.serverId);
                    }
                    return acc;
                }, [] as string[]);
            }

            for (const serverId of uniqueServerIds) {
                if (ctx.dataNodes) {
                    items = ctx.dataNodes
                        .filter((node) => node.data.serverId === serverId)
                        .map((node) => node.data);
                } else {
                    items = ctx.data.filter((item) => item.serverId === serverId);
                }

                updateRatingMutation.mutate(
                    {
                        query: {
                            item: items,
                            rating,
                        },
                        serverId,
                    },
                    {
                        onSuccess: () => {
                            if (ctx.dataNodes) {
                                for (const node of ctx.dataNodes) {
                                    node.setData({ ...node.data, userRating: rating });
                                }
                            }
                        },
                    },
                );
            }
        },
        [ctx.data, ctx.dataNodes, updateRatingMutation],
    );

    const playbackType = usePlaybackType();
    const { moveToBottomOfQueue, moveToNextOfQueue, moveToTopOfQueue, removeFromQueue } =
        useQueueControls();

    const handleMoveToNext = useCallback(() => {
        const uniqueIds = ctx.dataNodes?.map((row) => row.data.uniqueId);
        if (!uniqueIds?.length) return;

        const playerData = moveToNextOfQueue(uniqueIds);

        if (playbackType === PlaybackType.LOCAL) {
            setQueueNext(playerData);
        }
    }, [ctx.dataNodes, moveToNextOfQueue, playbackType]);

    const handleMoveToBottom = useCallback(() => {
        const uniqueIds = ctx.dataNodes?.map((row) => row.data.uniqueId);
        if (!uniqueIds?.length) return;

        const playerData = moveToBottomOfQueue(uniqueIds);

        if (playbackType === PlaybackType.LOCAL) {
            setQueueNext(playerData);
        }
    }, [ctx.dataNodes, moveToBottomOfQueue, playbackType]);

    const handleMoveToTop = useCallback(() => {
        const uniqueIds = ctx.dataNodes?.map((row) => row.data.uniqueId);
        if (!uniqueIds?.length) return;

        const playerData = moveToTopOfQueue(uniqueIds);

        if (playbackType === PlaybackType.LOCAL) {
            setQueueNext(playerData);
        }
    }, [ctx.dataNodes, moveToTopOfQueue, playbackType]);

    const handleShareItem = useCallback(() => {
        if (!ctx.dataNodes && !ctx.data) return;

        const uniqueIds = ctx.data.map((node) => node.id);

        openContextModal({
            innerProps: {
                itemIds: uniqueIds,
                resourceType: ctx.data[0].itemType,
            },
            modal: 'shareItem',
            size: 'md',
            title: t('page.contextMenu.shareItem', { postProcess: 'sentenceCase' }),
        });
    }, [ctx.data, ctx.dataNodes, t]);

    const handleRemoveSelected = useCallback(() => {
        const uniqueIds = ctx.dataNodes?.map((row) => row.data.uniqueId);
        if (!uniqueIds?.length) return;

        const currentSong = usePlayerStore.getState().current.song;
        const playerData = removeFromQueue(uniqueIds);
        const isCurrentSongRemoved = currentSong && uniqueIds.includes(currentSong?.uniqueId);

        if (playbackType === PlaybackType.LOCAL) {
            if (isCurrentSongRemoved) {
                setQueue(playerData);
            } else {
                setQueueNext(playerData);
            }
        }

        ctx.tableApi?.redrawRows();

        if (isCurrentSongRemoved) {
            updateSong(playerData.current.song);
        }
    }, [ctx.dataNodes, ctx.tableApi, playbackType, removeFromQueue]);

    const handleDeselectAll = useCallback(() => {
        ctx.tableApi?.deselectAll();
    }, [ctx.tableApi]);

    const handleOpenItemDetails = useCallback(() => {
        const item = ctx.data[0];

        openModal({
            children: <ItemDetailsModal item={item} />,
            size: 'xl',
            title: t('page.contextMenu.showDetails', { postProcess: 'titleCase' }),
        });
    }, [ctx.data, t]);

    const handleSimilar = useCallback(async () => {
        const item = ctx.data[0];
        const songs = await controller.getSimilarSongs({
            apiClientProps: {
                server: getServerById(item.serverId),
                signal: undefined,
            },
            query: { albumArtistIds: item.albumArtistIds, songId: item.id },
        });
        if (songs) {
            handlePlayQueueAdd?.({ byData: [ctx.data[0], ...songs], playType: Play.NOW });
        }
    }, [ctx, handlePlayQueueAdd]);

    const handleDownload = useCallback(() => {
        const item = ctx.data[0];
        const url = api.controller.getDownloadUrl({
            apiClientProps: { server },
            query: { id: item.id },
        });

        if (utils) {
            utils.download(url!);
        } else {
            window.open(url, '_blank');
        }
    }, [ctx.data, server]);

    const contextMenuItems: Record<ContextMenuItemType, ContextMenuItem> = useMemo(() => {
        return {
            addToFavorites: {
                id: 'addToFavorites',
                label: t('page.contextMenu.addToFavorites', { postProcess: 'sentenceCase' }),
                leftIcon: <Icon icon="favorite" />,
                onClick: handleAddToFavorites,
            },
            addToPlaylist: {
                id: 'addToPlaylist',
                label: t('page.contextMenu.addToPlaylist', { postProcess: 'sentenceCase' }),
                leftIcon: <Icon icon="playlistAdd" />,
                onClick: handleAddToPlaylist,
            },
            createPlaylist: {
                id: 'createPlaylist',
                label: t('page.contextMenu.createPlaylist', { postProcess: 'sentenceCase' }),
                onClick: () => {},
            },
            deletePlaylist: {
                id: 'deletePlaylist',
                label: t('page.contextMenu.deletePlaylist', { postProcess: 'sentenceCase' }),
                leftIcon: <Icon icon="playlistDelete" />,
                onClick: openDeletePlaylistModal,
            },
            deselectAll: {
                id: 'deselectAll',
                label: t('page.contextMenu.deselectAll', { postProcess: 'sentenceCase' }),
                leftIcon: <Icon icon="remove" />,
                onClick: handleDeselectAll,
            },
            download: {
                disabled: ctx.data?.length !== 1,
                id: 'download',
                label: t('page.contextMenu.download', { postProcess: 'sentenceCase' }),
                leftIcon: <Icon icon="download" />,
                onClick: handleDownload,
            },
            moveToBottomOfQueue: {
                id: 'moveToBottomOfQueue',
                label: t('page.contextMenu.moveToBottom', { postProcess: 'sentenceCase' }),
                leftIcon: <Icon icon="arrowDownToLine" />,
                onClick: handleMoveToBottom,
            },
            moveToNextOfQueue: {
                id: 'moveToNext',
                label: t('page.contextMenu.moveToNext', { postProcess: 'sentenceCase' }),
                leftIcon: <Icon icon="mediaPlayNext" />,
                onClick: handleMoveToNext,
            },
            moveToTopOfQueue: {
                id: 'moveToTopOfQueue',
                label: t('page.contextMenu.moveToTop', { postProcess: 'sentenceCase' }),
                leftIcon: <Icon icon="arrowUpToLine" />,
                onClick: handleMoveToTop,
            },
            play: {
                id: 'play',
                label: t('page.contextMenu.play', { postProcess: 'sentenceCase' }),
                leftIcon: <Icon icon="mediaPlay" />,
                onClick: () => handlePlay(Play.NOW),
            },
            playLast: {
                id: 'playLast',
                label: t('page.contextMenu.addLast', { postProcess: 'sentenceCase' }),
                leftIcon: <Icon icon="mediaPlayLast" />,
                onClick: () => handlePlay(Play.LAST),
            },
            playNext: {
                id: 'playNext',
                label: t('page.contextMenu.addNext', { postProcess: 'sentenceCase' }),
                leftIcon: <Icon icon="mediaPlayNext" />,
                onClick: () => handlePlay(Play.NEXT),
            },
            playShuffled: {
                id: 'playShuffled',
                label: t('page.contextMenu.playShuffled', { postProcess: 'sentenceCase' }),
                leftIcon: <Icon icon="mediaShuffle" />,
                onClick: () => handlePlay(Play.SHUFFLE),
            },
            playSimilarSongs: {
                id: 'playSimilarSongs',
                label: t('page.contextMenu.playSimilarSongs', { postProcess: 'sentenceCase' }),
                leftIcon: <Icon icon="radio" />,
                onClick: handleSimilar,
            },
            removeFromFavorites: {
                id: 'removeFromFavorites',
                label: t('page.contextMenu.removeFromFavorites', { postProcess: 'sentenceCase' }),
                leftIcon: <Icon icon="unfavorite" />,
                onClick: handleRemoveFromFavorites,
            },
            removeFromPlaylist: {
                id: 'removeFromPlaylist',
                label: t('page.contextMenu.removeFromPlaylist', { postProcess: 'sentenceCase' }),
                leftIcon: <Icon icon="playlistDelete" />,
                onClick: handleRemoveFromPlaylist,
            },
            removeFromQueue: {
                id: 'removeSongs',
                label: t('page.contextMenu.removeFromQueue', { postProcess: 'sentenceCase' }),
                leftIcon: <Icon icon="delete" />,
                onClick: handleRemoveSelected,
            },
            setRating: {
                children: [
                    {
                        id: 'zeroStar',
                        label: <RatingIcon rating={0} />,
                        onClick: () => handleUpdateRating(0),
                    },
                    {
                        id: 'oneStar',
                        label: <RatingIcon rating={1} />,
                        onClick: () => handleUpdateRating(1),
                    },
                    {
                        id: 'twoStar',
                        label: <RatingIcon rating={2} />,
                        onClick: () => handleUpdateRating(2),
                    },
                    {
                        id: 'threeStar',
                        label: <RatingIcon rating={3} />,
                        onClick: () => handleUpdateRating(3),
                    },
                    {
                        id: 'fourStar',
                        label: <RatingIcon rating={4} />,
                        onClick: () => handleUpdateRating(4),
                    },
                    {
                        id: 'fiveStar',
                        label: <RatingIcon rating={5} />,
                        onClick: () => handleUpdateRating(5),
                    },
                ],
                id: 'setRating',
                label: t('action.setRating', { postProcess: 'sentenceCase' }),
                leftIcon: <Icon icon="star" />,
                onClick: () => {},
                rightIcon: <Icon icon="arrowRightS" />,
            },
            shareItem: {
                disabled: !hasFeature(server, ServerFeature.SHARING_ALBUM_SONG),
                id: 'shareItem',
                label: t('page.contextMenu.shareItem', { postProcess: 'sentenceCase' }),
                leftIcon: <Icon icon="share" />,
                onClick: handleShareItem,
            },
            showDetails: {
                disabled: ctx.data?.length !== 1 || !ctx.data[0].itemType,
                id: 'showDetails',
                label: t('page.contextMenu.showDetails', { postProcess: 'sentenceCase' }),
                leftIcon: <Icon icon="info" />,
                onClick: handleOpenItemDetails,
            },
        };
    }, [
        t,
        handleAddToFavorites,
        handleAddToPlaylist,
        openDeletePlaylistModal,
        handleDeselectAll,
        ctx.data,
        handleDownload,
        handleMoveToNext,
        handleMoveToBottom,
        handleMoveToTop,
        handleSimilar,
        handleRemoveFromFavorites,
        handleRemoveFromPlaylist,
        handleRemoveSelected,
        server,
        handleShareItem,
        handleOpenItemDetails,
        handlePlay,
        handleUpdateRating,
    ]);

    const mergedRef = useMergedRef(ref, clickOutsideRef);

    const providerValue = useMemo(
        () => ({
            closeContextMenu,
            openContextMenu,
        }),
        [closeContextMenu, openContextMenu],
    );

    return (
        <ContextMenuContext.Provider value={providerValue}>
            <Portal>
                <AnimatePresence>
                    {opened && (
                        <ContextMenu
                            minWidth={125}
                            ref={mergedRef}
                            xPos={ctx.xPos}
                            yPos={ctx.yPos}
                        >
                            <Stack gap={0}>
                                <Stack
                                    gap={0}
                                    onClick={closeContextMenu}
                                >
                                    {ctx.menuItems?.map((item) => {
                                        return (
                                            !contextMenuItems[item.id].disabled && (
                                                <Fragment key={`context-menu-${item.id}`}>
                                                    {item.children ? (
                                                        <HoverCard
                                                            offset={0}
                                                            position="right"
                                                        >
                                                            <HoverCard.Target>
                                                                <ContextMenuButton
                                                                    leftIcon={
                                                                        contextMenuItems[item.id]
                                                                            .leftIcon
                                                                    }
                                                                    onClick={
                                                                        contextMenuItems[item.id]
                                                                            .onClick
                                                                    }
                                                                    rightIcon={
                                                                        contextMenuItems[item.id]
                                                                            .rightIcon
                                                                    }
                                                                >
                                                                    {
                                                                        contextMenuItems[item.id]
                                                                            .label
                                                                    }
                                                                </ContextMenuButton>
                                                            </HoverCard.Target>
                                                            <HoverCard.Dropdown>
                                                                <Stack gap={0}>
                                                                    {contextMenuItems[
                                                                        item.id
                                                                    ].children?.map((child) => (
                                                                        <ContextMenuButton
                                                                            key={`sub-${child.id}`}
                                                                            leftIcon={
                                                                                child.leftIcon
                                                                            }
                                                                            onClick={child.onClick}
                                                                            rightIcon={
                                                                                child.rightIcon
                                                                            }
                                                                        >
                                                                            {child.label}
                                                                        </ContextMenuButton>
                                                                    ))}
                                                                </Stack>
                                                            </HoverCard.Dropdown>
                                                        </HoverCard>
                                                    ) : (
                                                        <ContextMenuButton
                                                            leftIcon={
                                                                contextMenuItems[item.id].leftIcon
                                                            }
                                                            onClick={
                                                                contextMenuItems[item.id].onClick
                                                            }
                                                            rightIcon={
                                                                contextMenuItems[item.id].rightIcon
                                                            }
                                                        >
                                                            {contextMenuItems[item.id].label}
                                                        </ContextMenuButton>
                                                    )}

                                                    {item.divider && (
                                                        <Divider
                                                            key={`context-menu-divider-${item.id}`}
                                                        />
                                                    )}
                                                </Fragment>
                                            )
                                        );
                                    })}
                                </Stack>
                                <ContextMenuButton disabled>
                                    {t('page.contextMenu.numberSelected', {
                                        count: ctx.data?.length || 0,
                                        postProcess: 'lowerCase',
                                    })}
                                </ContextMenuButton>
                            </Stack>
                        </ContextMenu>
                    )}
                </AnimatePresence>
                {children}
            </Portal>
        </ContextMenuContext.Provider>
    );
};
