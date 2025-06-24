import { closeAllModals, openModal } from '@mantine/modals';
import { MouseEvent, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { generatePath } from 'react-router';
import { Link } from 'react-router-dom';

import styles from './sidebar-playlist-list.module.css';

import { usePlayQueueAdd } from '/@/renderer/features/player';
import { CreatePlaylistForm, usePlaylistList } from '/@/renderer/features/playlists';
import { SidebarItem } from '/@/renderer/features/sidebar/components/sidebar-item';
import { AppRoute } from '/@/renderer/router/routes';
import { useCurrentServer } from '/@/renderer/store';
import { Accordion } from '/@/shared/components/accordion/accordion';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { ButtonProps } from '/@/shared/components/button/button';
import { Group } from '/@/shared/components/group/group';
import { Text } from '/@/shared/components/text/text';
import {
    LibraryItem,
    Playlist,
    PlaylistListSort,
    ServerType,
    SortOrder,
} from '/@/shared/types/domain-types';
import { Play } from '/@/shared/types/types';

interface PlaylistRowButtonProps extends Omit<ButtonProps, 'onPlay'> {
    name: string;
    onPlay: (id: string, playType: Play.LAST | Play.NEXT | Play.NOW | Play.SHUFFLE) => void;
    to: string;
}

const PlaylistRowButton = ({ name, onPlay, to, ...props }: PlaylistRowButtonProps) => {
    const url = generatePath(AppRoute.PLAYLISTS_DETAIL_SONGS, { playlistId: to });

    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            className={styles.row}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <SidebarItem
                to={url}
                variant="subtle"
                {...props}
            >
                {name}
            </SidebarItem>
            {isHovered && (
                <RowControls
                    id={to}
                    onPlay={onPlay}
                />
            )}
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
        <Group
            className={styles.controls}
            gap="xs"
            wrap="nowrap"
        >
            <ActionIcon
                icon="mediaPlay"
                iconProps={{
                    size: 'md',
                }}
                onClick={() => {
                    if (!id) return;
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
                    if (!id) return;
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
                    if (!id) return;
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
                    if (!id) return;
                    onPlay(id, Play.NEXT);
                }}
                size="xs"
                tooltip={{
                    label: t('player.addNext', { postProcess: 'sentenceCase' }),
                    openDelay: 500,
                }}
                variant="subtle"
            />
        </Group>
    );
};

export const SidebarPlaylistList = () => {
    const handlePlayQueueAdd = usePlayQueueAdd();
    const { t } = useTranslation();
    const server = useCurrentServer();

    const playlistsQuery = usePlaylistList({
        query: {
            sortBy: PlaylistListSort.NAME,
            sortOrder: SortOrder.ASC,
            startIndex: 0,
        },
        serverId: server?.id,
    });

    const handlePlayPlaylist = useCallback(
        (id: string, playType: Play) => {
            handlePlayQueueAdd?.({
                byItemType: {
                    id: [id],
                    type: LibraryItem.PLAYLIST,
                },
                playType,
            });
        },
        [handlePlayQueueAdd],
    );

    const data = playlistsQuery.data;

    const memoizedItemData = useMemo(() => {
        const base = { handlePlay: handlePlayPlaylist };

        if (!server?.type || !server?.username || !data?.items) {
            return { ...base, items: data?.items };
        }

        const owned: Array<[boolean, () => void] | Playlist> = [];

        for (const playlist of data.items) {
            owned.push(playlist);
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
            <Accordion.Control
                component="div"
                role="button"
                style={{ userSelect: 'none' }}
            >
                <Group
                    justify="space-between"
                    pr="var(--theme-spacing-md)"
                >
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
    const handlePlayQueueAdd = usePlayQueueAdd();
    const { t } = useTranslation();
    const server = useCurrentServer();

    const playlistsQuery = usePlaylistList({
        query: {
            sortBy: PlaylistListSort.NAME,
            sortOrder: SortOrder.ASC,
            startIndex: 0,
        },
        serverId: server?.id,
    });

    const handlePlayPlaylist = useCallback(
        (id: string, playType: Play) => {
            handlePlayQueueAdd?.({
                byItemType: {
                    id: [id],
                    type: LibraryItem.PLAYLIST,
                },
                playType,
            });
        },
        [handlePlayQueueAdd],
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
                console.log(playlist.owner, server.username);
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
                <Text
                    fw={600}
                    variant="secondary"
                >
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
