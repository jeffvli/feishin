import { closeAllModals, openContextModal, openModal } from '@mantine/modals';
import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { MouseEvent, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { generatePath, Link } from 'react-router';

import styles from './sidebar-playlist-list.module.css';

import { usePlayer } from '/@/renderer/features/player/context/player-context';
import { playlistsQueries } from '/@/renderer/features/playlists/api/playlists-api';
import { CreatePlaylistForm } from '/@/renderer/features/playlists/components/create-playlist-form';
import { SidebarItem } from '/@/renderer/features/sidebar/components/sidebar-item';
import { useDragDrop } from '/@/renderer/hooks/use-drag-drop';
import { AppRoute } from '/@/renderer/router/routes';
import { useCurrentServer } from '/@/renderer/store';
import { Accordion } from '/@/shared/components/accordion/accordion';
import { ActionIcon, ActionIconGroup } from '/@/shared/components/action-icon/action-icon';
import { ButtonProps } from '/@/shared/components/button/button';
import { Group } from '/@/shared/components/group/group';
import { Text } from '/@/shared/components/text/text';
import {
    LibraryItem,
    Playlist,
    PlaylistListSort,
    ServerType,
    Song,
    SortOrder,
} from '/@/shared/types/domain-types';
import { DragOperation, DragTarget } from '/@/shared/types/drag-and-drop';
import { Play } from '/@/shared/types/types';

interface PlaylistRowButtonProps extends Omit<ButtonProps, 'onPlay'> {
    name: string;
    onPlay: (id: string, playType: Play) => void;
    to: string;
}

const PlaylistRowButton = ({ name, onPlay, to, ...props }: PlaylistRowButtonProps) => {
    const url = generatePath(AppRoute.PLAYLISTS_DETAIL_SONGS, { playlistId: to });
    const { t } = useTranslation();

    const [isHovered, setIsHovered] = useState(false);

    const { isDraggedOver, ref } = useDragDrop<HTMLDivElement>({
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
                    title: t('form.addToPlaylist.title', { postProcess: 'titleCase' }),
                });
            },
        },
        isEnabled: true,
    });

    return (
        <div
            className={clsx(styles.row, {
                [styles.rowDraggedOver]: isDraggedOver,
            })}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            ref={ref}
        >
            <SidebarItem
                className={clsx({
                    [styles.rowHover]: isHovered,
                })}
                to={url}
                variant="subtle"
                {...props}
            >
                {name}
            </SidebarItem>
            {isHovered && <RowControls id={to} onPlay={onPlay} />}
        </div>
    );
};

const RowControls = ({
    id,
    onPlay,
}: {
    id: string;
    onPlay: (id: string, playType: Play) => void;
}) => {
    const { t } = useTranslation();

    return (
        <ActionIconGroup className={styles.controls}>
            <ActionIcon
                icon="mediaPlay"
                iconProps={{
                    size: 'md',
                }}
                onClick={() => {
                    onPlay(id, Play.NOW);
                }}
                size="xs"
                tooltip={{
                    label: t('player.play', { postProcess: 'sentenceCase' }),
                    openDelay: 500,
                }}
                variant="subtle"
            />
            <ActionIcon
                icon="mediaShuffle"
                iconProps={{
                    size: 'md',
                }}
                onClick={() => {
                    onPlay(id, Play.SHUFFLE);
                }}
                size="xs"
                tooltip={{
                    label: t('player.shuffle', { postProcess: 'sentenceCase' }),
                    openDelay: 500,
                }}
                variant="subtle"
            />
            <ActionIcon
                icon="mediaPlayLast"
                iconProps={{
                    size: 'md',
                }}
                onClick={() => {
                    onPlay(id, Play.LAST);
                }}
                size="xs"
                tooltip={{
                    label: t('player.addLast', { postProcess: 'sentenceCase' }),
                    openDelay: 500,
                }}
                variant="subtle"
            />
            <ActionIcon
                icon="mediaPlayNext"
                iconProps={{
                    size: 'md',
                }}
                onClick={() => {
                    onPlay(id, Play.NEXT);
                }}
                size="xs"
                tooltip={{
                    label: t('player.addNext', { postProcess: 'sentenceCase' }),
                    openDelay: 500,
                }}
                variant="subtle"
            />
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

    const data = playlistsQuery.data;

    const memoizedItemData = useMemo(() => {
        const base = { handlePlay: handlePlayPlaylist };

        if (!server?.type || !server?.username || !data?.items) {
            return { ...base, items: data?.items };
        }

        const owned: Array<[boolean, () => void] | Playlist> = [];

        for (const playlist of data.items) {
            if (!playlist.owner || playlist.owner === server.username) {
                owned.push(playlist);
            }
        }

        return { ...base, items: owned };
    }, [data?.items, handlePlayPlaylist, server?.type, server?.username]);

    const handleCreatePlaylistModal = (e: MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();

        openModal({
            children: <CreatePlaylistForm onCancel={() => closeAllModals()} />,
            size: server?.type === ServerType?.NAVIDROME ? 'lg' : 'sm',
            title: t('form.createPlaylist.title', { postProcess: 'titleCase' }),
        });
    };

    return (
        <Accordion.Item value="playlists">
            <Accordion.Control component="div" role="button" style={{ userSelect: 'none' }}>
                <Group justify="space-between" pr="var(--theme-spacing-md)">
                    <Text fw={600}>
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
                                openDelay: 500,
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
                                openDelay: 500,
                            }}
                            variant="subtle"
                        />
                    </Group>
                </Group>
            </Accordion.Control>
            <Accordion.Panel>
                {memoizedItemData?.items?.map((item, index) => (
                    <PlaylistRowButton
                        key={index}
                        name={item.name}
                        onPlay={handlePlayPlaylist}
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
        [player, server?.id],
    );

    const data = playlistsQuery.data;

    const memoizedItemData = useMemo(() => {
        const base = { handlePlay: handlePlayPlaylist };

        if (!server?.type || !server?.username || !data?.items) {
            return { ...base, items: data?.items };
        }

        const shared: Playlist[] = [];

        for (const playlist of data.items) {
            if (playlist.owner && playlist.owner !== server.username) {
                shared.push(playlist);
            }
        }

        return { ...base, items: shared };
    }, [data?.items, handlePlayPlaylist, server?.type, server?.username]);

    if (memoizedItemData?.items?.length === 0) {
        return null;
    }

    return (
        <Accordion.Item value="shared-playlists">
            <Accordion.Control>
                <Text fw={600} variant="secondary">
                    {t('page.sidebar.shared', {
                        postProcess: 'titleCase',
                    })}
                </Text>
            </Accordion.Control>
            <Accordion.Panel>
                {memoizedItemData?.items?.map((item, index) => (
                    <PlaylistRowButton
                        key={index}
                        name={item.name}
                        onPlay={handlePlayPlaylist}
                        to={item.id}
                    />
                ))}
            </Accordion.Panel>
        </Accordion.Item>
    );
};
