import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { Flex, Group, Stack } from '@mantine/core';
import debounce from 'lodash/debounce';
import { ChangeEvent, MutableRefObject } from 'react';
import { useTranslation } from 'react-i18next';
import { useListStoreByKey } from '../../../store/list.store';
import { LibraryItem } from '/@/renderer/api/types';
import { PageHeader, SearchInput } from '/@/renderer/components';
import { useListContext } from '/@/renderer/context/list-context';
import { FilterBar, LibraryHeaderBar } from '/@/renderer/features/shared';
import { SongListHeaderFilters } from '/@/renderer/features/songs/components/song-list-header-filters';
import { useContainerQuery } from '/@/renderer/hooks';
import { useListFilterRefresh } from '/@/renderer/hooks/use-list-filter-refresh';
import { SongListFilter, useCurrentServer, useListStoreActions } from '/@/renderer/store';
import { usePlayButtonBehavior } from '/@/renderer/store/settings.store';
import { ListDisplayType } from '/@/renderer/types';
import { VirtualInfiniteGridRef } from '/@/renderer/components/virtual-grid';

interface SongListHeaderProps {
    gridRef: MutableRefObject<VirtualInfiniteGridRef | null>;
    itemCount?: number;
    tableRef: MutableRefObject<AgGridReactType | null>;
    title?: string;
}

export const SongListHeader = ({ gridRef, title, itemCount, tableRef }: SongListHeaderProps) => {
    const { t } = useTranslation();
    const server = useCurrentServer();
    const { pageKey, handlePlay, customFilters } = useListContext();
    const { setFilter, setTablePagination } = useListStoreActions();
    const { display, filter } = useListStoreByKey({ key: pageKey });
    const cq = useContainerQuery();

    const { handleRefreshTable, handleRefreshGrid } = useListFilterRefresh({
        itemType: LibraryItem.SONG,
        server,
    });

    const handleSearch = debounce((e: ChangeEvent<HTMLInputElement>) => {
        const searchTerm = e.target.value === '' ? undefined : e.target.value;
        const updatedFilters = setFilter({
            data: { searchTerm },
            itemType: LibraryItem.SONG,
            key: pageKey,
        }) as SongListFilter;

        const filterWithCustom = {
            ...updatedFilters,
            ...customFilters,
        };

        if (display === ListDisplayType.TABLE || display === ListDisplayType.TABLE_PAGINATED) {
            handleRefreshTable(tableRef, filterWithCustom);
            setTablePagination({ data: { currentPage: 0 }, key: pageKey });
        } else {
            handleRefreshGrid(gridRef, filterWithCustom);
        }
    }, 500);

    const playButtonBehavior = usePlayButtonBehavior();

    return (
        <Stack
            ref={cq.ref}
            gap={0}
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
                            {title || t('page.trackList.title', { postProcess: 'titleCase' })}
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
                <SongListHeaderFilters
                    gridRef={gridRef}
                    tableRef={tableRef}
                />
            </FilterBar>
        </Stack>
    );
};
