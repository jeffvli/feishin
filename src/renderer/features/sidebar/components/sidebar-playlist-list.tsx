import { useCallback, useMemo, useState } from 'react';
import { Flex, Group } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { RiAddBoxFill, RiAddCircleFill, RiPlayFill } from 'react-icons/ri';
import { generatePath } from 'react-router';
import { Link } from 'react-router-dom';
import { LibraryItem } from '/@/renderer/api/types';
import { Button, Text } from '/@/renderer/components';
import { usePlayQueueAdd } from '/@/renderer/features/player';
import { usePlaylistList } from '/@/renderer/features/playlists';
import { AppRoute } from '/@/renderer/router/routes';
import { Play } from '/@/renderer/types';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeList, ListChildComponentProps } from 'react-window';
import { useHideScrollbar } from '/@/renderer/hooks';
import { useGeneralSettings } from '/@/renderer/store';

interface SidebarPlaylistListProps {
    data: ReturnType<typeof usePlaylistList>['data'];
}

const PlaylistRow = ({ index, data, style }: ListChildComponentProps) => {
    const path = data?.items[index].id
        ? data.defaultFullPlaylist
            ? generatePath(AppRoute.PLAYLISTS_DETAIL_SONGS, { playlistId: data.items[index].id })
            : generatePath(AppRoute.PLAYLISTS_DETAIL, {
                  playlistId: data?.items[index].id,
              })
        : undefined;

    return (
        <div style={{ margin: '0.5rem 0', padding: '0 1.5rem', ...style }}>
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
                        tooltip={{ label: 'Play', openDelay: 500 }}
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
                        tooltip={{ label: 'Add to queue', openDelay: 500 }}
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
                        tooltip={{ label: 'Add to queue next', openDelay: 500 }}
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

export const SidebarPlaylistList = ({ data }: SidebarPlaylistListProps) => {
    const { isScrollbarHidden, hideScrollbarElementProps } = useHideScrollbar(0);
    const handlePlayQueueAdd = usePlayQueueAdd();
    const { defaultFullPlaylist } = useGeneralSettings();

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

    const memoizedItemData = useMemo(() => {
        return {
            defaultFullPlaylist,
            handlePlay: handlePlayPlaylist,
            items: data?.items,
        };
    }, [data?.items, defaultFullPlaylist, handlePlayPlaylist]);

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
                        itemCount={data?.items?.length || 0}
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
