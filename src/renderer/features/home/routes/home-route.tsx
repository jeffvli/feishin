import { useMemo, useRef } from 'react';
import { ActionIcon, Group, Stack } from '@mantine/core';
import { AlbumListSort, LibraryItem, ServerType, SortOrder } from '/@/renderer/api/types';
import { FeatureCarousel, NativeScrollArea, Spinner, TextTitle } from '/@/renderer/components';
import { useAlbumList } from '/@/renderer/features/albums';
import { useRecentlyPlayed } from '/@/renderer/features/home/queries/recently-played-query';
import { AnimatedPage, LibraryHeaderBar } from '/@/renderer/features/shared';
import { AppRoute } from '/@/renderer/router/routes';
import { useCurrentServer, useWindowSettings } from '/@/renderer/store';
import { MemoizedSwiperGridCarousel } from '/@/renderer/components/grid-carousel';
import { Platform } from '/@/renderer/types';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '/@/renderer/api/query-keys';
import { useTranslation } from 'react-i18next';
import { RiRefreshLine } from 'react-icons/ri';

const HomeRoute = () => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const server = useCurrentServer();
    const itemsPerPage = 15;
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
        options: {
            staleTime: 1000 * 60 * 5,
        },
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

    const isLoading =
        random.isLoading ||
        recentlyPlayed.isLoading ||
        recentlyAdded.isLoading ||
        mostPlayed.isLoading;

    if (isLoading) {
        return <Spinner container />;
    }

    const carousels = [
        {
            data: random?.data?.items,
            sortBy: AlbumListSort.RANDOM,
            sortOrder: SortOrder.ASC,
            title: t('page.home.explore', { postProcess: 'sentenceCase' }),
            uniqueId: 'random',
        },
        {
            data: recentlyPlayed?.data?.items,
            pagination: {
                itemsPerPage,
            },
            sortBy: AlbumListSort.RECENTLY_PLAYED,
            sortOrder: SortOrder.DESC,
            title: t('page.home.recentlyPlayed', { postProcess: 'sentenceCase' }),
            uniqueId: 'recentlyPlayed',
        },
        {
            data: recentlyAdded?.data?.items,
            pagination: {
                itemsPerPage,
            },
            sortBy: AlbumListSort.RECENTLY_ADDED,
            sortOrder: SortOrder.DESC,
            title: t('page.home.newlyAdded', { postProcess: 'sentenceCase' }),
            uniqueId: 'recentlyAdded',
        },
        {
            data: mostPlayed?.data?.items,
            pagination: {
                itemsPerPage,
            },
            sortBy: AlbumListSort.PLAY_COUNT,
            sortOrder: SortOrder.DESC,
            title: t('page.home.mostPlayed', { postProcess: 'sentenceCase' }),
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
                            <LibraryHeaderBar.Title>
                                {t('page.home.title', { postProcess: 'titleCase' })}
                            </LibraryHeaderBar.Title>
                        </LibraryHeaderBar>
                    ),
                    offset: 200,
                }}
            >
                <Stack
                    mb="5rem"
                    pt={windowBarStyle === Platform.WEB ? '5rem' : '3rem'}
                    px="2rem"
                    spacing="lg"
                >
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
                            <MemoizedSwiperGridCarousel
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
                                            slugs: [
                                                {
                                                    idProperty: 'id',
                                                    slugProperty: 'albumArtistId',
                                                },
                                            ],
                                        },
                                    },
                                ]}
                                data={carousel.data}
                                itemType={LibraryItem.ALBUM}
                                route={{
                                    route: AppRoute.LIBRARY_ALBUMS_DETAIL,
                                    slugs: [{ idProperty: 'id', slugProperty: 'albumId' }],
                                }}
                                title={{
                                    label: (
                                        <Group>
                                            <TextTitle
                                                order={2}
                                                weight={700}
                                            >
                                                {carousel.title}
                                            </TextTitle>

                                            <ActionIcon
                                                onClick={() =>
                                                    queryClient.invalidateQueries({
                                                        exact: false,
                                                        queryKey: queryKeys.albums.list(
                                                            server?.id,
                                                            {
                                                                limit: itemsPerPage,
                                                                sortBy: carousel.sortBy,
                                                                sortOrder: carousel.sortOrder,
                                                                startIndex: 0,
                                                            },
                                                        ),
                                                    })
                                                }
                                            >
                                                <RiRefreshLine />
                                            </ActionIcon>
                                        </Group>
                                    ),
                                }}
                                uniqueId={carousel.uniqueId}
                            />
                        ))}
                </Stack>
            </NativeScrollArea>
        </AnimatedPage>
    );
};

export default HomeRoute;
