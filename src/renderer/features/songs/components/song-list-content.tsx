import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { lazy, MutableRefObject, Suspense } from 'react';
import { Spinner } from '/@/renderer/components';
import { useListContext } from '/@/renderer/context/list-context';
import { useListStoreByKey } from '/@/renderer/store';
import { ListDisplayType } from '/@/renderer/types';

const SongListTableView = lazy(() =>
    import('/@/renderer/features/songs/components/song-list-table-view').then((module) => ({
        default: module.SongListTableView,
    })),
);

interface SongListContentProps {
    itemCount?: number;
    tableRef: MutableRefObject<AgGridReactType | null>;
}

export const SongListContent = ({ itemCount, tableRef }: SongListContentProps) => {
    const { pageKey } = useListContext();
    const { display } = useListStoreByKey({ key: pageKey });

    const isGrid = display === ListDisplayType.CARD || display === ListDisplayType.POSTER;

    return (
        <Suspense fallback={<Spinner container />}>
            {isGrid ? (
                <></>
            ) : (
                <SongListTableView
                    itemCount={itemCount}
                    tableRef={tableRef}
                />
            )}
        </Suspense>
    );
};
