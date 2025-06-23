import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';

import { lazy, MutableRefObject, Suspense } from 'react';

import { VirtualInfiniteGridRef } from '/@/renderer/components/virtual-grid';
import { useListContext } from '/@/renderer/context/list-context';
import { useListStoreByKey } from '/@/renderer/store';
import { Spinner } from '/@/shared/components/spinner/spinner';
import { ListDisplayType } from '/@/shared/types/types';

const ArtistListGridView = lazy(() =>
    import('/@/renderer/features/artists/components/artist-list-grid-view').then((module) => ({
        default: module.ArtistListGridView,
    })),
);

const ArtistListTableView = lazy(() =>
    import('/@/renderer/features/artists/components/artist-list-table-view').then((module) => ({
        default: module.ArtistListTableView,
    })),
);

interface ArtistListContentProps {
    gridRef: MutableRefObject<null | VirtualInfiniteGridRef>;
    itemCount?: number;
    tableRef: MutableRefObject<AgGridReactType | null>;
}

export const ArtistListContent = ({ gridRef, itemCount, tableRef }: ArtistListContentProps) => {
    const { pageKey } = useListContext();
    const { display } = useListStoreByKey({ key: pageKey });
    const isGrid = display === ListDisplayType.CARD || display === ListDisplayType.GRID;

    return (
        <Suspense fallback={<Spinner container />}>
            {isGrid ? (
                <ArtistListGridView
                    gridRef={gridRef}
                    itemCount={itemCount}
                />
            ) : (
                <ArtistListTableView
                    itemCount={itemCount}
                    tableRef={tableRef}
                />
            )}
        </Suspense>
    );
};
