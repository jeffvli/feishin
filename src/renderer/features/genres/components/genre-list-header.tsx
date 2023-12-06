import { ChangeEvent, MutableRefObject } from 'react';
import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { Flex, Group, Stack } from '@mantine/core';
import debounce from 'lodash/debounce';
import { LibraryItem } from '/@/renderer/api/types';
import { PageHeader, SearchInput } from '/@/renderer/components';
import { VirtualInfiniteGridRef } from '/@/renderer/components/virtual-grid';
import { useListContext } from '/@/renderer/context/list-context';
import { GenreListHeaderFilters } from '/@/renderer/features/genres/components/genre-list-header-filters';
import { FilterBar, LibraryHeaderBar } from '/@/renderer/features/shared';
import { useContainerQuery } from '/@/renderer/hooks';
import { useListFilterRefresh } from '/@/renderer/hooks/use-list-filter-refresh';
import {
    GenreListFilter,
    useCurrentServer,
    useListStoreActions,
    useListStoreByKey,
} from '/@/renderer/store';
import { ListDisplayType } from '/@/renderer/types';
import { useTranslation } from 'react-i18next';

interface GenreListHeaderProps {
    gridRef: MutableRefObject<VirtualInfiniteGridRef | null>;
    itemCount?: number;
    tableRef: MutableRefObject<AgGridReactType | null>;
}

export const GenreListHeader = ({ itemCount, gridRef, tableRef }: GenreListHeaderProps) => {
    const { t } = useTranslation();
    const cq = useContainerQuery();
    const server = useCurrentServer();
    const { pageKey } = useListContext();
    const { display, filter } = useListStoreByKey({ key: pageKey });
    const { setFilter, setTablePagination } = useListStoreActions();

    const { handleRefreshGrid, handleRefreshTable } = useListFilterRefresh({
        itemCount,
        itemType: LibraryItem.GENRE,
        server,
    });

    const handleSearch = debounce((e: ChangeEvent<HTMLInputElement>) => {
        const searchTerm = e.target.value === '' ? undefined : e.target.value;
        const updatedFilters = setFilter({
            data: { searchTerm },
            itemType: LibraryItem.GENRE,
            key: pageKey,
        }) as GenreListFilter;

        const filterWithCustom = {
            ...updatedFilters,
        };

        if (display === ListDisplayType.TABLE || display === ListDisplayType.TABLE_PAGINATED) {
            handleRefreshTable(tableRef, filterWithCustom);
            setTablePagination({ data: { currentPage: 0 }, key: pageKey });
        } else {
            handleRefreshGrid(gridRef, filterWithCustom);
        }
    }, 500);
    return (
        <Stack
            ref={cq.ref}
            spacing={0}
        >
            <PageHeader backgroundColor="var(--titlebar-bg)">
                <Flex
                    justify="space-between"
                    w="100%"
                >
                    <LibraryHeaderBar>
                        <LibraryHeaderBar.Title>
                            {t('page.genreList.title', { postProcess: 'titleCase' })}
                        </LibraryHeaderBar.Title>
                        <LibraryHeaderBar.Badge
                            isLoading={itemCount === null || itemCount === undefined}
                        >
                            {itemCount}
                        </LibraryHeaderBar.Badge>
                    </LibraryHeaderBar>
                    <Group>
                        <SearchInput
                            defaultValue={filter.searchTerm}
                            openedWidth={cq.isMd ? 250 : cq.isSm ? 200 : 150}
                            onChange={handleSearch}
                        />
                    </Group>
                </Flex>
            </PageHeader>
            <FilterBar>
                <GenreListHeaderFilters
                    gridRef={gridRef}
                    itemCount={itemCount}
                    tableRef={tableRef}
                />
            </FilterBar>
        </Stack>
    );
};
