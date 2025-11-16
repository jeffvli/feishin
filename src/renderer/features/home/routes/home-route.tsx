import { useQuery } from '@tanstack/react-query';
import { Suspense, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { FeatureCarousel } from '/@/renderer/components/feature-carousel/feature-carousel';
import { NativeScrollArea } from '/@/renderer/components/native-scroll-area/native-scroll-area';
import { albumQueries } from '/@/renderer/features/albums/api/album-api';
import { AlbumInfiniteCarousel } from '/@/renderer/features/albums/components/album-infinite-carousel';
import { AnimatedPage } from '/@/renderer/features/shared/components/animated-page';
import { LibraryHeaderBar } from '/@/renderer/features/shared/components/library-header-bar';
import {
    HomeItem,
    useCurrentServer,
    useGeneralSettings,
    useWindowSettings,
} from '/@/renderer/store';
import { Spinner } from '/@/shared/components/spinner/spinner';
import { Stack } from '/@/shared/components/stack/stack';
import { AlbumListSort, LibraryItem, ServerType, SortOrder } from '/@/shared/types/domain-types';
import { Platform } from '/@/shared/types/types';

const HomeRoute = () => {
    const { t } = useTranslation();
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const server = useCurrentServer();
    const { windowBarStyle } = useWindowSettings();
    const { homeFeature, homeItems } = useGeneralSettings();

    const isJellyfin = server?.type === ServerType.JELLYFIN;

    const feature = useQuery(
        albumQueries.list({
            options: {
                enabled: homeFeature,
                gcTime: 1000 * 60,
                staleTime: 1000 * 60,
            },
            query: {
                limit: 20,
                sortBy: AlbumListSort.RANDOM,
                sortOrder: SortOrder.DESC,
                startIndex: 0,
            },
            serverId: server?.id,
        }),
    );

    const featureItemsWithImage = useMemo(() => {
        return feature.data?.items?.filter((item) => item.imageUrl) ?? [];
    }, [feature.data?.items]);

    // Carousel configuration - queries are now handled inside AlbumInfiniteCarousel
    const carousels = {
        [HomeItem.MOST_PLAYED]: {
            itemType: isJellyfin ? LibraryItem.SONG : LibraryItem.ALBUM,
            sortBy: AlbumListSort.PLAY_COUNT,
            sortOrder: SortOrder.DESC,
            title: t('page.home.mostPlayed', { postProcess: 'sentenceCase' }),
        },
        [HomeItem.RANDOM]: {
            itemType: LibraryItem.ALBUM,
            sortBy: AlbumListSort.RANDOM,
            sortOrder: SortOrder.ASC,
            title: t('page.home.explore', { postProcess: 'sentenceCase' }),
        },
        [HomeItem.RECENTLY_ADDED]: {
            itemType: LibraryItem.ALBUM,
            sortBy: AlbumListSort.RECENTLY_ADDED,
            sortOrder: SortOrder.DESC,
            title: t('page.home.newlyAdded', { postProcess: 'sentenceCase' }),
        },
        [HomeItem.RECENTLY_PLAYED]: {
            itemType: LibraryItem.ALBUM,
            sortBy: AlbumListSort.RECENTLY_PLAYED,
            sortOrder: SortOrder.DESC,
            title: t('page.home.recentlyPlayed', { postProcess: 'sentenceCase' }),
        },
        [HomeItem.RECENTLY_RELEASED]: {
            itemType: LibraryItem.ALBUM,
            sortBy: AlbumListSort.RELEASE_DATE,
            sortOrder: SortOrder.DESC,
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
                    {sortedCarousel.map((carousel) => {
                        if (carousel.itemType === LibraryItem.ALBUM) {
                            return (
                                <Suspense
                                    fallback={<Spinner container />}
                                    key={`carousel-${carousel.uniqueId}`}
                                >
                                    <AlbumInfiniteCarousel
                                        rowCount={1}
                                        sortBy={carousel.sortBy}
                                        sortOrder={carousel.sortOrder}
                                        title={carousel.title}
                                    />
                                </Suspense>
                            );
                        }

                        if ('data' in carousel && 'query' in carousel) {
                            // TODO: Create SongInfiniteCarousel
                            return null;
                        }

                        return null;
                    })}
                </Stack>
            </NativeScrollArea>
        </AnimatedPage>
    );
};

export default HomeRoute;
