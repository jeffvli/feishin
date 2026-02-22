import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useParams } from 'react-router';

import { useItemListColumnReorder } from '/@/renderer/components/item-list/helpers/use-item-list-column-reorder';
import { useItemListColumnResize } from '/@/renderer/components/item-list/helpers/use-item-list-column-resize';
import { ItemTableList } from '/@/renderer/components/item-list/item-table-list/item-table-list';
import { ItemTableListColumn } from '/@/renderer/components/item-list/item-table-list/item-table-list-column';
import { ItemControls } from '/@/renderer/components/item-list/types';
import { ListContext } from '/@/renderer/context/list-context';
import { artistsQueries } from '/@/renderer/features/artists/api/artists-api';
import { AlbumArtistDetailFavoriteSongsListHeader } from '/@/renderer/features/artists/components/album-artist-detail-favorite-songs-list-header';
import { usePlayer } from '/@/renderer/features/player/context/player-context';
import { AnimatedPage } from '/@/renderer/features/shared/components/animated-page';
import { PageErrorBoundary } from '/@/renderer/features/shared/components/page-error-boundary';
import { usePlayerSong } from '/@/renderer/store';
import { useCurrentServer } from '/@/renderer/store/auth.store';
import { useSettingsStore } from '/@/renderer/store/settings.store';
import { LibraryItem, Song } from '/@/shared/types/domain-types';
import { ItemListKey, Play } from '/@/shared/types/types';

const AlbumArtistDetailFavoriteSongsListRoute = () => {
    const { albumArtistId, artistId } = useParams() as {
        albumArtistId?: string;
        artistId?: string;
    };
    const routeId = (artistId || albumArtistId) as string;
    const server = useCurrentServer();
    const pageKey = LibraryItem.SONG;

    const detailQuery = useQuery(
        artistsQueries.albumArtistDetail({
            query: { id: routeId },
            serverId: server?.id,
        }),
    );

    const favoriteSongsQuery = useQuery(
        artistsQueries.favoriteSongs({
            options: { enabled: !!detailQuery?.data?.name },
            query: { artistId: routeId },
            serverId: server?.id,
        }),
    );

    const itemCount = favoriteSongsQuery?.data?.items?.length || 0;
    const songs = useMemo(
        () => favoriteSongsQuery?.data?.items || [],
        [favoriteSongsQuery?.data?.items],
    );

    const tableConfig = useSettingsStore((state) => state.lists[ItemListKey.SONG]?.table);
    const currentSong = usePlayerSong();
    const player = usePlayer();

    const columns = useMemo(() => {
        return tableConfig?.columns || [];
    }, [tableConfig?.columns]);

    const { handleColumnReordered } = useItemListColumnReorder({
        itemListKey: ItemListKey.SONG,
    });

    const { handleColumnResized } = useItemListColumnResize({
        itemListKey: ItemListKey.SONG,
    });

    const overrideControls: Partial<ItemControls> = useMemo(() => {
        return {
            onDoubleClick: ({ index, internalState, item, meta }) => {
                if (!item) {
                    return;
                }

                const playType = (meta?.playType as Play) || Play.NOW;
                const items = internalState?.getData() as Song[];

                if (index !== undefined) {
                    player.addToQueueByData(items, playType, item.id);
                }
            },
        };
    }, [player]);

    const providerValue = useMemo(() => {
        return {
            id: routeId,
            pageKey,
        };
    }, [routeId, pageKey]);

    const currentSongId = currentSong?.id;

    if (!tableConfig || columns.length === 0) {
        return (
            <AnimatedPage>
                <ListContext.Provider value={providerValue}>
                    <AlbumArtistDetailFavoriteSongsListHeader
                        data={songs}
                        itemCount={itemCount}
                        title={detailQuery?.data?.name || 'Unknown'}
                    />
                </ListContext.Provider>
            </AnimatedPage>
        );
    }

    return (
        <AnimatedPage>
            <ListContext.Provider value={providerValue}>
                <AlbumArtistDetailFavoriteSongsListHeader
                    data={songs}
                    itemCount={itemCount}
                    title={detailQuery?.data?.name || 'Unknown'}
                />
                <ItemTableList
                    activeRowId={currentSongId}
                    autoFitColumns={tableConfig.autoFitColumns}
                    CellComponent={ItemTableListColumn}
                    columns={columns}
                    data={songs}
                    enableAlternateRowColors={tableConfig.enableAlternateRowColors}
                    enableDrag
                    enableExpansion={false}
                    enableHeader={tableConfig.enableHeader}
                    enableHorizontalBorders={tableConfig.enableHorizontalBorders}
                    enableRowHoverHighlight={tableConfig.enableRowHoverHighlight}
                    enableSelection
                    enableSelectionDialog={false}
                    enableVerticalBorders={tableConfig.enableVerticalBorders}
                    itemType={LibraryItem.SONG}
                    onColumnReordered={handleColumnReordered}
                    onColumnResized={handleColumnResized}
                    overrideControls={overrideControls}
                    size={tableConfig.size}
                />
            </ListContext.Provider>
        </AnimatedPage>
    );
};

const AlbumArtistDetailTopSongsListRouteWithBoundary = () => {
    return (
        <PageErrorBoundary>
            <AlbumArtistDetailFavoriteSongsListRoute />
        </PageErrorBoundary>
    );
};

export default AlbumArtistDetailTopSongsListRouteWithBoundary;
