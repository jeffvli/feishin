import { useMemo, useRef } from 'react';
import { Box, Stack } from '@mantine/core';
import { AlbumListSort, LibraryItem, ServerType, SortOrder } from '/@/renderer/api/types';
import { FeatureCarousel, NativeScrollArea } from '/@/renderer/components';
import { useAlbumList } from '/@/renderer/features/albums';
import { useRecentlyPlayed } from '/@/renderer/features/home/queries/recently-played-query';
import { AnimatedPage, LibraryHeaderBar } from '/@/renderer/features/shared';
import { useContainerQuery } from '/@/renderer/hooks';
import { AppRoute } from '/@/renderer/router/routes';
import { useCurrentServer, useWindowSettings } from '/@/renderer/store';
import { SwiperGridCarousel } from '/@/renderer/components/grid-carousel';
import { Platform } from '/@/renderer/types';

const HomeRoute = () => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const server = useCurrentServer();
  const cq = useContainerQuery();
  const itemsPerPage = 25;
  const { windowBarStyle } = useWindowSettings();

  const feature = useAlbumList({
    options: {
      cacheTime: 1000 * 60,
      staleTime: 1000 * 60,
    },
    query: {
      limit: 20,
      sortBy: AlbumListSort.RANDOM,
      sortOrder: SortOrder.DESC,
      startIndex: 0,
    },
    serverId: server?.id,
  });

  const featureItemsWithImage = useMemo(() => {
    return feature.data?.items?.filter((item) => item.imageUrl) ?? [];
  }, [feature.data?.items]);

  const random = useAlbumList({
    options: {
      staleTime: 1000 * 60 * 5,
    },
    query: {
      limit: itemsPerPage,
      sortBy: AlbumListSort.RANDOM,
      sortOrder: SortOrder.ASC,
      startIndex: 0,
    },
    serverId: server?.id,
  });

  const recentlyPlayed = useRecentlyPlayed({
    options: {
      staleTime: 0,
    },
    query: {
      limit: itemsPerPage,
      sortBy: AlbumListSort.RECENTLY_PLAYED,
      sortOrder: SortOrder.DESC,
      startIndex: 0,
    },
    serverId: server?.id,
  });

  const recentlyAdded = useAlbumList({
    query: {
      limit: itemsPerPage,
      sortBy: AlbumListSort.RECENTLY_ADDED,
      sortOrder: SortOrder.DESC,
      startIndex: 0,
    },
    serverId: server?.id,
  });

  const mostPlayed = useAlbumList({
    options: {
      staleTime: 1000 * 60 * 5,
    },
    query: {
      limit: itemsPerPage,
      sortBy: AlbumListSort.PLAY_COUNT,
      sortOrder: SortOrder.DESC,
      startIndex: 0,
    },
    serverId: server?.id,
  });

  const carousels = [
    {
      data: random?.data?.items,
      loading: random?.isLoading,
      title: 'Explore from your library',
      uniqueId: 'random',
    },
    {
      data: recentlyPlayed?.data?.items,
      loading: recentlyPlayed?.isLoading,
      pagination: {
        itemsPerPage,
      },
      title: 'Recently played',
      uniqueId: 'recentlyPlayed',
    },
    {
      data: recentlyAdded?.data?.items,
      loading: recentlyAdded?.isLoading,
      pagination: {
        itemsPerPage,
      },
      title: 'Newly added releases',
      uniqueId: 'recentlyAdded',
    },
    {
      data: mostPlayed?.data?.items,
      loading: mostPlayed?.isLoading,
      pagination: {
        itemsPerPage,
      },
      title: 'Most played',
      uniqueId: 'mostPlayed',
    },
  ];

  return (
    <AnimatedPage>
      <NativeScrollArea
        ref={scrollAreaRef}
        pageHeaderProps={{
          backgroundColor: 'var(--titlebar-bg)',
          children: (
            <LibraryHeaderBar>
              <LibraryHeaderBar.Title>Home</LibraryHeaderBar.Title>
            </LibraryHeaderBar>
          ),
          offset: ['0px', '200px'],
        }}
      >
        <Box
          ref={cq.ref}
          pt={windowBarStyle === Platform.WEB ? '5rem' : '3rem'}
          px="2rem"
        >
          <Stack spacing={35}>
            <FeatureCarousel data={featureItemsWithImage} />
            {carousels
              .filter((carousel) => {
                if (
                  server?.type === ServerType.JELLYFIN &&
                  carousel.uniqueId === 'recentlyPlayed'
                ) {
                  return null;
                }

                return carousel;
              })
              .map((carousel) => (
                <SwiperGridCarousel
                  key={`carousel-${carousel.uniqueId}`}
                  cardRows={[
                    {
                      property: 'name',
                      route: {
                        route: AppRoute.LIBRARY_ALBUMS_DETAIL,
                        slugs: [{ idProperty: 'id', slugProperty: 'albumId' }],
                      },
                    },
                    {
                      arrayProperty: 'name',
                      property: 'albumArtists',
                      route: {
                        route: AppRoute.LIBRARY_ALBUM_ARTISTS_DETAIL,
                        slugs: [{ idProperty: 'id', slugProperty: 'albumArtistId' }],
                      },
                    },
                  ]}
                  data={carousel.data}
                  isLoading={carousel.loading}
                  itemType={LibraryItem.ALBUM}
                  route={{
                    route: AppRoute.LIBRARY_ALBUMS_DETAIL,
                    slugs: [{ idProperty: 'id', slugProperty: 'albumId' }],
                  }}
                  title={{ label: carousel.title }}
                  uniqueId={carousel.uniqueId}
                />
              ))}
          </Stack>
        </Box>
      </NativeScrollArea>
    </AnimatedPage>
  );
};

export default HomeRoute;
