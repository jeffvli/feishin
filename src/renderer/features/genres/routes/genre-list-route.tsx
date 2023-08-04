import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { useMemo, useRef } from 'react';
import { GenreListSort, SortOrder } from '/@/renderer/api/types';
import { VirtualInfiniteGridRef } from '/@/renderer/components/virtual-grid';
import { ListContext } from '/@/renderer/context/list-context';
import { GenreListContent } from '/@/renderer/features/genres/components/genre-list-content';
import { GenreListHeader } from '/@/renderer/features/genres/components/genre-list-header';
import { useGenreList } from '/@/renderer/features/genres/queries/genre-list-query';
import { AnimatedPage } from '/@/renderer/features/shared';
import { useCurrentServer } from '/@/renderer/store';

const GenreListRoute = () => {
    const gridRef = useRef<VirtualInfiniteGridRef | null>(null);
    const tableRef = useRef<AgGridReactType | null>(null);
    const server = useCurrentServer();
    const pageKey = 'genre';

    const itemCountCheck = useGenreList({
        query: {
            limit: 1,
            sortBy: GenreListSort.NAME,
            sortOrder: SortOrder.ASC,
            startIndex: 0,
        },
        serverId: server?.id,
    });

    const itemCount =
        itemCountCheck.data?.totalRecordCount === null
            ? undefined
            : itemCountCheck.data?.totalRecordCount;

    const providerValue = useMemo(() => {
        return {
            pageKey,
        };
    }, []);

    return (
        <AnimatedPage>
            <ListContext.Provider value={providerValue}>
                <GenreListHeader
                    gridRef={gridRef}
                    itemCount={itemCount}
                    tableRef={tableRef}
                />
                <GenreListContent
                    gridRef={gridRef}
                    itemCount={itemCount}
                    tableRef={tableRef}
                />
            </ListContext.Provider>
        </AnimatedPage>
    );
};

export default GenreListRoute;
