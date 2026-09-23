import { openContextModal } from '@mantine/modals';
import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { motion } from 'motion/react';
import { createContext, memo, MouseEvent, useCallback, useContext, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { generatePath, Link } from 'react-router';

import collapsedSidebarItemStyles from './collapsed-sidebar-item.module.css';
import styles from './sidebar-playlist-list.module.css';

import { ItemImage, useItemImageUrl } from '/@/renderer/components/item-image/item-image';
import imageColumnStyles from '/@/renderer/components/item-list/item-table-list/columns/image-column.module.css';
import { ContextMenuController } from '/@/renderer/features/context-menu/context-menu-controller';
import { usePlayer } from '/@/renderer/features/player/context/player-context';
import { playlistsQueries } from '/@/renderer/features/playlists/api/playlists-api';
import { openCreatePlaylistModal } from '/@/renderer/features/playlists/components/create-playlist-form';
import { useIsMutatingSidebarPlaylistFolderMove } from '/@/renderer/features/playlists/mutations/sidebar-playlist-folder-move-mutation';
import { ItemRowPlayControls } from '/@/renderer/features/shared/components/item-row-play-controls';
import { PlayButton } from '/@/renderer/features/shared/components/play-button';
import {
    LONG_PRESS_PLAY_BEHAVIOR,
    PlayTooltip,
} from '/@/renderer/features/shared/components/play-button-group';
import {
    collectFolderPaths,
    PlaylistFolderDragExpandProvider,
    PlaylistFolderViews,
    PlaylistRootAccordionControl,
    usePlaylistFolderState,
    usePlaylistFolderViewState,
    usePlaylistNavigationState,
} from '/@/renderer/features/sidebar/components/playlist-folder-tree';
import { useDragDrop } from '/@/renderer/hooks/use-drag-drop';
import { useDragMonitor } from '/@/renderer/hooks/use-drag-monitor';
import { AppRoute } from '/@/renderer/router/routes';
import {
    useCurrentPlaylistContextId,
    useCurrentServer,
    useCurrentServerId,
    usePermissions,
    usePlayButtonBehavior,
    useSidebarPlaylistListFilterRegex,
    useSidebarPlaylistMode,
    useSidebarPlaylistSorting,
} from '/@/renderer/store';
import { formatDurationString } from '/@/renderer/utils';
import { Accordion } from '/@/shared/components/accordion/accordion';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { animationProps } from '/@/shared/components/animations/animation-props';
import { animationVariants } from '/@/shared/components/animations/animation-variants';
import { ButtonProps } from '/@/shared/components/button/button';
import { Divider } from '/@/shared/components/divider/divider';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { LoadingOverlay } from '/@/shared/components/loading-overlay/loading-overlay';
import { Text } from '/@/shared/components/text/text';
import { Tooltip } from '/@/shared/components/tooltip/tooltip';
import { useLocalStorage } from '/@/shared/hooks/use-local-storage';
import {
    LibraryItem,
    Playlist,
    PlaylistListSort,
    Song,
    SortOrder,
} from '/@/shared/types/domain-types';
import { DragData, DragOperation, DragTarget } from '/@/shared/types/drag-and-drop';
import { Play } from '/@/shared/types/types';

const MotionLink = motion.create(Link);

const playlistRowDimVariants = animationVariants.combine(animationVariants.fadeIn, {
    hidden: { opacity: 0.5 },
});

const getPlaylistOrderKey = (serverId: string | undefined, scope: 'owned' | 'shared') => {
    const sid = serverId || 'local';
    return `playlist_order:${sid}:${scope}`;
};

export const SidebarPlaylistAddDragContext = createContext(false);

const isAddToPlaylistDragSource = (source: DragData) => {
    return (
        source.itemType !== undefined &&
        source.type !== DragTarget.PLAYLIST &&
        (source.operation?.includes(DragOperation.ADD) ?? false)
    );
};

export const useSidebarPlaylistAddDragMonitor = () => {
    const [isAddDragActive, setIsAddDragActive] = useState(false);

    const handleAddDragStart = useCallback(() => {
        setIsAddDragActive(true);
    }, []);

    const handleAddDragDrop = useCallback(() => {
        setIsAddDragActive(false);
    }, []);

    useDragMonitor({
        canMonitor: isAddToPlaylistDragSource,
        onDragStart: handleAddDragStart,
        onDrop: handleAddDragDrop,
    });

    return isAddDragActive;
};

export interface PlaylistRowButtonProps extends Omit<ButtonProps, 'onContextMenu' | 'onPlay'> {
    // Collapsed sidebar: image only, name in a tooltip, no play controls
    iconOnly?: boolean;
    item: Playlist;
    name: string;
    onContextMenu: (e: MouseEvent<HTMLAnchorElement>, item: Playlist) => void;
    onReorder?: (sourceIds: string[], targetId: string, edge: 'bottom' | 'top' | null) => void;
    to: string;
}

export const PlaylistRowButton = memo(
    ({ iconOnly, item, name, onContextMenu, onReorder, to }: PlaylistRowButtonProps) => {
        const url = {
            pathname: generatePath(AppRoute.PLAYLISTS_DETAIL_SONGS, { playlistId: to }),
            state: { item },
        };
        const { t } = useTranslation();
        const sidebarPlaylistSorting = useSidebarPlaylistSorting();
        const sidebarPlaylistMode = useSidebarPlaylistMode();
        const isCompact = sidebarPlaylistMode === 'compact';
        const activePlaylistId = useCurrentPlaylistContextId();
        const isActive = activePlaylistId === item.id;

        const [isHovered, setIsHovered] = useState(false);
        const isSmartPlaylist = Boolean(item.rules);
        const isAddDragActive = useContext(SidebarPlaylistAddDragContext);

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
                        !isSmartPlaylist &&
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

                    if (isSmartPlaylist) {
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
                        modal: 'addToPlaylist',
                        size: 'lg',
                        title: t('form.addToPlaylist.title'),
                    });
                },
            },
            isEnabled: true,
        });

        const player = usePlayer();
        const serverId = useCurrentServerId();

        const permissions = usePermissions();
        const playButtonBehavior = usePlayButtonBehavior();

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

        const isDimmed = isDragging || (isSmartPlaylist && isAddDragActive);

        return (
            <MotionLink
                {...animationProps.fadeIn}
                animate={isDimmed ? 'hidden' : 'show'}
                className={clsx(styles.row, {
                    [styles.rowCompact]: isCompact && !iconOnly,
                    [styles.rowDraggedOver]: isDraggedOver && !isSmartPlaylist,
                    [styles.rowHover]: isHovered && !iconOnly,
                    [styles.rowIconOnly]: iconOnly,
                })}
                initial={false}
                onContextMenu={(e: MouseEvent<HTMLAnchorElement>) => {
                    e.preventDefault();
                    onContextMenu(e, item);
                }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                ref={ref}
                to={url}
                variants={playlistRowDimVariants}
            >
                {iconOnly ? (
                    <Tooltip label={name} openDelay={0} position="right">
                        <div
                            className={clsx(styles.iconOnlyImage, {
                                [styles.iconOnlyImageActive]: isActive,
                            })}
                        >
                            <ItemImage
                                blurHash={item.blurHash}
                                containerClassName={styles.imageContainer}
                                dominantColor={item.dominantColor}
                                id={item.imageId}
                                itemType={LibraryItem.PLAYLIST}
                                src={imageUrl}
                                thumbHash={item.thumbHash}
                                type="table"
                            />
                            {isHovered && (
                                <div className={imageColumnStyles.playButtonOverlay}>
                                    <PlayTooltip type={playButtonBehavior}>
                                        <PlayButton
                                            fill
                                            onClick={() => handlePlay(to, playButtonBehavior)}
                                            onLongPress={() =>
                                                handlePlay(
                                                    to,
                                                    LONG_PRESS_PLAY_BEHAVIOR[playButtonBehavior],
                                                )
                                            }
                                        />
                                    </PlayTooltip>
                                </div>
                            )}
                        </div>
                    </Tooltip>
                ) : isCompact ? (
                    <>
                        <Text
                            className={clsx(styles.compactName, {
                                [styles.nameActive]: isActive,
                            })}
                            fw={500}
                            size="md"
                        >
                            {name}
                        </Text>
                        {isHovered && (
                            <ItemRowPlayControls
                                className={clsx(styles.controls, styles.controlsCompact)}
                                onPlay={(playType) => handlePlay(to, playType)}
                            />
                        )}
                    </>
                ) : (
                    <>
                        <div className={styles.rowGroup}>
                            <ItemImage
                                blurHash={item.blurHash}
                                containerClassName={styles.imageContainer}
                                dominantColor={item.dominantColor}
                                id={item.imageId}
                                itemType={LibraryItem.PLAYLIST}
                                src={imageUrl}
                                thumbHash={item.thumbHash}
                            />
                            <div className={styles.metadata}>
                                <Text
                                    className={clsx(styles.name, {
                                        [styles.nameActive]: isActive,
                                    })}
                                    fw={500}
                                    size="md"
                                >
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
                                    {item.ownerId === permissions.userId &&
                                        Boolean(item.public) && (
                                            <div className={styles.metadataGroupItem}>
                                                <Text isMuted size="sm">
                                                    {t('common.public')}
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

                        {isHovered && (
                            <ItemRowPlayControls
                                className={styles.controls}
                                onPlay={(playType) => handlePlay(to, playType)}
                            />
                        )}
                    </>
                )}
            </MotionLink>
        );
    },
);

const handlePlaylistContextMenu = (e: MouseEvent<HTMLAnchorElement>, playlist: Playlist) => {
    e.preventDefault();
    e.stopPropagation();
    ContextMenuController.call({
        cmd: { items: [playlist], type: LibraryItem.PLAYLIST },
        event: e,
    });
};

const useSidebarPlaylistItems = (scope: 'owned' | 'shared') => {
    const server = useCurrentServer();
    const sidebarPlaylistSorting = useSidebarPlaylistSorting();
    const filterRegex = useSidebarPlaylistListFilterRegex();

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

    const [playlistOrder, setPlaylistOrder] = useLocalStorage<string[]>({
        defaultValue: [],
        key: getPlaylistOrderKey(server.id, scope),
    });

    const items = useMemo(() => {
        if (!server?.type || !server?.username || !playlistsQuery.data?.items) {
            return playlistsQuery.data?.items;
        }

        let regex: null | RegExp = null;
        if (filterRegex) {
            try {
                regex = new RegExp(filterRegex, 'i');
            } catch {
                // Invalid regex, ignore filtering
            }
        }

        const scopedPlaylistItems: Array<Playlist> = [];

        for (const playlist of playlistsQuery.data?.items ?? []) {
            const isOwned = !playlist.owner || playlist.owner === server.username;
            if (isOwned === (scope === 'owned')) {
                // Filter out playlists that match the regex
                if (regex && regex.test(playlist.name)) {
                    continue;
                }
                scopedPlaylistItems.push(playlist);
            }
        }

        if (!scopedPlaylistItems || !sidebarPlaylistSorting || !playlistOrder) {
            return scopedPlaylistItems;
        }

        // Apply saved order, include only playlists that still exist
        const idMap = new Map(scopedPlaylistItems.map((it) => [it.id, it]));
        const ordered = playlistOrder
            .map((id) => idMap.get(id))
            .filter((it): it is Playlist => it !== undefined);

        // Append any new items that weren't in saved order
        const remaining = scopedPlaylistItems.filter((it) => !playlistOrder.includes(it.id));
        return [...ordered, ...remaining];
    }, [
        playlistsQuery.data?.items,
        scope,
        server.type,
        server.username,
        sidebarPlaylistSorting,
        playlistOrder,
        filterRegex,
    ]);

    const handleReorder = (
        sourceIds: string[],
        targetId: string,
        edge: 'bottom' | 'top' | null,
    ) => {
        if (!items || !edge) return;

        const currentIds = items.map((p) => p.id);
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

    return { handleReorder, items };
};

export const SidebarPlaylistList = () => {
    const { t } = useTranslation();
    const server = useCurrentServer();
    const playlistItems = useSidebarPlaylistItems('owned');
    const { handleReorder } = playlistItems;

    const handleCreatePlaylistModal = (e: MouseEvent<HTMLButtonElement>) => {
        openCreatePlaylistModal(server, e);
    };

    const folderViewState = usePlaylistFolderViewState(playlistItems?.items ?? []);
    const { folderView, groups, tree } = folderViewState;
    const navigation = usePlaylistNavigationState();
    const inNavigation = folderView === 'navigation' && navigation.pathStack.length > 0;

    const folderPaths = useMemo(() => {
        if (folderView === 'single') {
            return groups.reduce<string[]>((acc, g) => {
                if (g.type === 'folder') acc.push(g.name);
                return acc;
            }, []);
        }
        return collectFolderPaths(tree);
    }, [folderView, groups, tree]);

    const { expandedSet, setMany, toggle } = usePlaylistFolderState('owned');
    const allExpanded =
        folderPaths.length > 0 && folderPaths.every((path) => expandedSet.has(path));

    const handleToggleAllFolders = useCallback(
        (e: MouseEvent<HTMLButtonElement>) => {
            e.stopPropagation();
            setMany(folderPaths, !allExpanded);
        },
        [setMany, folderPaths, allExpanded],
    );

    const handleNavigateUp = useCallback(
        (e: MouseEvent<HTMLButtonElement>) => {
            e.stopPropagation();
            navigation.goUp();
        },
        [navigation],
    );

    const showExpandAll = folderView !== 'navigation' && folderPaths.length > 0;
    const isFolderMovePending = useIsMutatingSidebarPlaylistFolderMove();

    return (
        <Accordion.Item value="playlists">
            <PlaylistRootAccordionControl allPlaylists={playlistItems?.items ?? []}>
                <Group gap="xs" justify="space-between" pr="var(--theme-spacing-md)" wrap="nowrap">
                    <Group gap="xs" style={{ minWidth: 0 }} wrap="nowrap">
                        {inNavigation && (
                            <ActionIcon
                                icon="arrowLeftS"
                                iconProps={{ size: 'lg' }}
                                onClick={handleNavigateUp}
                                size="xs"
                                tooltip={{ label: t('common.back') }}
                                variant="subtle"
                            />
                        )}
                        <Text className={styles.name} fw={500}>
                            {inNavigation ? navigation.currentName : t('page.sidebar.playlists')}
                        </Text>
                    </Group>
                    <Group gap="xs" wrap="nowrap">
                        <ActionIcon
                            icon="add"
                            iconProps={{
                                size: 'lg',
                            }}
                            onClick={handleCreatePlaylistModal}
                            size="xs"
                            tooltip={{
                                label: t('action.createPlaylist'),
                            }}
                            variant="subtle"
                        />
                        {showExpandAll && (
                            <ActionIcon
                                icon={allExpanded ? 'collapseAll' : 'expandAll'}
                                iconProps={{
                                    size: 'lg',
                                }}
                                onClick={handleToggleAllFolders}
                                size="xs"
                                tooltip={{
                                    label: t(
                                        allExpanded
                                            ? 'action.collapseAllFolders'
                                            : 'action.expandAllFolders',
                                        {
                                            postProcess: 'sentenceCase',
                                        },
                                    ),
                                }}
                                variant="subtle"
                            />
                        )}
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
                                label: t('action.viewPlaylists'),
                            }}
                            variant="subtle"
                        />
                    </Group>
                </Group>
            </PlaylistRootAccordionControl>
            <Accordion.Panel className={styles.panel}>
                <LoadingOverlay pos="absolute" visible={isFolderMovePending} />
                <PlaylistFolderDragExpandProvider expandedSet={expandedSet} setMany={setMany}>
                    <PlaylistFolderViews
                        {...folderViewState}
                        allPlaylists={playlistItems?.items ?? []}
                        expandedSet={expandedSet}
                        navigation={navigation}
                        onContextMenu={handlePlaylistContextMenu}
                        onReorder={handleReorder}
                        onToggleFolder={toggle}
                    />
                </PlaylistFolderDragExpandProvider>
            </Accordion.Panel>
        </Accordion.Item>
    );
};

