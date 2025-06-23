import { useDebouncedValue } from '@mantine/hooks';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RiAddBoxFill, RiAddCircleFill, RiPlayFill, RiShuffleFill } from 'react-icons/ri';
import { generatePath } from 'react-router';
import { Link } from 'react-router-dom';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeList, ListChildComponentProps } from 'react-window';

import { openContextMenu } from '/@/renderer/features/context-menu';
import { PLAYLIST_CONTEXT_MENU_ITEMS } from '/@/renderer/features/context-menu/context-menu-items';
import { usePlayQueueAdd } from '/@/renderer/features/player';
import { usePlaylistList } from '/@/renderer/features/playlists';
import { useHideScrollbar } from '/@/renderer/hooks';
import { AppRoute } from '/@/renderer/router/routes';
import { useCurrentServer, useGeneralSettings, useSettingsStoreActions } from '/@/renderer/store';
import { Button } from '/@/shared/components/button/button';
import { Flex } from '/@/shared/components/flex/flex';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { Text } from '/@/shared/components/text/text';
import { LibraryItem, Playlist, PlaylistListSort, SortOrder } from '/@/shared/types/domain-types';
import { Play } from '/@/shared/types/types';

const PlaylistRow = ({ data, index, style }: ListChildComponentProps) => {
    const { t } = useTranslation();

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
        <div
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
            style={{ margin: '0.5rem 0', padding: '0 1rem', ...style }}
        >
            <Group
                className="sidebar-playlist-item"
                justify="space-between"
                pos="relative"
                style={{
                    '&:hover': {
                        '.sidebar-playlist-controls': {
                            display: 'flex',
                        },
                        '.sidebar-playlist-name': {
                            color: 'var(--theme-colors-foreground) !important',
                        },
                    },
                }}
                wrap="nowrap"
            >
                <Text
                    // className="sidebar-playlist-name"
                    component={Link}
                    overflow="hidden"
                    size="md"
                    style={{
                        color: 'white',
                        cursor: 'default',
                        width: '100%',
                    }}
                    to={path}
                >
                    {data?.items[index].name}
                </Text>
                <Group
                    className="sidebar-playlist-controls"
                    display="none"
                    gap="sm"
                    pos="absolute"
                    right="0"
                    wrap="nowrap"
                >
                    <Button
                        onClick={() => {
                            if (!data?.items?.[index].id) return;
                            data.handlePlay(data?.items[index].id, Play.NOW);
                        }}
                        size="compact-md"
                        tooltip={{
                            label: t('player.play', { postProcess: 'sentenceCase' }),
                            openDelay: 500,
                        }}
                        variant="default"
                    >
                        <RiPlayFill />
                    </Button>
                    <Button
                        onClick={() => {
                            if (!data?.items?.[index].id) return;
                            data.handlePlay(data?.items[index].id, Play.SHUFFLE);
                        }}
                        size="md"
                        tooltip={{
                            label: t('player.shuffle', { postProcess: 'sentenceCase' }),
                            openDelay: 500,
                        }}
                        variant="default"
                    >
                        <RiShuffleFill />
                    </Button>
                    <Button
                        onClick={() => {
                            if (!data?.items?.[index].id) return;
                            data.handlePlay(data?.items[index].id, Play.LAST);
                        }}
                        size="compact-md"
                        tooltip={{
                            label: t('player.addLast', { postProcess: 'sentenceCase' }),
                            openDelay: 500,
                        }}
                        variant="default"
                    >
                        <RiAddBoxFill />
                    </Button>
                    <Button
                        onClick={() => {
                            if (!data?.items?.[index].id) return;
                            data.handlePlay(data?.items[index].id, Play.NEXT);
                        }}
                        size="compact-md"
                        tooltip={{
                            label: t('player.addNext', { postProcess: 'sentenceCase' }),
                            openDelay: 500,
                        }}
                        variant="default"
                    >
                        <RiAddCircleFill />
                    </Button>
                </Group>
            </Group>
        </div>
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
