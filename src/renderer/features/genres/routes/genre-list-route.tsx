import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';

import { useQuery } from '@tanstack/react-query';
import { useMemo, useRef } from 'react';

import { ListContext } from '/@/renderer/context/list-context';
import { genresQueries } from '/@/renderer/features/genres/api/genres-api';
import { GenreListHeader } from '/@/renderer/features/genres/components/genre-list-header';
import { AnimatedPage } from '/@/renderer/features/shared/components/animated-page';
import { useCurrentServer } from '/@/renderer/store';
import { useListStoreByKey } from '/@/renderer/store/list.store';
import { GenreListQuery } from '/@/shared/types/domain-types';

const GenreListRoute = () => {
    const gridRef = useRef<null>(null);
    const tableRef = useRef<AgGridReactType | null>(null);
    const server = useCurrentServer();
    const pageKey = 'genre';
    const { filter } = useListStoreByKey<GenreListQuery>({ key: pageKey });

    const itemCountCheck = useQuery(
        genresQueries.list({
            query: {
                ...filter,
                limit: 1,
                startIndex: 0,
            },
            serverId: server?.id,
        }),
    );

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
                <GenreListHeader gridRef={gridRef} itemCount={itemCount} tableRef={tableRef} />
                {/* <GenreListContent gridRef={gridRef} itemCount={itemCount} tableRef={tableRef} /> */}
            </ListContext.Provider>
        </AnimatedPage>
    );
};

export default GenreListRoute;
