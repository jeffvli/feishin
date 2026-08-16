import { Suspense, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { useGridCarouselContainerQuery } from '/@/renderer/components/grid-carousel/grid-carousel-v2';
import { NativeScrollArea } from '/@/renderer/components/native-scroll-area/native-scroll-area';
import { DiscoverCarousel } from '/@/renderer/features/discover/components/discover-carousel';
import { DiscoverFeatureCarousel } from '/@/renderer/features/discover/components/discover-feature-carousel';
import { DiscoverSkeleton } from '/@/renderer/features/discover/components/discover-skeleton';
import { DiscoverTrackTable } from '/@/renderer/features/discover/components/discover-track-table';
import { useDiscoverData } from '/@/renderer/features/discover/hooks/use-discover-data';
import { useMarkDiscoverSeen } from '/@/renderer/features/discover/hooks/use-discover-unread';
import { usePreviewActions } from '/@/renderer/features/preview/preview-store';
import { AnimatedPage } from '/@/renderer/features/shared/components/animated-page';
import { LibraryContainer } from '/@/renderer/features/shared/components/library-container';
import { LibraryHeaderBar } from '/@/renderer/features/shared/components/library-header-bar';
import { PageErrorBoundary } from '/@/renderer/features/shared/components/page-error-boundary';
import { useDiscoverSettings, useWindowSettings } from '/@/renderer/store';
import { Center } from '/@/shared/components/center/center';
import { Spinner } from '/@/shared/components/spinner/spinner';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';
import { Platform } from '/@/shared/types/types';

const DiscoverRoute = () => {
    const { t } = useTranslation();
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const { windowBarStyle } = useWindowSettings();
    const { username } = useDiscoverSettings();
    const containerQuery = useGridCarouselContainerQuery();
    const { isError, isIndexing, isPending, progress, rows } = useDiscoverData(username);
    const markSeen = useMarkDiscoverSeen();
    const { stop } = usePreviewActions();

    // Visiting the page is what counts as reading the feed, so the badge clears here.
    useEffect(() => {
        markSeen(rows.flatMap((row) => row.items.map((item) => item.id)));
    }, [rows, markSeen]);

    // A preview is tied to the cards that started it; leaving should not keep it sounding.
    useEffect(() => stop, [stop]);

    return (
        <AnimatedPage>
            <NativeScrollArea
                pageHeaderProps={{
                    backgroundColor: 'var(--theme-colors-background)',
                    children: (
                        <LibraryHeaderBar>
                            <LibraryHeaderBar.Title>
                                {t('page.discover.title')}
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
                        ref={containerQuery.ref}
                    >
                        {!username && (
                            <Center>
                                <Stack align="center" gap="sm">
                                    <Text size="lg">{t('page.discover.setupTitle')}</Text>
                                    <Text isMuted size="md">
                                        {t('page.discover.setupDescription')}
                                    </Text>
                                </Stack>
                            </Center>
                        )}
                        {username && isPending && (
                            <>
                                <Center>
                                    <Stack align="center" gap="sm">
                                        <Text size="md">
                                            {t('page.discover.loadingProgress', {
                                                ready: progress.ready,
                                                total: progress.total,
                                            })}
                                        </Text>
                                        {isIndexing && (
                                            <Text isMuted size="sm" style={{ maxWidth: '32rem' }}>
                                                {t('page.discover.loadingLibrary')}
                                            </Text>
                                        )}
                                        {progress.failed > 0 && (
                                            <Text isMuted size="sm">
                                                {t('page.discover.loadingSlow')}
                                            </Text>
                                        )}
                                    </Stack>
                                </Center>
                                {/* Placeholders rather than a spinner: this wait runs to tens of
                                    seconds, and showing the page's shape reads as loading where a
                                    spinner reads as a hang. */}
                                <DiscoverSkeleton />
                            </>
                        )}
                        {username && !isPending && isError && rows.length === 0 && (
                            <Center>
                                <Text isMuted size="md">
                                    {t('page.discover.unavailable')}
                                </Text>
                            </Center>
                        )}
                        {rows.map((row) => {
                            if (row.layout === 'feature') {
                                return (
                                    <DiscoverFeatureCarousel
                                        items={row.items}
                                        key={row.key}
                                        title={row.title}
                                    />
                                );
                            }

                            if (row.layout === 'table') {
                                return (
                                    <DiscoverTrackTable
                                        items={row.items}
                                        key={row.key}
                                        title={row.title}
                                    />
                                );
                            }

                            return (
                                <DiscoverCarousel
                                    containerQuery={containerQuery}
                                    isArtist={row.isArtist}
                                    items={row.items}
                                    key={row.key}
                                    rowCount={row.rowCount}
                                    title={row.title}
                                />
                            );
                        })}
                        {/* Rows appear as they arrive, so say that more are still coming rather
                            than letting the page look finished when it is not. */}
                        {rows.length > 0 && progress.loading > 0 && (
                            <Center>
                                <Stack align="center" gap="sm">
                                    <Spinner size={20} />
                                    <Text isMuted size="sm">
                                        {t('page.discover.loadingProgress', {
                                            ready: progress.ready,
                                            total: progress.total,
                                        })}
                                    </Text>
                                </Stack>
                            </Center>
                        )}
                    </Stack>
                </LibraryContainer>
            </NativeScrollArea>
        </AnimatedPage>
    );
};

const DiscoverRouteWithBoundary = () => {
    return (
        <PageErrorBoundary>
            <Suspense fallback={<Spinner container />}>
                <DiscoverRoute />
            </Suspense>
        </PageErrorBoundary>
    );
};

export default DiscoverRouteWithBoundary;
