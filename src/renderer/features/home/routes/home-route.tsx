import { useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { FeatureCarousel } from '/@/renderer/components/feature-carousel/feature-carousel';
import { MemoizedSwiperGridCarousel } from '/@/renderer/components/grid-carousel/grid-carousel';
import { NativeScrollArea } from '/@/renderer/components/native-scroll-area/native-scroll-area';
import { useAlbumList } from '/@/renderer/features/albums';
import { useRecentlyPlayed } from '/@/renderer/features/home/queries/recently-played-query';
import { AnimatedPage, LibraryHeaderBar } from '/@/renderer/features/shared';
import { useSongList } from '/@/renderer/features/songs';
import { AppRoute } from '/@/renderer/router/routes';
import {
    HomeItem,
    useCurrentServer,
    useGeneralSettings,
    useWindowSettings,
} from '/@/renderer/store';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { Spinner } from '/@/shared/components/spinner/spinner';
import { Stack } from '/@/shared/components/stack/stack';
import { TextTitle } from '/@/shared/components/text-title/text-title';
import {
    AlbumListSort,
    LibraryItem,
    ServerType,
    SongListSort,
    SortOrder,
} from '/@/shared/types/domain-types';
import { Platform } from '/@/shared/types/types';

const BASE_QUERY_ARGS = {
    limit: 15,
    sortOrder: SortOrder.DESC,
    startIndex: 0,
};

const HomeRoute = () => {
    const { t } = useTranslation();
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const server = useCurrentServer();
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

    const isJellyfin = server?.type === ServerType.JELLYFIN;

    const featureItemsWithImage = useMemo(() => {
        return feature.data?.items?.filter((item) => item.imageUrl) ?? [];
    }, [feature.data?.items]);

    const queriesEnabled = useMemo(() => {
        return homeItems.reduce(
            (previous: Record<HomeItem, boolean>, current) => ({
                ...previous,
                [current.id]: !current.disabled,
            }),
            {} as Record<HomeItem, boolean>,
        );
    }, [homeItems]);

    const random = useAlbumList({
        options: {
            enabled: queriesEnabled[HomeItem.RANDOM],
            staleTime: 1000 * 60 * 5,
        },
        query: {
            ...BASE_QUERY_ARGS,
            sortBy: AlbumListSort.RANDOM,
        },
        serverId: server?.id,
    });

    const recentlyPlayed = useRecentlyPlayed({
        options: {
            enabled: queriesEnabled[HomeItem.RECENTLY_PLAYED] && !isJellyfin,
            staleTime: 0,
        },
        query: {
            ...BASE_QUERY_ARGS,
            sortBy: AlbumListSort.RECENTLY_PLAYED,
        },
        serverId: server?.id,
    });

    const recentlyAdded = useAlbumList({
        options: {
            enabled: queriesEnabled[HomeItem.RECENTLY_ADDED],
            staleTime: 1000 * 60 * 5,
        },
        query: {
            ...BASE_QUERY_ARGS,
            sortBy: AlbumListSort.RECENTLY_ADDED,
        },
        serverId: server?.id,
    });

    const mostPlayedAlbums = useAlbumList({
        options: {
            enabled: !isJellyfin && queriesEnabled[HomeItem.MOST_PLAYED],
            staleTime: 1000 * 60 * 5,
        },
        query: {
            ...BASE_QUERY_ARGS,
            sortBy: AlbumListSort.PLAY_COUNT,
        },
        serverId: server?.id,
    });

    const mostPlayedSongs = useSongList(
        {
            options: {
                enabled: isJellyfin && queriesEnabled[HomeItem.MOST_PLAYED],
                staleTime: 1000 * 60 * 5,
            },
            query: {
                ...BASE_QUERY_ARGS,
                sortBy: SongListSort.PLAY_COUNT,
            },
            serverId: server?.id,
        },
        300,
    );

    const recentlyReleased = useAlbumList({
        options: {
            enabled: queriesEnabled[HomeItem.RECENTLY_RELEASED],
            staleTime: 1000 * 60 * 5,
        },
        query: {
            ...BASE_QUERY_ARGS,
            sortBy: AlbumListSort.RELEASE_DATE,
        },
        serverId: server?.id,
    });

    const isLoading =
        (random.isLoading && queriesEnabled[HomeItem.RANDOM]) ||
        (recentlyPlayed.isLoading && queriesEnabled[HomeItem.RECENTLY_PLAYED] && !isJellyfin) ||
        (recentlyAdded.isLoading && queriesEnabled[HomeItem.RECENTLY_ADDED]) ||
        (recentlyReleased.isLoading && queriesEnabled[HomeItem.RECENTLY_RELEASED]) ||
        (((isJellyfin && mostPlayedSongs.isLoading) ||
            (!isJellyfin && mostPlayedAlbums.isLoading)) &&
            queriesEnabled[HomeItem.MOST_PLAYED]);

    if (isLoading) {
        return <Spinner container />;
    }

    const carousels = {
        [HomeItem.MOST_PLAYED]: {
            data: isJellyfin ? mostPlayedSongs?.data?.items : mostPlayedAlbums?.data?.items,
            itemType: isJellyfin ? LibraryItem.SONG : LibraryItem.ALBUM,
            query: isJellyfin ? mostPlayedSongs : mostPlayedAlbums,
            title: t('page.home.mostPlayed', { postProcess: 'sentenceCase' }),
        },
        [HomeItem.RANDOM]: {
            data: random?.data?.items,
            itemType: LibraryItem.ALBUM,
            query: random,
            title: t('page.home.explore', { postProcess: 'sentenceCase' }),
        },
        [HomeItem.RECENTLY_ADDED]: {
            data: recentlyAdded?.data?.items,
            itemType: LibraryItem.ALBUM,
            query: recentlyAdded,
            title: t('page.home.newlyAdded', { postProcess: 'sentenceCase' }),
        },
        [HomeItem.RECENTLY_PLAYED]: {
            data: recentlyPlayed?.data?.items,
            itemType: LibraryItem.ALBUM,
            query: recentlyPlayed,
            title: t('page.home.recentlyPlayed', { postProcess: 'sentenceCase' }),
        },
        [HomeItem.RECENTLY_RELEASED]: {
            data: recentlyReleased?.data?.items,
            itemType: LibraryItem.ALBUM,
            query: recentlyReleased,
            title: t('page.home.recentlyReleased', { postProcess: 'sentenceCase' }),
        },
    };

    const sortedCarousel = homeItems
        .filter((item) => {
            if (item.disabled) {
                return false;
            }
            if (isJellyfin && item.id === HomeItem.RECENTLY_PLAYED) {
                return false;
            }

            return true;
        })
        .map((item) => ({
            ...carousels[item.id],
            uniqueId: item.id,
        }));

    return (
        <AnimatedPage>
            <NativeScrollArea
                pageHeaderProps={{
                    children: (
                        <LibraryHeaderBar>
                            <LibraryHeaderBar.Title>
                                {t('page.home.title', { postProcess: 'titleCase' })}
                            </LibraryHeaderBar.Title>
                        </LibraryHeaderBar>
                    ),
                    offset: 200,
                }}
                ref={scrollAreaRef}
            >
                <Stack
                    gap="lg"
                    mb="5rem"
                    pt={windowBarStyle === Platform.WEB ? '5rem' : '3rem'}
                    px="2rem"
                >
                    {homeFeature && <FeatureCarousel data={featureItemsWithImage} />}
                    {sortedCarousel.map((carousel) => (
                        <MemoizedSwiperGridCarousel
                            cardRows={[
                                {
                                    property: 'name',
                                    route: {
                                        route: AppRoute.LIBRARY_ALBUMS_DETAIL,
                                        slugs: [
                                            {
                                                idProperty:
                                                    isJellyfin &&
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
                            key={`carousel-${carousel.uniqueId}`}
                            route={{
                                route: AppRoute.LIBRARY_ALBUMS_DETAIL,
                                slugs: [
                                    {
                                        idProperty:
                                            isJellyfin && carousel.itemType === LibraryItem.SONG
                                                ? 'albumId'
                                                : 'id',
                                        slugProperty: 'albumId',
                                    },
                                ],
                            }}
                            title={{
                                label: (
                                    <Group>
                                        <TextTitle order={3}>{carousel.title}</TextTitle>
                                        <ActionIcon
                                            onClick={() => carousel.query.refetch()}
                                            variant="transparent"
                                        >
                                            <Icon icon="refresh" />
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
