import { ChangeEvent, MutableRefObject, useCallback } from 'react';
import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import {
    UseHandleListFilterChangeProps,
    useListFilterRefresh,
} from '/@/renderer/hooks/use-list-filter-refresh';
import { useListContext } from '/@/renderer/context/list-context';
import { ListDisplayType } from '/@/renderer/types';
import { VirtualInfiniteGridRef } from '/@/renderer/components/virtual-grid';
import { useListStoreActions, useListStoreByKey } from '/@/renderer/store';

export type UseDisplayRefreshProps = {
    gridRef: MutableRefObject<VirtualInfiniteGridRef | null>;
    itemCount?: number;
    tableRef: MutableRefObject<AgGridReactType | null>;
} & UseHandleListFilterChangeProps;

export const useDisplayRefresh = <TFilter>({
    isClientSideSort,
    itemCount,
    gridRef,
    itemType,
    server,
    tableRef,
}: UseDisplayRefreshProps) => {
    const { customFilters, pageKey, handlePlay } = useListContext();
    const { display, filter } = useListStoreByKey<TFilter>({ key: pageKey });

    const { handleRefreshGrid, handleRefreshTable } = useListFilterRefresh({
        isClientSideSort,
        itemCount,
        itemType,
        server,
    });
    const { setFilter, setTablePagination } = useListStoreActions();

    const refresh = useCallback(
        (filter: unknown) => {
            if (display === ListDisplayType.TABLE || display === ListDisplayType.TABLE_PAGINATED) {
                handleRefreshTable(tableRef, filter);
                setTablePagination({ data: { currentPage: 0 }, key: pageKey });
            } else {
                handleRefreshGrid(gridRef, filter);
            }
        },
        [
            display,
            gridRef,
            handleRefreshGrid,
            handleRefreshTable,
            pageKey,
            setTablePagination,
            tableRef,
        ],
    );

    const search = useCallback(
        (e: ChangeEvent<HTMLInputElement>) => {
            const searchTerm = e.target.value === '' ? undefined : e.target.value;
            const updatedFilters = setFilter({
                data: { searchTerm },
                itemType,
                key: pageKey,
            });
            return updatedFilters;
        },
        [itemType, pageKey, setFilter],
    );

    return { customFilters, filter, handlePlay, refresh, search };
};
