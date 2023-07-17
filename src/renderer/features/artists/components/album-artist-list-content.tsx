import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { lazy, MutableRefObject, Suspense } from 'react';
import { Spinner } from '/@/renderer/components';
import { VirtualInfiniteGridRef } from '/@/renderer/components/virtual-grid';
import { useAlbumArtistListStore } from '/@/renderer/store';
import { ListDisplayType } from '/@/renderer/types';

const AlbumArtistListGridView = lazy(() =>
    import('/@/renderer/features/artists/components/album-artist-list-grid-view').then(
        (module) => ({
            default: module.AlbumArtistListGridView,
        }),
    ),
);

const AlbumArtistListTableView = lazy(() =>
    import('/@/renderer/features/artists/components/album-artist-list-table-view').then(
        (module) => ({
            default: module.AlbumArtistListTableView,
        }),
    ),
);

interface AlbumArtistListContentProps {
    gridRef: MutableRefObject<VirtualInfiniteGridRef | null>;
    itemCount?: number;
    tableRef: MutableRefObject<AgGridReactType | null>;
}

export const AlbumArtistListContent = ({
    itemCount,
    gridRef,
    tableRef,
}: AlbumArtistListContentProps) => {
    const { display } = useAlbumArtistListStore();
    const isGrid = display === ListDisplayType.CARD || display === ListDisplayType.POSTER;

    return (
        <Suspense fallback={<Spinner container />}>
            {isGrid ? (
                <AlbumArtistListGridView
                    gridRef={gridRef}
                    itemCount={itemCount}
                />
            ) : (
                <AlbumArtistListTableView
                    itemCount={itemCount}
                    tableRef={tableRef}
                />
            )}
        </Suspense>
    );
};
