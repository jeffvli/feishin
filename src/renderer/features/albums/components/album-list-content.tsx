import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';

import { lazy, MutableRefObject, Suspense } from 'react';

import { VirtualInfiniteGridRef } from '/@/renderer/components/virtual-grid';
import { useListContext } from '/@/renderer/context/list-context';
import { useListStoreByKey } from '/@/renderer/store';
import { Spinner } from '/@/shared/components/spinner/spinner';
import { ListDisplayType } from '/@/shared/types/types';

const AlbumListGridView = lazy(() =>
    import('/@/renderer/features/albums/components/album-list-grid-view').then((module) => ({
        default: module.AlbumListGridView,
    })),
);

const AlbumListTableView = lazy(() =>
    import('/@/renderer/features/albums/components/album-list-table-view').then((module) => ({
        default: module.AlbumListTableView,
    })),
);

interface AlbumListContentProps {
    gridRef: MutableRefObject<null | VirtualInfiniteGridRef>;
    itemCount?: number;
    tableRef: MutableRefObject<AgGridReactType | null>;
}

export const AlbumListContent = ({ gridRef, itemCount, tableRef }: AlbumListContentProps) => {
    const { pageKey } = useListContext();
    const { display } = useListStoreByKey({ key: pageKey });

    return (
        <Suspense fallback={<Spinner container />}>
            {display === ListDisplayType.CARD || display === ListDisplayType.GRID ? (
                <AlbumListGridView
                    gridRef={gridRef}
                    itemCount={itemCount}
                />
            ) : (
                <AlbumListTableView
                    itemCount={itemCount}
                    tableRef={tableRef}
                />
            )}
        </Suspense>
    );
};
