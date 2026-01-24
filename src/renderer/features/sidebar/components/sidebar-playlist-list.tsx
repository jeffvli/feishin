import { openContextModal } from '@mantine/modals';
import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { memo, MouseEvent, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { generatePath, Link } from 'react-router';

import styles from './sidebar-playlist-list.module.css';

import { useItemImageUrl } from '/@/renderer/components/item-image/item-image';
import { ContextMenuController } from '/@/renderer/features/context-menu/context-menu-controller';
import { usePlayer } from '/@/renderer/features/player/context/player-context';
import { playlistsQueries } from '/@/renderer/features/playlists/api/playlists-api';
import { openCreatePlaylistModal } from '/@/renderer/features/playlists/components/create-playlist-form';
import {
    LONG_PRESS_PLAY_BEHAVIOR,
    PlayTooltip,
} from '/@/renderer/features/shared/components/play-button-group';
import { usePlayButtonClick } from '/@/renderer/features/shared/hooks/use-play-button-click';
import { useDragDrop } from '/@/renderer/hooks/use-drag-drop';
import { AppRoute } from '/@/renderer/router/routes';
import {
    useCurrentServer,
    useCurrentServerId,
    usePermissions,
    useSidebarPlaylistSorting,
} from '/@/renderer/store';
import { formatDurationString } from '/@/renderer/utils';
import { Accordion } from '/@/shared/components/accordion/accordion';
import { ActionIcon, ActionIconGroup } from '/@/shared/components/action-icon/action-icon';
import { ButtonProps } from '/@/shared/components/button/button';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { Image } from '/@/shared/components/image/image';
import { Text } from '/@/shared/components/text/text';
import { useLocalStorage } from '/@/shared/hooks/use-local-storage';
import {
    LibraryItem,
    Playlist,
    PlaylistListSort,
    Song,
    SortOrder,
} from '/@/shared/types/domain-types';
import { DragOperation, DragTarget } from '/@/shared/types/drag-and-drop';
import { Play } from '/@/shared/types/types';

const getPlaylistOrderKey = (serverId: string | undefined, scope: 'owned' | 'shared') => {
    const sid = serverId || 'local';
    return `playlist_order:${sid}:${scope}`;
};

interface PlaylistRowButtonProps extends Omit<ButtonProps, 'onContextMenu' | 'onPlay'> {
    item: Playlist;
    name: string;
    onContextMenu: (e: MouseEvent<HTMLAnchorElement>, item: Playlist) => void;
    onReorder?: (sourceIds: string[], targetId: string, edge: 'bottom' | 'top' | null) => void;
    to: string;
}

const PlaylistRowButton = memo(
    ({ item, name, onContextMenu, onReorder, to }: PlaylistRowButtonProps) => {
        const url = {
            pathname: generatePath(AppRoute.PLAYLISTS_DETAIL_SONGS, { playlistId: to }),
            state: { item },
        };
        const { t } = useTranslation();
        const sidebarPlaylistSorting = useSidebarPlaylistSorting();

        const [isHovered, setIsHovered] = useState(false);

        const { isDraggedOver, isDragging, ref } = useDragDrop<HTMLAnchorElement>({
            drag: {
                getId: () => {
                    return item && item.id ? [item.id] : [];
                },
                getItem: () => {
                    return item ? [item] : [];
                },
                itemType: LibraryItem.PLAYLIST,
                operation: [DragOperation.ADD, DragOperation.REORDER],
                target: DragTarget.PLAYLIST,
            },
            drop: {
                canDrop: (args) => {
                    // Allow dropping items into a playlist (ADD)
                    const canAdd =
                        args.source.itemType !== undefined &&
                        args.source.type !== DragTarget.PLAYLIST &&
                        (args.source.operation?.includes(DragOperation.ADD) ?? false);

                    // Allow reordering playlists when source is playlist and operation includes REORDER
                    // do not allow cross-scope reorders
                    const canReorder =
                        args.source.itemType === LibraryItem.PLAYLIST &&
                        args.source.type === DragTarget.PLAYLIST &&
                        (args.source.operation?.includes(DragOperation.REORDER) ?? false);
                    return canAdd || (canReorder && sidebarPlaylistSorting);
                },
                getData: () => {
                    return {
                        id: [to],
                        item: [],
                        itemType: LibraryItem.PLAYLIST,
                        type: DragTarget.PLAYLIST,
                    };
                },
                onDrag: () => {
                    return;
                },
                onDragLeave: () => {
                    return;
                },
                onDrop: (args) => {
                    const sourceItemType = args.source.itemType as LibraryItem;
                    const sourceIds = args.source.id;

                    // Handle playlist reordering locally
                    if (
                        sourceItemType === LibraryItem.PLAYLIST &&
                        (args.source.operation?.includes(DragOperation.REORDER) ?? false) &&
                        args.edge &&
                        (args.edge === 'top' || args.edge === 'bottom') &&
                        onReorder
                    ) {
                        const sourceItems = Array.isArray(args.source.item)
                            ? (args.source.item as Playlist[])
                            : undefined;

                        // Prevent cross-scope reorders (owned <-> shared)
                        if (sourceItems && sourceItems.length > 0) {
                            if (sourceItems.some((si) => si.ownerId !== item.ownerId)) {
                                return;
                            }
                        }

                        onReorder(sourceIds, to, args.edge);
                        return;
                    }

                    const modalProps: {
                        albumId?: string[];
                        artistId?: string[];
                        folderId?: string[];
                        genreId?: string[];
                        initialSelectedIds?: string[];
                        playlistId?: string[];
                        songId?: string[];
                    } = {
                        initialSelectedIds: [to],
                    };

                    switch (sourceItemType) {
                        case LibraryItem.ALBUM:
                            modalProps.albumId = sourceIds;
                            break;
                        case LibraryItem.ALBUM_ARTIST:
                        case LibraryItem.ARTIST:
                            modalProps.artistId = sourceIds;
                            break;
                        case LibraryItem.FOLDER:
                            modalProps.folderId = sourceIds;
                            break;
                        case LibraryItem.GENRE:
                            modalProps.genreId = sourceIds;
                            break;
                        case LibraryItem.PLAYLIST:
                            modalProps.playlistId = sourceIds;
                            break;
                        case LibraryItem.PLAYLIST_SONG:
                        case LibraryItem.QUEUE_SONG:
                        case LibraryItem.SONG:
                            if (args.source.item && Array.isArray(args.source.item)) {
                                const songs = args.source.item as Song[];
                                modalProps.songId = songs.map((song) => song.id);
                            } else {
                                modalProps.songId = sourceIds;
                            }
                            break;
                        default:
                            return;
                    }

                    openContextModal({
                        innerProps: modalProps,
                        modalKey: 'addToPlaylist',
                        size: 'lg',
                        title: t('form.addToPlaylist.title', { postProcess: 'titleCase' }),
                    });
                },
            },
            isEnabled: true,
        });

        const player = usePlayer();
        const serverId = useCurrentServerId();

        const permissions = usePermissions();

        const handlePlay = useCallback(
            (id: string, type: Play) => {
                player.addToQueueByFetch(serverId, [id], LibraryItem.PLAYLIST, type);
            },
            [player, serverId],
        );

        const imageUrl = useItemImageUrl({
            id: item.imageId || undefined,
            itemType: LibraryItem.PLAYLIST,
            type: 'table',
        });

        return (
            <Link
                className={clsx(styles.row, {
                    [styles.rowDraggedOver]: isDraggedOver,
                    [styles.rowHover]: isHovered,
                })}
                onContextMenu={(e: MouseEvent<HTMLAnchorElement>) => {
                    e.preventDefault();
                    onContextMenu(e, item);
                }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                ref={ref}
                style={{
                    opacity: isDragging ? 0.5 : 1,
                }}
                to={url}
            >
                <div className={styles.rowGroup}>
                    <Image containerClassName={styles.imageContainer} src={imageUrl} />
                    <div className={styles.metadata}>
                        <Text className={styles.name} fw={500} size="md">
                            {name}
                        </Text>
                        <div className={styles.metadataGroup}>
                            <div
                                className={clsx(
                                    styles.metadataGroupItem,
                                    styles.metadataGroupItemNoShrink,
                                )}
                            >
                                <Icon color="muted" icon="itemSong" size="sm" />
                                <Text isMuted size="sm">
                                    {item.songCount || 0}
                                </Text>
                            </div>
                            <div className={styles.metadataGroupItem}>
                                <Icon color="muted" icon="duration" size="sm" />
                                <Text isMuted size="sm">
                                    {formatDurationString(item.duration ?? 0)}
                                </Text>
                            </div>
                            {item.ownerId === permissions.userId && Boolean(item.public) && (
                                <div className={styles.metadataGroupItem}>
                                    <Text isMuted size="sm">
                                        {t('common.public', { postProcess: 'titleCase' })}
                                    </Text>
                                </div>
                            )}
                            {item.ownerId !== permissions.userId && (
                                <div className={styles.metadataGroupItem}>
                                    <Icon color="muted" icon="user" size="sm" />
                                    <Text isMuted size="sm">
                                        {item.owner}
                                    </Text>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {isHovered && <RowControls id={to} onPlay={handlePlay} />}
            </Link>
        );
    },
);

const RowControls = ({
    id,
    onPlay,
}: {
    id: string;
    onPlay: (id: string, playType: Play) => void;
}) => {
    const handlePlayNext = usePlayButtonClick({
        onClick: () => {
            onPlay(id, Play.NEXT);
        },
        onLongPress: () => {
            onPlay(id, LONG_PRESS_PLAY_BEHAVIOR[Play.NEXT]);
        },
    });

    const handlePlayNow = usePlayButtonClick({
        onClick: () => {
            onPlay(id, Play.NOW);
        },
        onLongPress: () => {
            onPlay(id, LONG_PRESS_PLAY_BEHAVIOR[Play.NOW]);
        },
    });

    const handlePlayLast = usePlayButtonClick({
        onClick: () => {
            onPlay(id, Play.LAST);
        },
        onLongPress: () => {
            onPlay(id, LONG_PRESS_PLAY_BEHAVIOR[Play.LAST]);
        },
    });

    return (
        <ActionIconGroup className={styles.controls}>
            <PlayTooltip type={Play.NOW}>
                <ActionIcon
                    icon="mediaPlay"
                    iconProps={{
                        size: 'md',
                    }}
                    size="xs"
                    variant="subtle"
                    {...handlePlayNow.handlers}
                    {...handlePlayNow.props}
                />
            </PlayTooltip>
            <PlayTooltip type={Play.NEXT}>
                <ActionIcon
                    icon="mediaPlayNext"
                    iconProps={{
                        size: 'md',
                    }}
                    size="xs"
                    variant="subtle"
                    {...handlePlayNext.handlers}
                    {...handlePlayNext.props}
                />
            </PlayTooltip>
            <PlayTooltip type={Play.LAST}>
                <ActionIcon
                    icon="mediaPlayLast"
                    iconProps={{
                        size: 'md',
                    }}
                    size="xs"
                    variant="subtle"
                    {...handlePlayLast.handlers}
                    {...handlePlayLast.props}
                />
            </PlayTooltip>
        </ActionIconGroup>
    );
};

export const SidebarPlaylistList = () => {
    const player = usePlayer();
    const { t } = useTranslation();
    const server = useCurrentServer();
    const sidebarPlaylistSorting = useSidebarPlaylistSorting();

    const playlistsQuery = useQuery(
        playlistsQueries.list({
            query: {
                sortBy: PlaylistListSort.NAME,
                sortOrder: SortOrder.ASC,
                startIndex: 0,
            },
            serverId: server?.id,
        }),
    );

    const handlePlayPlaylist = useCallback(
        (id: string, playType: Play) => {
            player.addToQueueByFetch(server.id, [id], LibraryItem.PLAYLIST, playType);
        },
        [player, server.id],
    );

    const handleContextMenu = useCallback(
        (e: MouseEvent<HTMLAnchorElement>, playlist: Playlist) => {
            e.preventDefault();
            e.stopPropagation();
            ContextMenuController.call({
                cmd: { items: [playlist], type: LibraryItem.PLAYLIST },
                event: e,
            });
        },
        [],
    );

    const [playlistOrder, setPlaylistOrder] = useLocalStorage<string[]>({
        defaultValue: [],
        key: getPlaylistOrderKey(server.id, 'owned'),
    });

    const playlistItems = useMemo(() => {
        const base = { handlePlay: handlePlayPlaylist };

        if (!server?.type || !server?.username || !playlistsQuery.data?.items) {
            return { ...base, items: playlistsQuery.data?.items };
        }

        const ownedPlaylistItems: Array<Playlist> = [];

        for (const playlist of playlistsQuery.data?.items ?? []) {
            if (!playlist.owner || playlist.owner === server.username) {
                ownedPlaylistItems.push(playlist);
            }
        }

        if (!ownedPlaylistItems || !sidebarPlaylistSorting || !playlistOrder) {
            return { ...base, items: ownedPlaylistItems };
        }

        // Apply saved order, include only playlists that still exist
        const idMap = new Map(ownedPlaylistItems.map((it) => [it.id, it]));
        const ordered = playlistOrder
            .map((id) => idMap.get(id))
            .filter((it): it is Playlist => it !== undefined);

        // Append any new items that weren't in saved order
        const remaining = ownedPlaylistItems.filter((it) => !playlistOrder.includes(it.id));
        const newPlaylistItems = [...ordered, ...remaining];
        return { ...base, items: newPlaylistItems };
    }, [
        handlePlayPlaylist,
        playlistsQuery.data?.items,
        server.type,
        server.username,
        sidebarPlaylistSorting,
        playlistOrder,
    ]);

    const handleReorder = (
        sourceIds: string[],
        targetId: string,
        edge: 'bottom' | 'top' | null,
    ) => {
        if (!playlistItems?.items || !edge) return;

        const currentIds = playlistItems.items.map((p) => p.id);
        const targetIndex = currentIds.indexOf(targetId);
        if (targetIndex === -1) return;

        const idsWithoutSources = currentIds.filter((id) => !sourceIds.includes(id));

        const sourcesBeforeTarget = sourceIds.filter((id) => {
            const sourceIndex = currentIds.indexOf(id);
            return sourceIndex !== -1 && sourceIndex < targetIndex;
        }).length;

        const insertIndexInFiltered =
            edge === 'top'
                ? targetIndex - sourcesBeforeTarget
                : targetIndex - sourcesBeforeTarget + 1;

        const insertIndex = Math.max(0, Math.min(insertIndexInFiltered, idsWithoutSources.length));

        const reorderedIds = [
            ...idsWithoutSources.slice(0, insertIndex),
            ...sourceIds,
            ...idsWithoutSources.slice(insertIndex),
        ];

        setPlaylistOrder(reorderedIds);
    };

    const handleCreatePlaylistModal = (e: MouseEvent<HTMLButtonElement>) => {
        openCreatePlaylistModal(server, e);
    };

    return (
        <Accordion.Item value="playlists">
            <Accordion.Control component="div" role="button" style={{ userSelect: 'none' }}>
                <Group justify="space-between" pr="var(--theme-spacing-md)">
                    <Text fw={500}>
                        {t('page.sidebar.playlists', {
                            postProcess: 'titleCase',
                        })}
                    </Text>
                    <Group gap="xs">
                        <ActionIcon
                            icon="add"
                            iconProps={{
                                size: 'lg',
                            }}
                            onClick={handleCreatePlaylistModal}
                            size="xs"
                            tooltip={{
                                label: t('action.createPlaylist', {
                                    postProcess: 'sentenceCase',
                                }),
                            }}
                            variant="subtle"
                        />
                        <ActionIcon
                            component={Link}
                            icon="list"
                            iconProps={{
                                size: 'lg',
                            }}
                            onClick={(e) => e.stopPropagation()}
                            size="xs"
                            to={AppRoute.PLAYLISTS}
                            tooltip={{
                                label: t('action.viewPlaylists', {
                                    postProcess: 'sentenceCase',
                                }),
                            }}
                            variant="subtle"
                        />
                    </Group>
                </Group>
            </Accordion.Control>
            <Accordion.Panel>
                {playlistItems?.items?.map((item, index) => (
                    <PlaylistRowButton
                        item={item}
                        key={index}
                        name={item.name}
                        onContextMenu={handleContextMenu}
                        onReorder={handleReorder}
                        to={item.id}
                    />
                ))}
            </Accordion.Panel>
        </Accordion.Item>
    );
};

export const SidebarSharedPlaylistList = () => {
    const player = usePlayer();
    const { t } = useTranslation();
    const server = useCurrentServer();
    const sidebarPlaylistSorting = useSidebarPlaylistSorting();

    const playlistsQuery = useQuery(
        playlistsQueries.list({
            query: {
                sortBy: PlaylistListSort.NAME,
                sortOrder: SortOrder.ASC,
                startIndex: 0,
            },
            serverId: server?.id,
        }),
    );

    const handlePlayPlaylist = useCallback(
        (id: string, playType: Play) => {
            if (!server?.id) return;
            player.addToQueueByFetch(server.id, [id], LibraryItem.PLAYLIST, playType);
        },
        [player, server.id],
    );

    const handleContextMenu = useCallback(
        (e: MouseEvent<HTMLAnchorElement>, playlist: Playlist) => {
            e.preventDefault();
            e.stopPropagation();
            ContextMenuController.call({
                cmd: {
                    items: [playlist],
                    type: LibraryItem.PLAYLIST,
                },
                event: e,
            });
        },
        [],
    );

    const [playlistOrder, setPlaylistOrder] = useLocalStorage<string[]>({
        defaultValue: [],
        key: getPlaylistOrderKey(server.id, 'shared'),
    });

    const playlistItems = useMemo(() => {
        const base = { handlePlay: handlePlayPlaylist };

        if (!server?.type || !server?.username || !playlistsQuery.data?.items) {
            return { ...base, items: playlistsQuery.data?.items };
        }

        const sharedPlaylistItems: Array<Playlist> = [];

        for (const playlist of playlistsQuery.data?.items ?? []) {
            if (playlist.owner && playlist.owner !== server.username) {
                sharedPlaylistItems.push(playlist);
            }
        }

        if (!sharedPlaylistItems || !sidebarPlaylistSorting || !playlistOrder) {
            return { ...base, items: sharedPlaylistItems };
        }

        // Apply saved order, include only playlists that still exist
        const idMap = new Map(sharedPlaylistItems.map((it) => [it.id, it]));
        const ordered = playlistOrder
            .map((id) => idMap.get(id))
            .filter((it): it is Playlist => it !== undefined);

        // Append any new items that weren't in saved order
        const remaining = sharedPlaylistItems.filter((it) => !playlistOrder.includes(it.id));
        const newPlaylistItems = [...ordered, ...remaining];
        return { ...base, items: newPlaylistItems };
    }, [
        handlePlayPlaylist,
        playlistsQuery.data?.items,
        server.type,
        server.username,
        sidebarPlaylistSorting,
        playlistOrder,
    ]);

    const handleReorder = (
        sourceIds: string[],
        targetId: string,
        edge: 'bottom' | 'top' | null,
    ) => {
        if (!playlistItems?.items || !edge) return;

        const currentIds = playlistItems.items.map((p) => p.id);
        const targetIndex = currentIds.indexOf(targetId);
        if (targetIndex === -1) return;

        const idsWithoutSources = currentIds.filter((id) => !sourceIds.includes(id));

        const sourcesBeforeTarget = sourceIds.filter((id) => {
            const sourceIndex = currentIds.indexOf(id);
            return sourceIndex !== -1 && sourceIndex < targetIndex;
        }).length;

        const insertIndexInFiltered =
            edge === 'top'
                ? targetIndex - sourcesBeforeTarget
                : targetIndex - sourcesBeforeTarget + 1;

        const insertIndex = Math.max(0, Math.min(insertIndexInFiltered, idsWithoutSources.length));

        const reorderedIds = [
            ...idsWithoutSources.slice(0, insertIndex),
            ...sourceIds,
            ...idsWithoutSources.slice(insertIndex),
        ];

        setPlaylistOrder(reorderedIds);
    };

    if (playlistItems?.items?.length === 0) {
        return null;
    }

    return (
        <Accordion.Item value="shared-playlists">
            <Accordion.Control>
                <Text fw={500} variant="secondary">
                    {t('page.sidebar.shared', {
                        postProcess: 'titleCase',
                    })}
                </Text>
            </Accordion.Control>
            <Accordion.Panel>
                {playlistItems?.items?.map((item, index) => (
                    <PlaylistRowButton
                        item={item}
                        key={index}
                        name={item.name}
                        onContextMenu={handleContextMenu}
                        onReorder={handleReorder}
                        to={item.id}
                    />
                ))}
            </Accordion.Panel>
        </Accordion.Item>
    );
};
