import { useMemo, useRef } from 'react';
import { ActionIcon, Group, Stack } from '@mantine/core';
import {
    AlbumListSort,
    LibraryItem,
    ServerType,
    SongListSort,
    SortOrder,
} from '/@/renderer/api/types';
import { FeatureCarousel, NativeScrollArea, Spinner, TextTitle } from '/@/renderer/components';
import { useAlbumList } from '/@/renderer/features/albums';
import { useRecentlyPlayed } from '/@/renderer/features/home/queries/recently-played-query';
import { AnimatedPage, LibraryHeaderBar } from '/@/renderer/features/shared';
import { AppRoute } from '/@/renderer/router/routes';
import {
    HomeItem,
    useCurrentServer,
    useGeneralSettings,
    useWindowSettings,
} from '/@/renderer/store';
import { MemoizedSwiperGridCarousel } from '/@/renderer/components/grid-carousel';
import { Platform } from '/@/renderer/types';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '/@/renderer/api/query-keys';
import { useTranslation } from 'react-i18next';
import { RiRefreshLine } from 'react-icons/ri';
import { useSongList } from '/@/renderer/features/songs';

const HomeRoute = () => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const server = useCurrentServer();
    const itemsPerPage = 15;
    const { windowBarStyle } = useWindowSettings();
    const { homeFeature, homeItems } = useGeneralSettings();

    const feature = useAlbumList({
        options: {
            cacheTime: 1000 * 60,
            enabled: homeFeature,
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

    const mostPlayedAlbums = useAlbumList({
        options: {
            enabled: server?.type === ServerType.SUBSONIC || server?.type === ServerType.NAVIDROME,
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

    const mostPlayedSongs = useSongList(
        {
            options: {
                enabled: server?.type === ServerType.JELLYFIN,
                staleTime: 1000 * 60 * 5,
            },
            query: {
                limit: itemsPerPage,
                sortBy: SongListSort.PLAY_COUNT,
                sortOrder: SortOrder.DESC,
                startIndex: 0,
            },
            serverId: server?.id,
        },
        300,
    );

    const isLoading =
        random.isLoading ||
        recentlyPlayed.isLoading ||
        recentlyAdded.isLoading ||
        (server?.type === ServerType.JELLYFIN && mostPlayedSongs.isLoading) ||
        ((server?.type === ServerType.SUBSONIC || server?.type === ServerType.NAVIDROME) &&
            mostPlayedAlbums.isLoading);

    if (isLoading) {
        return <Spinner container />;
    }

    const carousels = {
        [HomeItem.RANDOM]: {
            data: random?.data?.items,
            itemType: LibraryItem.ALBUM,
            sortBy: AlbumListSort.RANDOM,
            sortOrder: SortOrder.ASC,
            title: t('page.home.explore', { postProcess: 'sentenceCase' }),
        },
        [HomeItem.RECENTLY_PLAYED]: {
            data: recentlyPlayed?.data?.items,
            itemType: LibraryItem.ALBUM,
            pagination: {
                itemsPerPage,
            },
            sortBy: AlbumListSort.RECENTLY_PLAYED,
            sortOrder: SortOrder.DESC,
            title: t('page.home.recentlyPlayed', { postProcess: 'sentenceCase' }),
        },
        [HomeItem.RECENTLY_ADDED]: {
            data: recentlyAdded?.data?.items,
            itemType: LibraryItem.ALBUM,
            pagination: {
                itemsPerPage,
            },
            sortBy: AlbumListSort.RECENTLY_ADDED,
            sortOrder: SortOrder.DESC,
            title: t('page.home.newlyAdded', { postProcess: 'sentenceCase' }),
        },
        [HomeItem.MOST_PLAYED]: {
            data:
                server?.type === ServerType.JELLYFIN
                    ? mostPlayedSongs?.data?.items
                    : mostPlayedAlbums?.data?.items,
            itemType: server?.type === ServerType.JELLYFIN ? LibraryItem.SONG : LibraryItem.ALBUM,
            pagination: {
                itemsPerPage,
            },
            sortBy:
                server?.type === ServerType.JELLYFIN
                    ? SongListSort.PLAY_COUNT
                    : AlbumListSort.PLAY_COUNT,
            sortOrder: SortOrder.DESC,
            title: t('page.home.mostPlayed', { postProcess: 'sentenceCase' }),
        },
    };

    const sortedCarousel = homeItems
        .filter((item) => {
            if (item.disabled) {
                return false;
            }
            if (server?.type === ServerType.JELLYFIN && item.id === HomeItem.RECENTLY_PLAYED) {
                return false;
            }

            return true;
        })
        .map((item) => ({
            ...carousels[item.id],
            uniqueId: item.id,
        }));

    const invalidateCarouselQuery = (carousel: {
        itemType: LibraryItem;
        sortBy: SongListSort | AlbumListSort;
        sortOrder: SortOrder;
    }) => {
        if (carousel.itemType === LibraryItem.ALBUM) {
            queryClient.invalidateQueries({
                exact: false,
                queryKey: queryKeys.albums.list(server?.id, {
                    limit: itemsPerPage,
                    sortBy: carousel.sortBy,
                    sortOrder: carousel.sortOrder,
                    startIndex: 0,
                }),
            });
        }

        if (carousel.itemType === LibraryItem.SONG) {
            queryClient.invalidateQueries({
                exact: false,
                queryKey: queryKeys.songs.list(server?.id, {
                    limit: itemsPerPage,
                    sortBy: carousel.sortBy,
                    sortOrder: carousel.sortOrder,
                    startIndex: 0,
                }),
            });
        }
    };

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
                    {homeFeature && <FeatureCarousel data={featureItemsWithImage} />}
                    {sortedCarousel.map((carousel) => (
                        <MemoizedSwiperGridCarousel
                            key={`carousel-${carousel.uniqueId}`}
                            cardRows={[
                                {
                                    property: 'name',
                                    route: {
                                        route: AppRoute.LIBRARY_ALBUMS_DETAIL,
                                        slugs: [
                                            {
                                                idProperty:
                                                    server?.type === ServerType.JELLYFIN &&
                                                    carousel.itemType === LibraryItem.SONG
                                                        ? 'albumId'
                                                        : 'id',
                                                slugProperty: 'albumId',
                                            },
                                        ],
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
                            itemType={carousel.itemType}
                            route={{
                                route: AppRoute.LIBRARY_ALBUMS_DETAIL,
                                slugs: [
                                    {
                                        idProperty:
                                            server?.type === ServerType.JELLYFIN &&
                                            carousel.itemType === LibraryItem.SONG
                                                ? 'albumId'
                                                : 'id',
                                        slugProperty: 'albumId',
                                    },
                                ],
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
                                            onClick={() => invalidateCarouselQuery(carousel)}
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
