import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';

import debounce from 'lodash/debounce';
import { ChangeEvent, MutableRefObject } from 'react';
import { useTranslation } from 'react-i18next';

import { PageHeader } from '/@/renderer/components/page-header/page-header';
import { VirtualInfiniteGridRef } from '/@/renderer/components/virtual-grid';
import { GenreListHeaderFilters } from '/@/renderer/features/genres/components/genre-list-header-filters';
import { FilterBar, LibraryHeaderBar } from '/@/renderer/features/shared';
import { SearchInput } from '/@/renderer/features/shared/components/search-input';
import { useContainerQuery } from '/@/renderer/hooks';
import { useDisplayRefresh } from '/@/renderer/hooks/use-display-refresh';
import { GenreListFilter, useCurrentServer } from '/@/renderer/store';
import { Flex } from '/@/shared/components/flex/flex';
import { Group } from '/@/shared/components/group/group';
import { Stack } from '/@/shared/components/stack/stack';
import { GenreListQuery, LibraryItem } from '/@/shared/types/domain-types';

interface GenreListHeaderProps {
    gridRef: MutableRefObject<null | VirtualInfiniteGridRef>;
    itemCount?: number;
    tableRef: MutableRefObject<AgGridReactType | null>;
}

export const GenreListHeader = ({ gridRef, itemCount, tableRef }: GenreListHeaderProps) => {
    const { t } = useTranslation();
    const cq = useContainerQuery();
    const server = useCurrentServer();
    const { filter, refresh, search } = useDisplayRefresh<GenreListQuery>({
        gridRef,
        itemType: LibraryItem.GENRE,
        server,
        tableRef,
    });

    const handleSearch = debounce((e: ChangeEvent<HTMLInputElement>) => {
        const updatedFilters = search(e) as GenreListFilter;
        refresh(updatedFilters);
    }, 500);

    return (
        <Stack
            gap={0}
            ref={cq.ref}
        >
            <PageHeader>
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
