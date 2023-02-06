import type { ChangeEvent, MutableRefObject } from 'react';
import { useCallback } from 'react';
import { IDatasource } from '@ag-grid-community/core';
import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { Flex, Group, Stack } from '@mantine/core';
import { useQueryClient } from '@tanstack/react-query';
import debounce from 'lodash/debounce';
import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import {
  PageHeader,
  Paper,
  SearchInput,
  SpinnerIcon,
  VirtualInfiniteGridRef,
} from '/@/renderer/components';
import { LibraryHeaderBar } from '/@/renderer/features/shared';
import { useContainerQuery } from '/@/renderer/hooks';
import {
  AlbumArtistListFilter,
  useAlbumArtistListStore,
  useCurrentServer,
  useSetAlbumArtistFilters,
  useSetAlbumArtistTablePagination,
} from '/@/renderer/store';
import { ListDisplayType } from '/@/renderer/types';
import { AlbumArtistListHeaderFilters } from '/@/renderer/features/artists/components/album-artist-list-header-filters';

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
  const setFilter = useSetAlbumArtistFilters();
  const page = useAlbumArtistListStore();
  const cq = useContainerQuery();

  const setPagination = useSetAlbumArtistTablePagination();

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
      if (
        page.display === ListDisplayType.TABLE ||
        page.display === ListDisplayType.TABLE_PAGINATED
      ) {
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
              albumArtistsRes?.totalRecordCount || undefined,
            );
          },
          rowCount: undefined,
        };
        tableRef.current?.api.setDatasource(dataSource);
        tableRef.current?.api.purgeInfiniteCache();
        tableRef.current?.api.ensureIndexVisible(0, 'top');

        if (page.display === ListDisplayType.TABLE_PAGINATED) {
          setPagination({ currentPage: 0 });
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
    [page.display, tableRef, setPagination, server, queryClient, gridRef, fetch],
  );

  const handleSearch = debounce((e: ChangeEvent<HTMLInputElement>) => {
    const previousSearchTerm = page.filter.searchTerm;
    const searchTerm = e.target.value === '' ? undefined : e.target.value;
    const updatedFilters = setFilter({ searchTerm });
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
          py="1rem"
        >
          <LibraryHeaderBar>
            <Group noWrap>
              <LibraryHeaderBar.Title>Album Artists</LibraryHeaderBar.Title>
            </Group>
            <Paper
              fw="600"
              px="1rem"
              py="0.3rem"
              radius="sm"
            >
              {itemCount === null || itemCount === undefined ? <SpinnerIcon /> : itemCount}
            </Paper>
          </LibraryHeaderBar>
          <Group>
            <SearchInput
              defaultValue={page.filter.searchTerm}
              openedWidth={cq.isMd ? 250 : cq.isSm ? 200 : 150}
              onChange={handleSearch}
            />
          </Group>
        </Flex>
      </PageHeader>
      <Paper p="1rem">
        <AlbumArtistListHeaderFilters
          gridRef={gridRef}
          tableRef={tableRef}
        />
      </Paper>
    </Stack>
  );
};
