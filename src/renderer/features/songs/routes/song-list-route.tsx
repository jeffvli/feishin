import { useCallback, useMemo } from 'react';
import {
  VirtualGridContainer,
  VirtualGridAutoSizerContainer,
  VirtualTable,
  getColumnDefs,
} from '/@/renderer/components';
import type { ColDef, GridReadyEvent, IDatasource } from '@ag-grid-community/core';
import { AnimatedPage } from '/@/renderer/features/shared';
import { useTableSettings } from '/@/renderer/store/settings.store';
import { SongListHeader } from '/@/renderer/features/songs/components/song-list-header';
import { useSongList } from '/@/renderer/features/songs/queries/song-list-query';
import { SongListSort, SortOrder } from '/@/renderer/api/types';
import { queryKeys } from '/@/renderer/api/query-keys';
import { useCurrentServer, useSongRouteStore } from '/@/renderer/store';
import { controller } from '/@/renderer/api/controller';
import { api } from '/@/renderer/api';
import { useQueryClient } from '@tanstack/react-query';

const TrackListRoute = () => {
  const queryClient = useQueryClient();
  const server = useCurrentServer();
  const page = useSongRouteStore();
  const filters = page.list.filter;
  const tableConfig = useTableSettings('songs');

  const checkSongList = useSongList({
    limit: 1,
    sortBy: SongListSort.NAME,
    sortOrder: SortOrder.ASC,
    startIndex: 0,
  });

  const columnDefs = useMemo(() => getColumnDefs(tableConfig.columns), [tableConfig.columns]);
  const defaultColumnDefs: ColDef = useMemo(() => {
    return {
      lockPinned: true,
      lockVisible: true,
      resizable: true,
    };
  }, []);

  const onGridReady = useCallback(
    (params: GridReadyEvent) => {
      const dataSource: IDatasource = {
        getRows: async (params) => {
          const limit = params.endRow - params.startRow;
          const startIndex = params.startRow;

          const queryKey = queryKeys.songs.list(server?.id || '', {
            limit,
            startIndex,
            ...filters,
          });

          const songsRes = await queryClient.fetchQuery(queryKey, async ({ signal }) =>
            controller.getSongList({
              query: {
                limit,
                sortBy: filters.sortBy,
                sortOrder: filters.sortOrder,
                startIndex,
              },
              server,
              signal,
            }),
          );

          const songs = api.normalize.songList(songsRes, server);

          params.successCallback(songs?.items || [], -1);
        },
        rowCount: undefined,
      };
      params.api.setDatasource(dataSource);
    },
    [filters, queryClient, server],
  );

  return (
    <AnimatedPage>
      <VirtualGridContainer>
        <SongListHeader />
        <VirtualGridAutoSizerContainer>
          {!checkSongList.isLoading && (
            <VirtualTable
              alwaysShowHorizontalScroll
              animateRows
              maintainColumnOrder
              suppressCopyRowsToClipboard
              suppressMoveWhenRowDragging
              suppressRowDrag
              suppressScrollOnNewData
              blockLoadDebounceMillis={200}
              cacheBlockSize={500}
              cacheOverflowSize={1}
              columnDefs={columnDefs}
              defaultColDef={defaultColumnDefs}
              enableCellChangeFlash={false}
              getRowId={(data) => data.data.uniqueId}
              infiniteInitialRowCount={checkSongList.data?.totalRecordCount}
              rowBuffer={20}
              rowHeight={tableConfig.rowHeight || 40}
              rowModelType="infinite"
              rowSelection="multiple"
              onCellContextMenu={(e) => console.log('context', e)}
              onGridReady={onGridReady}
            />
          )}
        </VirtualGridAutoSizerContainer>
      </VirtualGridContainer>
    </AnimatedPage>
  );
};

export default TrackListRoute;
