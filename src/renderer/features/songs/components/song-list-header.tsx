import type { IDatasource } from '@ag-grid-community/core';
import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { Flex, Group, Stack } from '@mantine/core';
import debounce from 'lodash/debounce';
import { ChangeEvent, MutableRefObject, useCallback } from 'react';
import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { LibraryItem, SongListQuery } from '/@/renderer/api/types';
import { PageHeader, Paper, SearchInput, SpinnerIcon } from '/@/renderer/components';
import { usePlayQueueAdd } from '/@/renderer/features/player';
import { LibraryHeaderBar } from '/@/renderer/features/shared';
import { SongListHeaderFilters } from '/@/renderer/features/songs/components/song-list-header-filters';
import { useContainerQuery } from '/@/renderer/hooks';
import { queryClient } from '/@/renderer/lib/react-query';
import {
  SongListFilter,
  useCurrentServer,
  useSetSongFilters,
  useSetSongTablePagination,
  useSongListStore,
} from '/@/renderer/store';
import { usePlayButtonBehavior } from '/@/renderer/store/settings.store';
import { Play } from '/@/renderer/types';

interface SongListHeaderProps {
  customFilters?: Partial<SongListFilter>;
  itemCount?: number;
  tableRef: MutableRefObject<AgGridReactType | null>;
  title?: string;
}

export const SongListHeader = ({
  customFilters,
  title,
  itemCount,
  tableRef,
}: SongListHeaderProps) => {
  const server = useCurrentServer();
  const page = useSongListStore();
  const setFilter = useSetSongFilters();
  const setPagination = useSetSongTablePagination();
  const handlePlayQueueAdd = usePlayQueueAdd();
  const cq = useContainerQuery();

  const handleFilterChange = useCallback(
    async (filters?: SongListFilter) => {
      const dataSource: IDatasource = {
        getRows: async (params) => {
          const limit = params.endRow - params.startRow;
          const startIndex = params.startRow;

          const pageFilters = filters || page.filter;

          const query: SongListQuery = {
            limit,
            startIndex,
            ...pageFilters,
            ...customFilters,
          };

          const queryKey = queryKeys.songs.list(server?.id || '', query);

          const songsRes = await queryClient.fetchQuery(
            queryKey,
            async ({ signal }) =>
              api.controller.getSongList({
                query,
                server,
                signal,
              }),
            { cacheTime: 1000 * 60 * 1 },
          );

          const songs = api.normalize.songList(songsRes, server);
          params.successCallback(songs?.items || [], songsRes?.totalRecordCount);
        },
        rowCount: undefined,
      };
      tableRef.current?.api.setDatasource(dataSource);
      tableRef.current?.api.purgeInfiniteCache();
      tableRef.current?.api.ensureIndexVisible(0, 'top');
      setPagination({ currentPage: 0 });
    },
    [customFilters, page.filter, server, setPagination, tableRef],
  );

  const handleSearch = debounce((e: ChangeEvent<HTMLInputElement>) => {
    const previousSearchTerm = page.filter.searchTerm;
    const searchTerm = e.target.value === '' ? undefined : e.target.value;
    const updatedFilters = setFilter({ searchTerm });
    if (previousSearchTerm !== searchTerm) handleFilterChange(updatedFilters);
  }, 500);

  const playButtonBehavior = usePlayButtonBehavior();

  const handlePlay = async (play: Play) => {
    if (!itemCount || itemCount === 0) return;
    const query: SongListQuery = { startIndex: 0, ...page.filter };

    handlePlayQueueAdd?.({
      byItemType: {
        id: query,
        type: LibraryItem.SONG,
      },
      play,
    });
  };

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
            <Group>
              <LibraryHeaderBar.PlayButton onClick={() => handlePlay(playButtonBehavior)} />
              <LibraryHeaderBar.Title>{title || 'Tracks'}</LibraryHeaderBar.Title>
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
        <SongListHeaderFilters
          customFilters={customFilters}
          itemCount={itemCount}
          tableRef={tableRef}
        />
      </Paper>
    </Stack>
  );
};
