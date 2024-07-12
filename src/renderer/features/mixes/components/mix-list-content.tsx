import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { lazy, MutableRefObject, Suspense } from 'react';
import { Spinner } from '/@/renderer/components';
import { useListContext } from '/@/renderer/context/list-context';
import { useListStoreByKey } from '/@/renderer/store';
import { ListDisplayType } from '/@/renderer/types';
import { VirtualInfiniteGridRef } from '/@/renderer/components/virtual-grid';

const MixListTableView = lazy(() =>
    import('/@/renderer/features/mixes/components/mix-list-table-view').then((module) => ({
        default: module.MixListTableView,
    })),
);

const MixListGridView = lazy(() =>
    import('/@/renderer/features/mixes/components/mix-list-grid-view').then((module) => ({
        default: module.MixListGridView,
    })),
);

interface SongListContentProps {
    gridRef: MutableRefObject<VirtualInfiniteGridRef | null>;
    itemCount?: number;
    tableRef: MutableRefObject<AgGridReactType | null>;
}

export const MixListContent = ({ itemCount, gridRef, tableRef }: SongListContentProps) => {
    const { pageKey } = useListContext();
    const { display } = useListStoreByKey({ key: pageKey });

    const isGrid = display === ListDisplayType.CARD || display === ListDisplayType.POSTER;

    return (
        <Suspense fallback={<Spinner container />}>
            {isGrid ? (
                <MixListGridView
                    gridRef={gridRef}
                    itemCount={itemCount}
                />
            ) : (
                <MixListTableView
                    itemCount={itemCount}
                    tableRef={tableRef}
                />
            )}
        </Suspense>
    );
};
