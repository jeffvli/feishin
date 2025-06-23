import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';

import { lazy, MutableRefObject, Suspense } from 'react';

import { VirtualInfiniteGridRef } from '/@/renderer/components/virtual-grid';
import { useListContext } from '/@/renderer/context/list-context';
import { useListStoreByKey } from '/@/renderer/store';
import { Spinner } from '/@/shared/components/spinner/spinner';
import { ListDisplayType } from '/@/shared/types/types';

const SongListTableView = lazy(() =>
    import('/@/renderer/features/songs/components/song-list-table-view').then((module) => ({
        default: module.SongListTableView,
    })),
);

const SongListGridView = lazy(() =>
    import('/@/renderer/features/songs/components/song-list-grid-view').then((module) => ({
        default: module.SongListGridView,
    })),
);

interface SongListContentProps {
    gridRef: MutableRefObject<null | VirtualInfiniteGridRef>;
    itemCount?: number;
    tableRef: MutableRefObject<AgGridReactType | null>;
}

export const SongListContent = ({ gridRef, itemCount, tableRef }: SongListContentProps) => {
    const { pageKey } = useListContext();
    const { display } = useListStoreByKey({ key: pageKey });

    const isGrid = display === ListDisplayType.CARD || display === ListDisplayType.GRID;

    return (
        <Suspense fallback={<Spinner container />}>
            {isGrid ? (
                <SongListGridView
                    gridRef={gridRef}
                    itemCount={itemCount}
                />
            ) : (
                <SongListTableView
                    itemCount={itemCount}
                    tableRef={tableRef}
                />
            )}
        </Suspense>
    );
};
