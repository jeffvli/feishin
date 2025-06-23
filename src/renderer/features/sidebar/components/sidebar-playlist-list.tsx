import { useDebouncedValue } from '@mantine/hooks';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { generatePath } from 'react-router';
import { Link } from 'react-router-dom';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeList, ListChildComponentProps } from 'react-window';

import styles from './sidebar-playlist-list.module.css';

import { openContextMenu } from '/@/renderer/features/context-menu';
import { PLAYLIST_CONTEXT_MENU_ITEMS } from '/@/renderer/features/context-menu/context-menu-items';
import { usePlayQueueAdd } from '/@/renderer/features/player';
import { usePlaylistList } from '/@/renderer/features/playlists';
import { useHideScrollbar } from '/@/renderer/hooks';
import { AppRoute } from '/@/renderer/router/routes';
import { useCurrentServer, useGeneralSettings, useSettingsStoreActions } from '/@/renderer/store';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Button } from '/@/shared/components/button/button';
import { Flex } from '/@/shared/components/flex/flex';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { Text } from '/@/shared/components/text/text';
import { LibraryItem, Playlist, PlaylistListSort, SortOrder } from '/@/shared/types/domain-types';
import { Play } from '/@/shared/types/types';

const PlaylistRow = ({ data, index, style }: ListChildComponentProps) => {
    const { t } = useTranslation();

    const [isHovered, setIsHovered] = useState(false);

    if (Array.isArray(data?.items[index])) {
        const [collapse, setCollapse] = data.items[index];

        return (
            <div style={{ margin: '0.5rem 0', padding: '0 1rem', ...style }}>
                <div style={{ fontSize: '1.2rem', fontWeight: '600' }}>
                    <Group>
                        <Text>{t('page.sidebar.shared', { postProcess: 'titleCase' })}</Text>
                        <Button
                            onClick={() => setCollapse()}
                            size="compact-md"
                            tooltip={{
                                label: t(collapse ? 'common.expand' : 'common.collapse', {
                                    postProcess: 'titleCase',
                                }),
                                openDelay: 500,
                            }}
                            variant="default"
                        >
                            {collapse ? <Icon icon="arrowUpS" /> : <Icon icon="arrowDownS" />}
                        </Button>
                    </Group>
                </div>
            </div>
        );
    }

    const path = data?.items[index].id
        ? generatePath(AppRoute.PLAYLISTS_DETAIL_SONGS, { playlistId: data.items[index].id })
        : undefined;

    return (
        <Button
            className={styles.row}
            component={Link}
            onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();

                if (!data?.items?.[index].id) return;

                openContextMenu({
                    data: [data?.items?.[index]],
                    dataNodes: undefined,
                    menuItems: PLAYLIST_CONTEXT_MENU_ITEMS,
                    type: LibraryItem.PLAYLIST,
                    xPos: e.clientX + 15,
                    yPos: e.clientY + 5,
                });
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{ ...style }}
            to={path || '/'}
            variant="subtle"
        >
            {data?.items[index].name}
            {isHovered && (
                <RowControls
                    data={data}
                    index={index}
                />
            )}
        </Button>
    );
};

const RowControls = ({ data, index }: { data: any; index: number }) => {
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
                    if (!data?.items?.[index].id) return;
                    data.handlePlay(data?.items[index].id, Play.NOW);
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
                    if (!data?.items?.[index].id) return;
                    data.handlePlay(data?.items[index].id, Play.SHUFFLE);
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
                    if (!data?.items?.[index].id) return;
                    data.handlePlay(data?.items[index].id, Play.LAST);
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
                    if (!data?.items?.[index].id) return;
                    data.handlePlay(data?.items[index].id, Play.NEXT);
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
    const { hideScrollbarElementProps, isScrollbarHidden } = useHideScrollbar(0);
    const handlePlayQueueAdd = usePlayQueueAdd();
    const { sidebarCollapseShared } = useGeneralSettings();
    const { toggleSidebarCollapseShare } = useSettingsStoreActions();
    const server = useCurrentServer();

    const playlistsQuery = usePlaylistList({
        query: {
            sortBy: PlaylistListSort.NAME,
            sortOrder: SortOrder.ASC,
            startIndex: 0,
        },
        serverId: server?.id,
    });

    const [rect, setRect] = useState({
        height: 0,
        width: 0,
    });

    const [debounced] = useDebouncedValue(rect, 25);

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
        const shared: Playlist[] = [];

        for (const playlist of data.items) {
            if (playlist.owner && playlist.owner !== server.username) {
                shared.push(playlist);
            } else {
                owned.push(playlist);
            }
        }

        if (shared.length > 0) {
            owned.push([sidebarCollapseShared, toggleSidebarCollapseShare]);
        }

        const final = sidebarCollapseShared ? owned : owned.concat(shared);

        return { ...base, items: final };
    }, [
        data?.items,
        handlePlayPlaylist,
        server?.type,
        server?.username,
        sidebarCollapseShared,
        toggleSidebarCollapseShare,
    ]);

    return (
        <Flex
            className={styles.list}
            h="100%"
            {...hideScrollbarElementProps}
        >
            <AutoSizer onResize={(e) => setRect(e as { height: number; width: number })}>
                {() => (
                    <FixedSizeList
                        className={
                            isScrollbarHidden
                                ? 'hide-scrollbar overlay-scrollbar'
                                : 'overlay-scrollbar'
                        }
                        height={debounced.height}
                        itemCount={memoizedItemData?.items?.length || 0}
                        itemData={memoizedItemData}
                        itemSize={32}
                        overscanCount={20}
                        width={debounced.width}
                    >
                        {PlaylistRow}
                    </FixedSizeList>
                )}
            </AutoSizer>
        </Flex>
    );
};
