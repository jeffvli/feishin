import type { ChangeEvent, MutableRefObject } from 'react';
import { useCallback } from 'react';
import { IDatasource } from '@ag-grid-community/core';
import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { Flex, Group, Stack } from '@mantine/core';
import { useQueryClient } from '@tanstack/react-query';
import debounce from 'lodash/debounce';
import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { PageHeader, SearchInput, VirtualInfiniteGridRef } from '/@/renderer/components';
import { LibraryHeaderBar } from '/@/renderer/features/shared';
import { useContainerQuery } from '/@/renderer/hooks';
import {
  AlbumArtistListFilter,
  useAlbumArtistListStore,
  useCurrentServer,
  useListStoreActions,
} from '/@/renderer/store';
import { ListDisplayType } from '/@/renderer/types';
import { AlbumArtistListHeaderFilters } from '/@/renderer/features/artists/components/album-artist-list-header-filters';
import { useAlbumArtistListContext } from '/@/renderer/features/artists/context/album-artist-list-context';
import { FilterBar } from '../../shared/components/filter-bar';

interface AlbumArtistListHeaderProps {
  gridRef: MutableRefObject<VirtualInfiniteGridRef | null>;
  itemCount?: number;
  tableRef: MutableRefObject<AgGridReactType | null>;
}

export const AlbumArtistListHeader = ({
  itemCount,
  gridRef,
  tableRef,
}: AlbumArtistListHeaderProps) => {
  const queryClient = useQueryClient();
  const server = useCurrentServer();
  const { pageKey } = useAlbumArtistListContext();
  const { display, filter } = useAlbumArtistListStore();
  const { setFilter, setTablePagination } = useListStoreActions();
  const cq = useContainerQuery();

  const fetch = useCallback(
    async (startIndex: number, limit: number, filters: AlbumArtistListFilter) => {
      const queryKey = queryKeys.albumArtists.list(server?.id || '', {
        limit,
        startIndex,
        ...filters,
      });

      const albums = await queryClient.fetchQuery(
        queryKey,
        async ({ signal }) =>
          api.controller.getAlbumArtistList({
            query: {
              limit,
              startIndex,
              ...filters,
            },
            server,
            signal,
          }),
        { cacheTime: 1000 * 60 * 1 },
      );

      return api.normalize.albumArtistList(albums, server);
    },
    [queryClient, server],
  );

  const handleFilterChange = useCallback(
    async (filters: AlbumArtistListFilter) => {
      if (display === ListDisplayType.TABLE || display === ListDisplayType.TABLE_PAGINATED) {
        const dataSource: IDatasource = {
          getRows: async (params) => {
            const limit = params.endRow - params.startRow;
            const startIndex = params.startRow;

            const queryKey = queryKeys.albumArtists.list(server?.id || '', {
              limit,
              startIndex,
              ...filters,
            });

            const albumArtistsRes = await queryClient.fetchQuery(
              queryKey,
              async ({ signal }) =>
                api.controller.getAlbumArtistList({
                  query: {
                    limit,
                    startIndex,
                    ...filters,
                  },
                  server,
                  signal,
                }),
              { cacheTime: 1000 * 60 * 1 },
            );

            const albumArtists = api.normalize.albumArtistList(albumArtistsRes, server);
            params.successCallback(
              albumArtists?.items || [],
              albumArtistsRes?.totalRecordCount || 0,
            );
          },
          rowCount: undefined,
        };
        tableRef.current?.api.setDatasource(dataSource);
        tableRef.current?.api.purgeInfiniteCache();
        tableRef.current?.api.ensureIndexVisible(0, 'top');

        if (display === ListDisplayType.TABLE_PAGINATED) {
          setTablePagination({ data: { currentPage: 0 }, key: pageKey });
        }
      } else {
        gridRef.current?.scrollTo(0);
        gridRef.current?.resetLoadMoreItemsCache();

        // Refetching within the virtualized grid may be inconsistent due to it refetching
        // using an outdated set of filters. To avoid this, we fetch using the updated filters
        // and then set the grid's data here.
        const data = await fetch(0, 200, filters);

        if (!data?.items) return;
        gridRef.current?.setItemData(data.items);
      }
    },
    [display, tableRef, server, queryClient, setTablePagination, pageKey, gridRef, fetch],
  );

  const handleSearch = debounce((e: ChangeEvent<HTMLInputElement>) => {
    const previousSearchTerm = filter.searchTerm;
    const searchTerm = e.target.value === '' ? undefined : e.target.value;
    const updatedFilters = setFilter({
      data: { searchTerm },
      key: pageKey,
    }) as AlbumArtistListFilter;
    if (previousSearchTerm !== searchTerm) handleFilterChange(updatedFilters);
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
            <LibraryHeaderBar.Title>Album Artists</LibraryHeaderBar.Title>
            <LibraryHeaderBar.Badge isLoading={itemCount === null || itemCount === undefined}>
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
        <AlbumArtistListHeaderFilters
          gridRef={gridRef}
          tableRef={tableRef}
        />
      </FilterBar>
    </Stack>
  );
};
