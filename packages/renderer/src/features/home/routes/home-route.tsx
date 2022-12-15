import { Box, Stack } from '@mantine/core';
import { AlbumListSort, SortOrder } from '/@/api/types';
import { GridCarousel, PageHeader, ScrollArea, TextTitle } from '/@/components';
import { useAlbumList } from '/@/features/albums';
import { useRecentlyPlayed } from '/@/features/home/queries/recently-played-query';
import { AnimatedPage } from '/@/features/shared';
import { AppRoute } from '/@/router/routes';
import { useSetState } from '@mantine/hooks';
import { throttle } from 'lodash';
import { useContainerQuery } from '/@/hooks';

const HomeRoute = () => {
  const rootElement = document.querySelector(':root') as HTMLElement;
  const cq = useContainerQuery();

  const itemsPerPage = cq.isXl ? 9 : cq.isLg ? 7 : cq.isMd ? 5 : cq.isSm ? 4 : 3;
  const [pagination, setPagination] = useSetState({
    mostPlayed: 0,
    random: 0,
    recentlyAdded: 0,
    recentlyPlayed: 0,
  });

  const random = useAlbumList(
    {
      limit: itemsPerPage,
      sortBy: AlbumListSort.RANDOM,
      sortOrder: SortOrder.ASC,
      startIndex: pagination.random * itemsPerPage,
    },
    {
      keepPreviousData: true,
      staleTime: 0,
    },
  );

  const recentlyPlayed = useRecentlyPlayed(
    {
      limit: itemsPerPage,
      sortBy: AlbumListSort.RECENTLY_PLAYED,
      sortOrder: SortOrder.ASC,
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
      sortOrder: SortOrder.ASC,
      startIndex: pagination.recentlyAdded * itemsPerPage,
    },
    {
      keepPreviousData: true,
      staleTime: 0,
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
      staleTime: 0,
    },
  );

  const handleNextPage = (key: 'mostPlayed' | 'random' | 'recentlyAdded' | 'recentlyPlayed') => {
    setPagination({
      [key]: pagination[key as keyof typeof pagination] + 1,
    });
  };

  const handlePreviousPage = (
    key: 'mostPlayed' | 'random' | 'recentlyAdded' | 'recentlyPlayed',
  ) => {
    setPagination({
      [key]: pagination[key as keyof typeof pagination] - 1,
    });
  };

  const handleScroll = (position: { x: number; y: number }) => {
    if (position.y <= 15) {
      return rootElement?.style?.setProperty('--header-opacity', '0');
    }

    return rootElement?.style?.setProperty('--header-opacity', '1');
  };

  const throttledScroll = throttle(handleScroll, 200);

  return (
    <>
      <AnimatedPage>
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <PageHeader
            useOpacity
            backgroundColor="var(--sidebar-bg)"
          />
          <ScrollArea
            mb="1rem"
            mt="-1.5rem"
            px="1rem"
            sx={{
              height: '100%',
              overflow: 'auto',
            }}
            onScrollPositionChange={throttledScroll}
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
                <GridCarousel
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
                  data={random?.data?.items}
                  loading={random.isLoading || random.isFetching}
                  pagination={{
                    handleNextPage: () => handleNextPage('random'),
                    handlePreviousPage: () => handlePreviousPage('random'),
                    hasPreviousPage: pagination.random > 0,
                    itemsPerPage,
                  }}
                >
                  <GridCarousel.Title>
                    <TextTitle
                      fw="bold"
                      order={3}
                    >
                      Explore from your library
                    </TextTitle>
                  </GridCarousel.Title>
                </GridCarousel>
                <GridCarousel
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
                  data={recentlyPlayed?.data?.items}
                  loading={recentlyPlayed.isLoading || recentlyPlayed.isFetching}
                  pagination={{
                    handleNextPage: () => handleNextPage('recentlyPlayed'),
                    handlePreviousPage: () => handlePreviousPage('recentlyPlayed'),
                    hasPreviousPage: pagination.recentlyPlayed > 0,
                    itemsPerPage,
                  }}
                >
                  <GridCarousel.Title>
                    <TextTitle
                      fw="bold"
                      order={3}
                    >
                      Recently played
                    </TextTitle>
                  </GridCarousel.Title>
                </GridCarousel>
                <GridCarousel
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
                  data={recentlyAdded?.data?.items}
                  loading={recentlyAdded.isLoading || recentlyAdded.isFetching}
                  pagination={{
                    handleNextPage: () => handleNextPage('recentlyAdded'),
                    handlePreviousPage: () => handlePreviousPage('recentlyAdded'),
                    hasPreviousPage: pagination.recentlyAdded > 0,
                    itemsPerPage,
                  }}
                >
                  <GridCarousel.Title>
                    <TextTitle
                      fw="bold"
                      order={3}
                    >
                      Newly added releases
                    </TextTitle>
                  </GridCarousel.Title>
                </GridCarousel>
                <GridCarousel
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
                  data={mostPlayed?.data?.items}
                  loading={mostPlayed.isLoading || mostPlayed.isFetching}
                  pagination={{
                    handleNextPage: () => handleNextPage('mostPlayed'),
                    handlePreviousPage: () => handlePreviousPage('mostPlayed'),
                    hasPreviousPage: pagination.mostPlayed > 0,
                    itemsPerPage,
                  }}
                >
                  <GridCarousel.Title>
                    <TextTitle
                      fw="bold"
                      order={3}
                    >
                      Most played
                    </TextTitle>
                  </GridCarousel.Title>
                </GridCarousel>
              </Stack>
            </Box>
          </ScrollArea>
        </Box>
      </AnimatedPage>
    </>
  );
};

export default HomeRoute;
