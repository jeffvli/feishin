import { openContextModal } from '@mantine/modals';
import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { memo, MouseEvent, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { generatePath, Link } from 'react-router';

import styles from './sidebar-playlist-list.module.css';

import { getDraggedItems } from '/@/renderer/components/item-list/helpers/get-dragged-items';
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
import { useCurrentServer, useCurrentServerId, usePermissions } from '/@/renderer/store';
import { formatDurationString } from '/@/renderer/utils';
import { Accordion } from '/@/shared/components/accordion/accordion';
import { ActionIcon, ActionIconGroup } from '/@/shared/components/action-icon/action-icon';
import { ButtonProps } from '/@/shared/components/button/button';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { Image } from '/@/shared/components/image/image';
import { Text } from '/@/shared/components/text/text';
import {
    LibraryItem,
    Playlist,
    PlaylistListSort,
    Song,
    SortOrder,
} from '/@/shared/types/domain-types';
import { DragOperation, DragTarget } from '/@/shared/types/drag-and-drop';
import { Play } from '/@/shared/types/types';

interface PlaylistRowButtonProps extends Omit<ButtonProps, 'onContextMenu' | 'onPlay'> {
    item: Playlist;
    name: string;
    onContextMenu: (e: MouseEvent<HTMLAnchorElement>, item: Playlist) => void;
    to: string;
}

const PlaylistRowButton = memo(({ item, name, onContextMenu, to }: PlaylistRowButtonProps) => {
    const url = {
        pathname: generatePath(AppRoute.PLAYLISTS_DETAIL_SONGS, { playlistId: to }),
        state: { item },
    };
    const { t } = useTranslation();

    const [isHovered, setIsHovered] = useState(false);

    const { isDraggedOver, isDragging, ref } = useDragDrop<HTMLAnchorElement>({
        drag: {
            getId: () => {
                const draggedItems = getDraggedItems(item, undefined);
                return draggedItems.map((draggedItem) => draggedItem.id);
            },
            getItem: () => {
                const draggedItems = getDraggedItems(item, undefined);
                return draggedItems;
            },
            itemType: LibraryItem.PLAYLIST,
            operation: [DragOperation.ADD],
            target: DragTarget.PLAYLIST,
        },
        drop: {
            canDrop: (args) => {
                return (
                    args.source.itemType !== undefined &&
                    args.source.type !== DragTarget.PLAYLIST &&
                    (args.source.operation?.includes(DragOperation.ADD) ?? false)
                );
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
                <Image containerClassName={styles.imageContainer} src={item.imageUrl || ''} />
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
});

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

    const memoizedItemData = useMemo(() => {
        const base = { handlePlay: handlePlayPlaylist };

        if (!server?.type || !server?.username || !playlistsQuery.data?.items) {
            return { ...base, items: playlistsQuery.data?.items };
        }

        const owned: Array<[boolean, () => void] | Playlist> = [];

        for (const playlist of playlistsQuery.data?.items ?? []) {
            if (!playlist.owner || playlist.owner === server.username) {
                owned.push(playlist);
            }
        }

        return { ...base, items: owned };
    }, [playlistsQuery.data?.items, handlePlayPlaylist, server?.type, server.username]);

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
                {memoizedItemData?.items?.map((item, index) => (
                    <PlaylistRowButton
                        item={item}
                        key={index}
                        name={item.name}
                        onContextMenu={handleContextMenu}
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

    const memoizedItemData = useMemo(() => {
        const base = { handlePlay: handlePlayPlaylist };

        if (!server?.type || !server?.username || !playlistsQuery.data?.items) {
            return { ...base, items: playlistsQuery.data?.items };
        }

        const shared: Playlist[] = [];

        for (const playlist of playlistsQuery.data?.items ?? []) {
            if (playlist.owner && playlist.owner !== server.username) {
                shared.push(playlist);
            }
        }

        return { ...base, items: shared };
    }, [handlePlayPlaylist, playlistsQuery.data?.items, server?.type, server.username]);

    if (memoizedItemData?.items?.length === 0) {
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
                {memoizedItemData?.items?.map((item, index) => (
                    <PlaylistRowButton
                        item={item}
                        key={index}
                        name={item.name}
                        onContextMenu={handleContextMenu}
                        to={item.id}
                    />
                ))}
            </Accordion.Panel>
        </Accordion.Item>
    );
};
