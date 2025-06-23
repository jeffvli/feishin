import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';

import { lazy, MutableRefObject, Suspense } from 'react';

import { VirtualInfiniteGridRef } from '/@/renderer/components/virtual-grid';
import { useListContext } from '/@/renderer/context/list-context';
import { useListStoreByKey } from '/@/renderer/store/list.store';
import { Spinner } from '/@/shared/components/spinner/spinner';
import { ListDisplayType } from '/@/shared/types/types';

const PlaylistListTableView = lazy(() =>
    import('/@/renderer/features/playlists/components/playlist-list-table-view').then((module) => ({
        default: module.PlaylistListTableView,
    })),
);

const PlaylistListGridView = lazy(() =>
    import('/@/renderer/features/playlists/components/playlist-list-grid-view').then((module) => ({
        default: module.PlaylistListGridView,
    })),
);

interface PlaylistListContentProps {
    gridRef: MutableRefObject<null | VirtualInfiniteGridRef>;
    itemCount?: number;
    tableRef: MutableRefObject<AgGridReactType | null>;
}

export const PlaylistListContent = ({ gridRef, itemCount, tableRef }: PlaylistListContentProps) => {
    const { pageKey } = useListContext();
    const { display } = useListStoreByKey({ key: pageKey });

    return (
        <Suspense fallback={<Spinner container />}>
            {display === ListDisplayType.CARD || display === ListDisplayType.GRID ? (
                <PlaylistListGridView
                    gridRef={gridRef}
                    itemCount={itemCount}
                />
            ) : (
                <PlaylistListTableView
                    itemCount={itemCount}
                    tableRef={tableRef}
                />
            )}
            <div />
        </Suspense>
    );
};
