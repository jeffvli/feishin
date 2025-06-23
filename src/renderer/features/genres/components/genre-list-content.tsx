import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';

import { lazy, MutableRefObject, Suspense } from 'react';

import { VirtualInfiniteGridRef } from '/@/renderer/components/virtual-grid';
import { useListContext } from '/@/renderer/context/list-context';
import { useListStoreByKey } from '/@/renderer/store';
import { Spinner } from '/@/shared/components/spinner/spinner';
import { ListDisplayType } from '/@/shared/types/types';

const GenreListGridView = lazy(() =>
    import('/@/renderer/features/genres/components/genre-list-grid-view').then((module) => ({
        default: module.GenreListGridView,
    })),
);

const GenreListTableView = lazy(() =>
    import('/@/renderer/features/genres/components/genre-list-table-view').then((module) => ({
        default: module.GenreListTableView,
    })),
);

interface AlbumListContentProps {
    gridRef: MutableRefObject<null | VirtualInfiniteGridRef>;
    itemCount?: number;
    tableRef: MutableRefObject<AgGridReactType | null>;
}

export const GenreListContent = ({ gridRef, itemCount, tableRef }: AlbumListContentProps) => {
    const { pageKey } = useListContext();
    const { display } = useListStoreByKey({ key: pageKey });

    return (
        <Suspense fallback={<Spinner container />}>
            {display === ListDisplayType.CARD || display === ListDisplayType.GRID ? (
                <GenreListGridView
                    gridRef={gridRef}
                    itemCount={itemCount}
                />
            ) : (
                <GenreListTableView
                    itemCount={itemCount}
                    tableRef={tableRef}
                />
            )}
        </Suspense>
    );
};
