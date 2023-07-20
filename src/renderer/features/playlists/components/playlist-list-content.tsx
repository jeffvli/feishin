import { lazy, MutableRefObject, Suspense } from 'react';
import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { Spinner } from '/@/renderer/components';
import { VirtualInfiniteGridRef } from '/@/renderer/components/virtual-grid';
import { ListDisplayType } from '/@/renderer/types';
import { useListContext } from '../../../context/list-context';
import { useListStoreByKey } from '../../../store/list.store';

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
    gridRef: MutableRefObject<VirtualInfiniteGridRef | null>;
    itemCount?: number;
    tableRef: MutableRefObject<AgGridReactType | null>;
}

export const PlaylistListContent = ({ gridRef, tableRef, itemCount }: PlaylistListContentProps) => {
    const { pageKey } = useListContext();
    const { display } = useListStoreByKey({ key: pageKey });

    return (
        <Suspense fallback={<Spinner container />}>
            {display === ListDisplayType.CARD || display === ListDisplayType.POSTER ? (
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
