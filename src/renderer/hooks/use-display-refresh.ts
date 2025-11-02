import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';

import { ChangeEvent, MutableRefObject, useCallback } from 'react';

import { VirtualInfiniteGridRef } from '/@/renderer/components/virtual-grid/virtual-infinite-grid';
import { useListContext } from '/@/renderer/context/list-context';
import {
    UseHandleListFilterChangeProps,
    useListFilterRefresh,
} from '/@/renderer/hooks/use-list-filter-refresh';
import { useListStoreActions, useListStoreByKey } from '/@/renderer/store';
import { ListDisplayType } from '/@/shared/types/types';

export type UseDisplayRefreshProps = UseHandleListFilterChangeProps & {
    gridRef: MutableRefObject<null | VirtualInfiniteGridRef>;
    itemCount?: number;
    tableRef: MutableRefObject<AgGridReactType | null>;
};

export const useDisplayRefresh = <TFilter>({
    gridRef,
    isClientSideSort,
    itemCount,
    itemType,
    server,
    tableRef,
}: UseDisplayRefreshProps) => {
    const { customFilters, handlePlay, pageKey } = useListContext();
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
                customFilters,
                data: { searchTerm },
                itemType,
                key: pageKey,
            });
            return updatedFilters;
        },
        [customFilters, itemType, pageKey, setFilter],
    );

    return { customFilters, filter, handlePlay, refresh, search };
};
