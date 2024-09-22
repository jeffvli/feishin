import { useCallback, useMemo, useState } from 'react';
import { Box, Flex, Group } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { useTranslation } from 'react-i18next';
import {
    RiAddBoxFill,
    RiAddCircleFill,
    RiArrowDownSLine,
    RiArrowUpSLine,
    RiPlayFill,
} from 'react-icons/ri';
import { generatePath } from 'react-router';
import { Link } from 'react-router-dom';
import { LibraryItem, Playlist, PlaylistListSort, SortOrder } from '/@/renderer/api/types';
import { Button, Text } from '/@/renderer/components';
import { usePlayQueueAdd } from '/@/renderer/features/player';
import { usePlaylistList } from '/@/renderer/features/playlists';
import { AppRoute } from '/@/renderer/router/routes';
import { Play } from '/@/renderer/types';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeList, ListChildComponentProps } from 'react-window';
import { useHideScrollbar } from '/@/renderer/hooks';
import { useCurrentServer, useGeneralSettings, useSettingsStoreActions } from '/@/renderer/store';
import { openContextMenu } from '/@/renderer/features/context-menu';
import { PLAYLIST_CONTEXT_MENU_ITEMS } from '/@/renderer/features/context-menu/context-menu-items';

const PlaylistRow = ({ index, data, style }: ListChildComponentProps) => {
    const { t } = useTranslation();

    if (Array.isArray(data?.items[index])) {
        const [collapse, setCollapse] = data.items[index];

        return (
            <div style={{ margin: '0.5rem 0', padding: '0 1.5rem', ...style }}>
                <Box
                    fw="600"
                    sx={{ fontSize: '1.2rem' }}
                >
                    <Group>
                        <Text>{t('page.sidebar.shared', { postProcess: 'titleCase' })}</Text>
                        <Button
                            compact
                            tooltip={{
                                label: t(collapse ? 'common.expand' : 'common.collapse', {
                                    postProcess: 'titleCase',
                                }),
                                openDelay: 500,
                            }}
                            variant="default"
                            onClick={() => setCollapse()}
                        >
                            {collapse ? (
                                <RiArrowUpSLine size={20} />
                            ) : (
                                <RiArrowDownSLine size={20} />
                            )}
                        </Button>
                    </Group>
                </Box>
            </div>
        );
    }

    const path = data?.items[index].id
        ? generatePath(AppRoute.PLAYLISTS_DETAIL_SONGS, { playlistId: data.items[index].id })
        : undefined;

    return (
        <div
            style={{ margin: '0.5rem 0', padding: '0 1.5rem', ...style }}
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
        >
            <Group
                noWrap
                className="sidebar-playlist-item"
                pos="relative"
                position="apart"
                sx={{
                    '&:hover': {
                        '.sidebar-playlist-controls': {
                            display: 'flex',
                        },
                        '.sidebar-playlist-name': {
                            color: 'var(--sidebar-fg-hover) !important',
                        },
                    },
                }}
            >
                <Text
                    className="sidebar-playlist-name"
                    component={Link}
                    overflow="hidden"
                    size="md"
                    sx={{
                        color: 'var(--sidebar-fg) !important',
                        cursor: 'default',
                        width: '100%',
                    }}
                    to={path}
                >
                    {data?.items[index].name}
                </Text>
                <Group
                    noWrap
                    className="sidebar-playlist-controls"
                    display="none"
                    pos="absolute"
                    right="0"
                    spacing="sm"
                >
                    <Button
                        compact
                        size="md"
                        tooltip={{
                            label: t('player.play', { postProcess: 'sentenceCase' }),
                            openDelay: 500,
                        }}
                        variant="default"
                        onClick={() => {
                            if (!data?.items?.[index].id) return;
                            data.handlePlay(data?.items[index].id, Play.NOW);
                        }}
                    >
                        <RiPlayFill />
                    </Button>
                    <Button
                        compact
                        size="md"
                        tooltip={{
                            label: t('player.addLast', { postProcess: 'sentenceCase' }),
                            openDelay: 500,
                        }}
                        variant="default"
                        onClick={() => {
                            if (!data?.items?.[index].id) return;
                            data.handlePlay(data?.items[index].id, Play.LAST);
                        }}
                    >
                        <RiAddBoxFill />
                    </Button>
                    <Button
                        compact
                        size="md"
                        tooltip={{
                            label: t('player.addNext', { postProcess: 'sentenceCase' }),
                            openDelay: 500,
                        }}
                        variant="default"
                        onClick={() => {
                            if (!data?.items?.[index].id) return;
                            data.handlePlay(data?.items[index].id, Play.NEXT);
                        }}
                    >
                        <RiAddCircleFill />
                    </Button>
                </Group>
            </Group>
        </div>
    );
};

export const SidebarPlaylistList = () => {
    const { isScrollbarHidden, hideScrollbarElementProps } = useHideScrollbar(0);
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

        const owned: Array<Playlist | [boolean, () => void]> = [];
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
                        itemSize={25}
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
