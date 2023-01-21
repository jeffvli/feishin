import { useMemo, useRef } from 'react';
import { ColDef } from '@ag-grid-community/core';
import { Box, Group, Stack } from '@mantine/core';
import { useVirtualizer, Virtualizer } from '@tanstack/react-virtual';
import { useParams } from 'react-router';
import { AlbumListSort, SortOrder, SongListSort, Song } from '/@/renderer/api/types';
import {
  getColumnDefs,
  VirtualTable,
  Text,
  TextTitle,
  NativeScrollArea,
} from '/@/renderer/components';
import { useAlbumList } from '/@/renderer/features/albums';
import { PlayButton } from '/@/renderer/features/shared';
import { useSongList } from '/@/renderer/features/songs';
import { useSongListStore } from '/@/renderer/store';
import { usePlayQueueAdd } from '/@/renderer/features/player';
import { Play } from '/@/renderer/types';

const RowVirtualizer = ({
  rows,
  columnDefs,
  handlePlay,
  rowVirtualizer,
}: {
  columnDefs: ColDef[];
  handlePlay: (play: Play, data: any[]) => void;
  rowVirtualizer: Virtualizer<any, Element>;
  rows: any[];
}) => {
  const items = rowVirtualizer.getVirtualItems();

  return (
    <div
      style={{
        height: `${rowVirtualizer.getTotalSize()}px`,
        position: 'relative',
        width: '100%',
      }}
    >
      {items.map((virtualRow) => (
        <div
          key={rows?.[virtualRow.index].id}
          style={{
            height: `${(rows?.[virtualRow.index].songs?.length || 0) * 60 + 300}px`,
            left: 0,
            position: 'absolute',
            top: 0,
            transform: `translateY(${virtualRow.start}px)`,
            width: '100%',
          }}
        >
          <Stack
            p="2rem"
            spacing="lg"
          >
            <Group noWrap>
              <img
                alt={`${rows?.[virtualRow.index]?.name}-cover`}
                height={150}
                src={rows?.[virtualRow.index]?.imageUrl}
                width={150}
              />
              <Stack>
                <TextTitle
                  fw="bold"
                  order={1}
                >
                  {rows?.[virtualRow.index]?.name}
                </TextTitle>
                <Text $secondary>{rows?.[virtualRow.index]?.releaseYear}</Text>
                <PlayButton
                  h="35px"
                  w="35px"
                  onClick={() => handlePlay?.(Play.NOW, rows?.[virtualRow.index]?.songs)}
                />
              </Stack>
            </Group>
            <Box sx={{ height: `${(rows?.[virtualRow.index].songs?.length || 0) * 60 + 60}px` }}>
              <VirtualTable
                autoFitColumns
                suppressCellFocus
                suppressHorizontalScroll
                suppressLoadingOverlay
                suppressRowDrag
                transparentHeader
                columnDefs={columnDefs}
                getRowId={(data) => data.data.id}
                rowData={rows?.[virtualRow.index]?.songs}
                rowHeight={60}
                rowModelType="clientSide"
                rowSelection="multiple"
              />
            </Box>
          </Stack>
        </div>
      ))}
    </div>
  );
};

export const AlbumArtistDiscographyDetailList = () => {
  const { albumArtistId } = useParams() as { albumArtistId: string };
  // const albumArtistQuery = useAlbumArtistDetail({ id: albumArtistId });

  const albumsQuery = useAlbumList({
    jfParams: { artistIds: albumArtistId },
    ndParams: { artist_id: albumArtistId },
    sortBy: AlbumListSort.YEAR,
    sortOrder: SortOrder.DESC,
    startIndex: 0,
  });

  const songsQuery = useSongList(
    {
      albumIds: albumsQuery.data?.items?.map((album) => album.id),
      sortBy: SongListSort.ALBUM,
      sortOrder: SortOrder.ASC,
      startIndex: 0,
    },
    {
      enabled: !albumsQuery.isLoading,
    },
  );

  const songsByAlbum = useMemo(() => {
    if (songsQuery.isLoading || albumsQuery.isLoading) return null;

    const songsByAlbumMap = songsQuery?.data?.items?.reduce((acc, song) => {
      if (!acc[song.albumId as keyof typeof acc]) {
        acc[song.albumId as keyof typeof acc] = [];
      }

      acc[song.albumId as keyof typeof acc].push(song);

      return acc;
    }, {} as Record<string, Song[]>);

    const albumDetailWithSongs = albumsQuery?.data?.items?.map((album) => {
      return {
        ...album,
        songs: songsByAlbumMap?.[album.id],
      };
    });

    return albumDetailWithSongs;
  }, [
    albumsQuery?.data?.items,
    albumsQuery?.isLoading,
    songsQuery?.data?.items,
    songsQuery?.isLoading,
  ]);

  const page = useSongListStore();

  const columnDefs: ColDef[] = useMemo(
    () =>
      getColumnDefs(page.table.columns).filter((c) => c.colId !== 'album' && c.colId !== 'artist'),
    [page.table.columns],
  );

  const handlePlayQueueAdd = usePlayQueueAdd();

  const parentRef = useRef<any>();

  const rowVirtualizer = useVirtualizer({
    count: songsByAlbum?.length || 0,
    estimateSize: (i) => (songsByAlbum?.[i].songs?.length || 0) * 60 + 300,
    getScrollElement: () => parentRef.current,
    overscan: 3,
  });

  const handlePlay = (play: Play, data: any[]) => {
    handlePlayQueueAdd?.({
      byData: data,
      play,
    });
  };

  if (albumsQuery.isLoading || songsQuery.isLoading) return null;

  return (
    <NativeScrollArea
      ref={parentRef}
      scrollBarOffset="0"
    >
      {songsByAlbum && (
        <RowVirtualizer
          columnDefs={columnDefs}
          handlePlay={handlePlay}
          rowVirtualizer={rowVirtualizer}
          rows={songsByAlbum}
        />
      )}
    </NativeScrollArea>
  );
};