export const SidebarSharedPlaylistList = () => {
    const { t } = useTranslation();
    const playlistItems = useSidebarPlaylistItems('shared');
    const { handleReorder } = playlistItems;

    const folderViewState = usePlaylistFolderViewState(playlistItems?.items ?? []);
    const navigation = usePlaylistNavigationState();
    const { expandedSet, setMany, toggle } = usePlaylistFolderState('shared');
    const inNavigation =
        folderViewState.folderView === 'navigation' && navigation.pathStack.length > 0;

    const handleNavigateUp = useCallback(
        (e: MouseEvent<HTMLButtonElement>) => {
            e.stopPropagation();
            navigation.goUp();
        },
        [navigation],
    );

    const isFolderMovePending = useIsMutatingSidebarPlaylistFolderMove();

    if (playlistItems?.items?.length === 0) {
        return null;
    }

    return (
        <Accordion.Item value="shared-playlists">
            <Accordion.Control component="motion.div" role="button" style={{ userSelect: 'none' }}>
                <Group gap="xs" style={{ minWidth: 0 }} wrap="nowrap">
                    {inNavigation && (
                        <ActionIcon
                            icon="arrowLeftS"
                            iconProps={{ size: 'lg' }}
                            onClick={handleNavigateUp}
                            size="xs"
                            tooltip={{ label: t('common.back') }}
                            variant="subtle"
                        />
                    )}
                    <Text className={styles.name} fw={500} variant="secondary">
                        {inNavigation ? navigation.currentName : t('page.sidebar.shared')}
                    </Text>
                </Group>
            </Accordion.Control>
            <Accordion.Panel className={styles.panel}>
                <LoadingOverlay pos="absolute" visible={isFolderMovePending} />
                <PlaylistFolderDragExpandProvider expandedSet={expandedSet} setMany={setMany}>
                    <PlaylistFolderViews
                        {...folderViewState}
                        allPlaylists={playlistItems?.items ?? []}
                        expandedSet={expandedSet}
                        navigation={navigation}
                        onContextMenu={handlePlaylistContextMenu}
                        onReorder={handleReorder}
                        onToggleFolder={toggle}
                    />
                </PlaylistFolderDragExpandProvider>
            </Accordion.Panel>
        </Accordion.Item>
    );
};

