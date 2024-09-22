import { useMemo, useRef } from 'react';
import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { VirtualInfiniteGridRef } from '/@/renderer/components/virtual-grid';
import { ListContext } from '/@/renderer/context/list-context';
import { GenreListContent } from '/@/renderer/features/genres/components/genre-list-content';
import { GenreListHeader } from '/@/renderer/features/genres/components/genre-list-header';
import { useGenreList } from '/@/renderer/features/genres/queries/genre-list-query';
import { AnimatedPage } from '/@/renderer/features/shared';
import { useCurrentServer } from '/@/renderer/store';
import { useListStoreByKey } from '../../../store/list.store';
import { GenreListQuery } from '/@/renderer/api/types';

const GenreListRoute = () => {
    const gridRef = useRef<VirtualInfiniteGridRef | null>(null);
    const tableRef = useRef<AgGridReactType | null>(null);
    const server = useCurrentServer();
    const pageKey = 'genre';
    const { filter } = useListStoreByKey<GenreListQuery>({ key: pageKey });

    const itemCountCheck = useGenreList({
        query: {
            ...filter,
            limit: 1,
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
