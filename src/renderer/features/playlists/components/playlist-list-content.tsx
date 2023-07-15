import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { lazy, MutableRefObject, Suspense } from 'react';
import { Spinner } from '/@/renderer/components';
import { VirtualInfiniteGridRef } from '/@/renderer/components/virtual-grid';
import { usePlaylistListStore } from '/@/renderer/store';
import { ListDisplayType } from '/@/renderer/types';

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
    const { display } = usePlaylistListStore();

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
