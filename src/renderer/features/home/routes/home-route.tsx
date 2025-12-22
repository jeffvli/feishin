import { Suspense, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { NativeScrollArea } from '/@/renderer/components/native-scroll-area/native-scroll-area';
import { AlbumInfiniteCarousel } from '/@/renderer/features/albums/components/album-infinite-carousel';
import { AlbumInfiniteFeatureCarousel } from '/@/renderer/features/home/components/album-infinite-feature-carousel';
import { FeaturedGenres } from '/@/renderer/features/home/components/featured-genres';
import { AnimatedPage } from '/@/renderer/features/shared/components/animated-page';
import { LibraryContainer } from '/@/renderer/features/shared/components/library-container';
import { LibraryHeaderBar } from '/@/renderer/features/shared/components/library-header-bar';
import { PageErrorBoundary } from '/@/renderer/features/shared/components/page-error-boundary';
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

    const sortedItems = homeItems.filter((item) => {
        if (item.disabled) {
            return false;
        }
        if (isJellyfin && item.id === HomeItem.RECENTLY_PLAYED) {
            return false;
        }

        return true;
    });

    const sortedCarousel = sortedItems
        .filter((item) => item.id !== HomeItem.GENRES)
        .map((item) => ({
            ...carousels[item.id],
            uniqueId: item.id,
        }));

    return (
        <AnimatedPage>
            <NativeScrollArea
                pageHeaderProps={{
                    backgroundColor: 'var(--theme-colors-background)',
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
                <LibraryContainer>
                    <Stack
                        gap="2xl"
                        mb="5rem"
                        pt={windowBarStyle === Platform.WEB ? '5rem' : '3rem'}
                        px="2rem"
                    >
                        {homeFeature && <AlbumInfiniteFeatureCarousel />}
                        {sortedItems.map((item) => {
                            if (item.id === HomeItem.GENRES) {
                                return <FeaturedGenres key="featured-genres" />;
                            }

                            const carousel = sortedCarousel.find((c) => c.uniqueId === item.id);
                            if (!carousel) {
                                return null;
                            }

                            if (carousel.itemType === LibraryItem.ALBUM) {
                                return (
                                    <AlbumInfiniteCarousel
                                        key={`carousel-${carousel.uniqueId}`}
                                        rowCount={1}
                                        sortBy={carousel.sortBy}
                                        sortOrder={carousel.sortOrder}
                                        title={carousel.title}
                                    />
                                );
                            }

                            if ('data' in carousel && 'query' in carousel) {
                                // TODO: Create SongInfiniteCarousel
                                return null;
                            }

                            return null;
                        })}
                    </Stack>
                </LibraryContainer>
            </NativeScrollArea>
        </AnimatedPage>
    );
};

const HomeRouteWithBoundary = () => {
    return (
        <PageErrorBoundary>
            <Suspense fallback={<Spinner container />}>
                <HomeRoute />
            </Suspense>
        </PageErrorBoundary>
    );
};

export default HomeRouteWithBoundary;
