import { useCallback, useMemo } from 'react';
import { Box, Stack } from '@mantine/core';
import { useSetState } from '@mantine/hooks';
import { AlbumListSort, ServerType, SortOrder } from '/@/renderer/api/types';
import { TextTitle, PageHeader, FeatureCarousel, GridCarousel } from '/@/renderer/components';
import { useAlbumList } from '/@/renderer/features/albums';
import { useRecentlyPlayed } from '/@/renderer/features/home/queries/recently-played-query';
import { AnimatedPage } from '/@/renderer/features/shared';
import { useContainerQuery } from '/@/renderer/hooks';
import { AppRoute } from '/@/renderer/router/routes';
import { useCurrentServer } from '/@/renderer/store';

const HomeRoute = () => {
  // const rootElement = document.querySelector(':root') as HTMLElement;
  const server = useCurrentServer();
  const cq = useContainerQuery();
  const itemsPerPage = cq.isXl ? 9 : cq.isLg ? 7 : cq.isMd ? 5 : cq.isSm ? 4 : 3;

  const [pagination, setPagination] = useSetState({
    mostPlayed: 0,
    random: 0,
    recentlyAdded: 0,
    recentlyPlayed: 0,
  });

  const feature = useAlbumList(
    {
      limit: 20,
      sortBy: AlbumListSort.RANDOM,
      sortOrder: SortOrder.DESC,
      startIndex: 0,
    },
    {
      cacheTime: 1000 * 60,
      staleTime: 1000 * 60,
    },
  );

  const featureItemsWithImage = useMemo(() => {
    return feature.data?.items?.filter((item) => item.imageUrl) ?? [];
  }, [feature.data?.items]);

  const random = useAlbumList(
    {
      limit: itemsPerPage,
      sortBy: AlbumListSort.RANDOM,
      sortOrder: SortOrder.ASC,
      startIndex: pagination.random * itemsPerPage,
    },
    {
      cacheTime: 1000 * 60,
      keepPreviousData: true,
      staleTime: 1000 * 60,
    },
  );

  const recentlyPlayed = useRecentlyPlayed(
    {
      limit: itemsPerPage,
      sortBy: AlbumListSort.RECENTLY_PLAYED,
      sortOrder: SortOrder.DESC,
      startIndex: pagination.recentlyPlayed * itemsPerPage,
    },
    {
      keepPreviousData: true,
      staleTime: 0,
    },
  );

  const recentlyAdded = useAlbumList(
    {
      limit: itemsPerPage,
      sortBy: AlbumListSort.RECENTLY_ADDED,
      sortOrder: SortOrder.DESC,
      startIndex: pagination.recentlyAdded * itemsPerPage,
    },
    {
      keepPreviousData: true,
      staleTime: 1000 * 60,
    },
  );

  const mostPlayed = useAlbumList(
    {
      limit: itemsPerPage,
      sortBy: AlbumListSort.PLAY_COUNT,
      sortOrder: SortOrder.DESC,
      startIndex: pagination.mostPlayed * itemsPerPage,
    },
    {
      keepPreviousData: true,
      staleTime: 1000 * 60 * 60,
    },
  );

  const handleNextPage = useCallback(
    (key: 'mostPlayed' | 'random' | 'recentlyAdded' | 'recentlyPlayed') => {
      setPagination({
        [key]: pagination[key as keyof typeof pagination] + 1,
      });
    },
    [pagination, setPagination],
  );

  const handlePreviousPage = useCallback(
    (key: 'mostPlayed' | 'random' | 'recentlyAdded' | 'recentlyPlayed') => {
      setPagination({
        [key]: pagination[key as keyof typeof pagination] - 1,
      });
    },
    [pagination, setPagination],
  );

  // const handleScroll = (position: { x: number; y: number }) => {
  //   if (position.y <= 15) {
  //     return rootElement?.style?.setProperty('--header-opacity', '0');
  //   }

  //   return rootElement?.style?.setProperty('--header-opacity', '1');
  // };

  // const throttledScroll = throttle(handleScroll, 200);

  const carousels = [
    {
      data: random?.data?.items,
      loading: random?.isLoading || random.isFetching,
      pagination: {
        handleNextPage: () => handleNextPage('random'),
        handlePreviousPage: () => handlePreviousPage('random'),
        hasPreviousPage: pagination.random > 0,
        itemsPerPage,
      },
      title: (
        <TextTitle
          fw="bold"
          order={3}
        >
          Explore from your library
        </TextTitle>
      ),
      uniqueId: 'random',
    },
    {
      data: recentlyPlayed?.data?.items,
      loading: recentlyPlayed?.isLoading || recentlyPlayed.isFetching,
      pagination: {
        handleNextPage: () => handleNextPage('recentlyPlayed'),
        handlePreviousPage: () => handlePreviousPage('recentlyPlayed'),
        hasPreviousPage: pagination.recentlyPlayed > 0,
        itemsPerPage,
      },
      title: (
        <TextTitle
          fw="bold"
          order={3}
        >
          Recently played
        </TextTitle>
      ),
      uniqueId: 'recentlyPlayed',
    },
    {
      data: recentlyAdded?.data?.items,
      loading: recentlyAdded?.isLoading || recentlyAdded.isFetching,
      pagination: {
        handleNextPage: () => handleNextPage('recentlyAdded'),
        handlePreviousPage: () => handlePreviousPage('recentlyAdded'),
        hasPreviousPage: pagination.recentlyAdded > 0,
        itemsPerPage,
      },
      title: (
        <TextTitle
          fw="bold"
          order={3}
        >
          Newly added releases
        </TextTitle>
      ),
      uniqueId: 'recentlyAdded',
    },
    {
      data: mostPlayed?.data?.items,
      loading: mostPlayed?.isLoading || mostPlayed.isFetching,
      pagination: {
        handleNextPage: () => handleNextPage('mostPlayed'),
        handlePreviousPage: () => handlePreviousPage('mostPlayed'),
        hasPreviousPage: pagination.mostPlayed > 0,
        itemsPerPage,
      },
      title: (
        <TextTitle
          fw="bold"
          order={3}
        >
          Most played
        </TextTitle>
      ),
      uniqueId: 'mostPlayed',
    },
  ];

  return (
    <AnimatedPage>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <PageHeader
          useOpacity
          backgroundColor="var(--sidebar-bg)"
        />
        <Box
          mb="1rem"
          mt="-1.5rem"
          px="1rem"
          sx={{
            height: '100%',
            overflow: 'auto',
          }}
        >
          <Box
            ref={cq.ref}
            sx={{
              height: '100%',
              maxWidth: '1920px',
              width: '100%',
            }}
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
                .map((carousel, index) => (
                  <GridCarousel
                    key={`carousel-${carousel.uniqueId}-${index}`}
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
                          route: AppRoute.LIBRARY_ALBUMARTISTS_DETAIL,
                          slugs: [{ idProperty: 'id', slugProperty: 'albumArtistId' }],
                        },
                      },
                    ]}
                    containerWidth={cq.width}
                    data={carousel.data}
                    loading={carousel.loading}
                    pagination={carousel.pagination}
                    uniqueId={carousel.uniqueId}
                  >
                    <GridCarousel.Title>{carousel.title}</GridCarousel.Title>
                  </GridCarousel>
                ))}
            </Stack>
          </Box>
        </Box>
      </Box>
    </AnimatedPage>
  );
};

export default HomeRoute;
