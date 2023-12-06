import type { ChangeEvent, MutableRefObject } from 'react';
import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { Flex, Group, Stack } from '@mantine/core';
import debounce from 'lodash/debounce';
import { useTranslation } from 'react-i18next';
import { useListFilterRefresh } from '../../../hooks/use-list-filter-refresh';
import { LibraryItem } from '/@/renderer/api/types';
import { PageHeader, SearchInput } from '/@/renderer/components';
import { VirtualInfiniteGridRef } from '/@/renderer/components/virtual-grid';
import { useListContext } from '/@/renderer/context/list-context';
import { AlbumListHeaderFilters } from '/@/renderer/features/albums/components/album-list-header-filters';
import { FilterBar, LibraryHeaderBar } from '/@/renderer/features/shared';
import { useContainerQuery } from '/@/renderer/hooks';
import {
    AlbumListFilter,
    useCurrentServer,
    useListStoreActions,
    useListStoreByKey,
    usePlayButtonBehavior,
} from '/@/renderer/store';
import { ListDisplayType } from '/@/renderer/types';
import { titleCase } from '/@/renderer/utils';

interface AlbumListHeaderProps {
    gridRef: MutableRefObject<VirtualInfiniteGridRef | null>;
    itemCount?: number;
    tableRef: MutableRefObject<AgGridReactType | null>;
    title?: string;
}

export const AlbumListHeader = ({ itemCount, gridRef, tableRef, title }: AlbumListHeaderProps) => {
    const { t } = useTranslation();
    const server = useCurrentServer();
    const { setFilter, setTablePagination } = useListStoreActions();
    const cq = useContainerQuery();
    const { pageKey, handlePlay } = useListContext();
    const { display, filter } = useListStoreByKey({ key: pageKey });
    const playButtonBehavior = usePlayButtonBehavior();

    const { handleRefreshGrid, handleRefreshTable } = useListFilterRefresh({
        itemCount,
        itemType: LibraryItem.ALBUM,
        server,
    });

    const handleSearch = debounce((e: ChangeEvent<HTMLInputElement>) => {
        const searchTerm = e.target.value === '' ? undefined : e.target.value;
        const updatedFilters = setFilter({
            data: { searchTerm },
            itemType: LibraryItem.ALBUM,
            key: pageKey,
        }) as AlbumListFilter;

        if (display === ListDisplayType.TABLE || display === ListDisplayType.TABLE_PAGINATED) {
            handleRefreshTable(tableRef, updatedFilters);
            setTablePagination({ data: { currentPage: 0 }, key: pageKey });
        } else {
            handleRefreshGrid(gridRef, updatedFilters);
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
                        <LibraryHeaderBar.PlayButton
                            onClick={() => handlePlay?.({ playType: playButtonBehavior })}
                        />
                        <LibraryHeaderBar.Title>
                            {title ||
                                titleCase(t('page.albumList.title', { postProcess: 'titleCase' }))}
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
                <AlbumListHeaderFilters
                    gridRef={gridRef}
                    itemCount={itemCount}
                    tableRef={tableRef}
                />
            </FilterBar>
        </Stack>
    );
};
