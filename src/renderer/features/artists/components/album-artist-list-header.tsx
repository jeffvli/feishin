import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import type { ChangeEvent, MutableRefObject } from 'react';

import debounce from 'lodash/debounce';
import { useTranslation } from 'react-i18next';

import { PageHeader } from '/@/renderer/components/page-header/page-header';
import { VirtualInfiniteGridRef } from '/@/renderer/components/virtual-grid';
import { AlbumArtistListHeaderFilters } from '/@/renderer/features/artists/components/album-artist-list-header-filters';
import { FilterBar, LibraryHeaderBar } from '/@/renderer/features/shared';
import { SearchInput } from '/@/renderer/features/shared/components/search-input';
import { useContainerQuery } from '/@/renderer/hooks';
import { useDisplayRefresh } from '/@/renderer/hooks/use-display-refresh';
import { AlbumArtistListFilter, useCurrentServer } from '/@/renderer/store';
import { Flex } from '/@/shared/components/flex/flex';
import { Group } from '/@/shared/components/group/group';
import { Stack } from '/@/shared/components/stack/stack';
import { AlbumArtistListQuery, LibraryItem } from '/@/shared/types/domain-types';

interface AlbumArtistListHeaderProps {
    gridRef: MutableRefObject<null | VirtualInfiniteGridRef>;
    itemCount?: number;
    tableRef: MutableRefObject<AgGridReactType | null>;
}

export const AlbumArtistListHeader = ({
    gridRef,
    itemCount,
    tableRef,
}: AlbumArtistListHeaderProps) => {
    const { t } = useTranslation();
    const server = useCurrentServer();
    const cq = useContainerQuery();

    const { filter, refresh, search } = useDisplayRefresh<AlbumArtistListQuery>({
        gridRef,
        itemCount,
        itemType: LibraryItem.ALBUM_ARTIST,
        server,
        tableRef,
    });

    const handleSearch = debounce((e: ChangeEvent<HTMLInputElement>) => {
        const updatedFilters = search(e) as AlbumArtistListFilter;
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
                            {t('page.albumArtistList.title', { postProcess: 'titleCase' })}
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
                <AlbumArtistListHeaderFilters
                    gridRef={gridRef}
                    tableRef={tableRef}
                />
            </FilterBar>
        </Stack>
    );
};