export const CollapsedSidebarPlaylistList = () => {
    const { t } = useTranslation();
    const server = useCurrentServer();
    const [isOpen, setIsOpen] = useState(true);
    const isAddDragActive = useSidebarPlaylistAddDragMonitor();
    const owned = useSidebarPlaylistItems('owned');
    const shared = useSidebarPlaylistItems('shared');

    return (
        <SidebarPlaylistAddDragContext.Provider value={isAddDragActive}>
            <div className={styles.collapsedList}>
                <Divider mx="md" />
                <Link className={styles.collapsedHeader} to={AppRoute.PLAYLISTS}>
                    <Text
                        className={collapsedSidebarItemStyles.textWrapper}
                        fw="600"
                        isMuted
                        size="xs"
                    >
                        {t('page.sidebar.playlists')}
                    </Text>
                </Link>
                <Group gap="xs" justify="center" wrap="nowrap">
                    <ActionIcon
                        icon={isOpen ? 'arrowUpS' : 'arrowDownS'}
                        iconProps={{ size: 'lg' }}
                        onClick={() => setIsOpen((open) => !open)}
                        size="xs"
                        tooltip={{ label: t(isOpen ? 'common.collapse' : 'common.expand') }}
                        variant="subtle"
                    />
                    <ActionIcon
                        icon="add"
                        iconProps={{ size: 'lg' }}
                        onClick={(e) => openCreatePlaylistModal(server, e)}
                        size="xs"
                        tooltip={{ label: t('action.createPlaylist') }}
                        variant="subtle"
                    />
                </Group>
                {isOpen && (
                    <>
                        {owned.items?.map((item) => (
                            <PlaylistRowButton
                                iconOnly
                                item={item}
                                key={item.id}
                                name={item.name}
                                onContextMenu={handlePlaylistContextMenu}
                                onReorder={owned.handleReorder}
                                to={item.id}
                            />
                        ))}
                        {shared.items && shared.items.length > 0 && <Divider mx="md" />}
                        {shared.items?.map((item) => (
                            <PlaylistRowButton
                                iconOnly
                                item={item}
                                key={item.id}
                                name={item.name}
                                onContextMenu={handlePlaylistContextMenu}
                                onReorder={shared.handleReorder}
                                to={item.id}
                            />
                        ))}
                    </>
                )}
            </div>
        </SidebarPlaylistAddDragContext.Provider>
    );
};
