import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { useItemListColumnReorder } from '/@/renderer/components/item-list/helpers/use-item-list-column-reorder';
import { useItemListColumnResize } from '/@/renderer/components/item-list/helpers/use-item-list-column-resize';
import { ItemTableList } from '/@/renderer/components/item-list/item-table-list/item-table-list';
import { ItemTableListColumn } from '/@/renderer/components/item-list/item-table-list/item-table-list-column';
import { ErrorFallback } from '/@/renderer/features/action-required/components/error-fallback';
import { songsQueries } from '/@/renderer/features/songs/api/songs-api';
import { useListSettings } from '/@/renderer/store';
import { Spinner } from '/@/shared/components/spinner/spinner';
import { LibraryItem, Song } from '/@/shared/types/domain-types';
import { ItemListKey } from '/@/shared/types/types';

export type SimilarSongsListProps = {
    count?: number;
    fullScreen?: boolean;
    song: Song;
};

export const SimilarSongsList = ({ count, song }: SimilarSongsListProps) => {
    const songQuery = useQuery(
        songsQueries.similar({
            options: {
                gcTime: 1000 * 60 * 2,
            },
            query: {
                count,
                songId: song.id,
            },
            serverId: song?._serverId,
        }),
    );

    const { table } = useListSettings(ItemListKey.FULL_SCREEN);
    const { table: fullScreenTable } = useListSettings(ItemListKey.FULL_SCREEN);

    const { handleColumnReordered } = useItemListColumnReorder({
        itemListKey: ItemListKey.FULL_SCREEN,
    });

    const { handleColumnResized } = useItemListColumnResize({
        itemListKey: ItemListKey.FULL_SCREEN,
    });

    const tableData = useMemo(() => {
        return songQuery.data || [];
    }, [songQuery.data]);

    if (songQuery.isLoading || songQuery.isRefetching) {
        return <Spinner container size={25} />;
    }

    return (
        <ErrorBoundary FallbackComponent={ErrorFallback}>
            <ItemTableList
                autoFitColumns={table?.autoFitColumns}
                CellComponent={ItemTableListColumn}
                columns={table?.columns || []}
                data={tableData}
                enableAlternateRowColors={fullScreenTable?.enableAlternateRowColors}
                enableExpansion={false}
                enableHeader
                enableHorizontalBorders={fullScreenTable?.enableHorizontalBorders}
                enableRowHoverHighlight={fullScreenTable?.enableRowHoverHighlight}
                enableSelection
                enableSelectionDialog={false}
                enableVerticalBorders={fullScreenTable?.enableVerticalBorders}
                itemType={LibraryItem.SONG}
                onColumnReordered={handleColumnReordered}
                onColumnResized={handleColumnResized}
                size={table?.size}
            />
        </ErrorBoundary>
    );
};
