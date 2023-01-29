import { useParams } from 'react-router';
import { AlbumListSort, SortOrder, SongListSort } from '/@/renderer/api/types';
import { VirtualGridContainer } from '/@/renderer/components';
import { useAlbumList } from '/@/renderer/features/albums';
import { AnimatedPage } from '/@/renderer/features/shared';
import { useSongList } from '/@/renderer/features/songs';
// import { useSongListStore } from '/@/renderer/store';
// import { usePlayQueueAdd } from '/@/renderer/features/player';
// import { Play } from '/@/renderer/types';
// import { useAlbumArtistDetail } from '/@/renderer/features/artists/queries/album-artist-detail-query';

const AlbumArtistDetailDiscographyRoute = () => {
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

  // const page = useSongListStore();

  // const handlePlayQueueAdd = usePlayQueueAdd();

  if (albumsQuery.isLoading || songsQuery.isLoading) return null;

  // const handlePlay = (play: Play, data: any[]) => {
  //   handlePlayQueueAdd?.({
  //     byData: data,
  //     play,
  //   });
  // };

  return (
    <AnimatedPage>
      <VirtualGridContainer>
        {/* <AlbumArtistDiscographyHeader />
        <PageHeader>
          <Group
            position="apart"
            w="100%"
          >
            {albumArtistQuery?.data?.name || ''}
            <Group spacing="xs">
              <Button
                compact
                radius="xl"
                variant="subtle"
              >
                <RiListUnordered size="1.5em" />
              </Button>
              <Button
                compact
                radius="xl"
                variant="subtle"
              >
                <RiLayoutGridFill size="1.5em" />
              </Button>
            </Group>
          </Group>
        </PageHeader> *
        <AlbumArtistDiscographyDetailList /> */}
      </VirtualGridContainer>
    </AnimatedPage>
  );
};

export default AlbumArtistDetailDiscographyRoute;
