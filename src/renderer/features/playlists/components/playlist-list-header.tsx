import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';

import debounce from 'lodash/debounce';
import { ChangeEvent, MutableRefObject } from 'react';
import { useTranslation } from 'react-i18next';

import { PageHeader } from '/@/renderer/components/page-header/page-header';
import { VirtualInfiniteGridRef } from '/@/renderer/components/virtual-grid';
import { PlaylistListHeaderFilters } from '/@/renderer/features/playlists/components/playlist-list-header-filters';
import { FilterBar, LibraryHeaderBar } from '/@/renderer/features/shared';
import { SearchInput } from '/@/renderer/features/shared/components/search-input';
import { useContainerQuery } from '/@/renderer/hooks';
import { useDisplayRefresh } from '/@/renderer/hooks/use-display-refresh';
import { PlaylistListFilter, useCurrentServer } from '/@/renderer/store';
import { Badge } from '/@/shared/components/badge/badge';
import { Flex } from '/@/shared/components/flex/flex';
import { Group } from '/@/shared/components/group/group';
import { SpinnerIcon } from '/@/shared/components/spinner/spinner';
import { Stack } from '/@/shared/components/stack/stack';
import { LibraryItem, PlaylistListQuery } from '/@/shared/types/domain-types';

interface PlaylistListHeaderProps {
    gridRef: MutableRefObject<null | VirtualInfiniteGridRef>;
    itemCount?: number;
    tableRef: MutableRefObject<AgGridReactType | null>;
}

export const PlaylistListHeader = ({ gridRef, itemCount, tableRef }: PlaylistListHeaderProps) => {
    const { t } = useTranslation();
    const cq = useContainerQuery();
    const server = useCurrentServer();

    const { filter, refresh, search } = useDisplayRefresh<PlaylistListQuery>({
        gridRef,
        itemCount,
        itemType: LibraryItem.PLAYLIST,
        server,
        tableRef,
    });

    const handleSearch = debounce((e: ChangeEvent<HTMLInputElement>) => {
        const updatedFilters = search(e) as PlaylistListFilter;
        refresh(updatedFilters);
    }, 500);

    return (
        <Stack
            gap={0}
            ref={cq.ref}
        >
            <PageHeader>
                <Flex
                    align="center"
                    justify="space-between"
                    w="100%"
                >
                    <LibraryHeaderBar>
                        <LibraryHeaderBar.Title>
                            {t('page.playlistList.title', { postProcess: 'titleCase' })}
                        </LibraryHeaderBar.Title>
                        <Badge>
                            {itemCount === null || itemCount === undefined ? (
                                <SpinnerIcon />
                            ) : (
                                itemCount
                            )}
                        </Badge>
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
                <PlaylistListHeaderFilters
                    gridRef={gridRef}
                    tableRef={tableRef}
                />
            </FilterBar>
        </Stack>
    );
};
