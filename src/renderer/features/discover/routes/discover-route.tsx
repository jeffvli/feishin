import { Suspense, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { useGridCarouselContainerQuery } from '/@/renderer/components/grid-carousel/grid-carousel-v2';
import { NativeScrollArea } from '/@/renderer/components/native-scroll-area/native-scroll-area';
import { DiscoverCarousel } from '/@/renderer/features/discover/components/discover-carousel';
import { DiscoverFeatureCarousel } from '/@/renderer/features/discover/components/discover-feature-carousel';
import { DiscoverHistoryBanner } from '/@/renderer/features/discover/components/discover-history-banner';
import { DiscoverNews } from '/@/renderer/features/discover/components/discover-news';
import { DiscoverSkeleton } from '/@/renderer/features/discover/components/discover-skeleton';
import { DiscoverSpotlight } from '/@/renderer/features/discover/components/discover-spotlight';
import { useDiscoverSync } from '/@/renderer/features/discover/discover-sync-store';
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
    const { history, isError, isPending, library, progress, rows } = useDiscoverData(username);
    const markSeen = useMarkDiscoverSeen();
    const { stop } = usePreviewActions();
    const sync = useDiscoverSync();

    // The live pass when one is running, the stored index when one is not. The walk runs as
    // bounded passes with a gap between them and the sync store empties when a pass ends, so
    // without the stored fallback the banner would blank for most of the wait.
    const isReadingHistory = !history.isComplete && !history.isUnavailable;
    const historyDone = sync.phase === 'history' ? sync.done : history.indexedCount;
    const historyTotal = sync.total || history.listenCount;

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
                        {/* Only the library index blanks the page now, so it is the only wait
                            this block explains. The history walk is far longer but no longer
                            holds anything back, and it reports itself in the banner below,
                            alongside the rows it is describing. */}
                        {username && isPending && (
                            <>
                                {(!library.isReady || progress.failed > 0) && (
                                    <Center>
                                        <Stack
                                            align="center"
                                            gap="sm"
                                            style={{ maxWidth: '32rem', width: '100%' }}
                                        >
                                            {!library.isReady && (
                                                <Text
                                                    isMuted
                                                    size="sm"
                                                    style={{ textAlign: 'center' }}
                                                >
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
                                )}
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
                        {/* Above the rows, because it is a caveat on all of them and a reader who
                            meets it after scrolling four carousels has already formed a view of
                            why a familiar track is there. */}
                        {username && rows.length > 0 && isReadingHistory && (
                            <DiscoverHistoryBanner
                                done={historyDone}
                                etaSeconds={sync.etaSeconds}
                                total={historyTotal}
                            />
                        )}
                        {rows.map((row) => {
                            if (row.layout === 'spotlight' && row.album) {
                                return (
                                    <DiscoverSpotlight
                                        album={row.album}
                                        key={row.key}
                                        title={row.title}
                                    />
                                );
                            }

                            if (row.layout === 'feature') {
                                return (
                                    <DiscoverFeatureCarousel
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
                        {/* Stated on every visit rather than only when something is wrong.
                            Rows render on a complete history and on a failed one alike, and the
                            two produce very different pages: a short row means "you have heard
                            nearly all of this" in the first case and nothing at all in the
                            second. Without a line saying which, the page cannot be read.

                            The played-tracks half is claimed only once the walk has finished.
                            While it is still running the banner above is describing the same
                            filter in its unfinished state, and a count here would read as a
                            second, settled answer to the question it has just raised. */}
                        {username && rows.length > 0 && (
                            <Center pb="3rem" pt="1rem">
                                <Text isMuted size="sm" style={{ textAlign: 'center' }}>
                                    {history.isComplete || history.isUnavailable
                                        ? t('page.discover.libraryFiltered', {
                                              tracks: library.trackCount.toLocaleString(),
                                          })
                                        : t('page.discover.libraryFilteredOnly', {
                                              tracks: library.trackCount.toLocaleString(),
                                          })}
                                    {history.isUnavailable && t('page.discover.historyUnavailable')}
                                    {history.isComplete &&
                                        ` ${t('page.discover.historyReady', {
                                            tracks: history.trackKeyCount.toLocaleString(),
                                        })}`}
                                </Text>
                            </Center>
                        )}
                        {/* Rows appear as they arrive, so say that more are still coming rather
                            than letting the page look finished when it is not. A spinner alone:
                            the count it used to carry was of internal sources, which is not a
                            unit the reader has any use for. */}
                        {rows.length > 0 && progress.loading > 0 && (
                            <Center>
                                <Spinner size={20} />
                            </Center>
                        )}
                        {/* Last, and outside everything above it. The rows are recommendations
                            and the footnote describes how they were filtered; this is neither,
                            so it closes the page rather than joining that block. Gated on the
                            username only so the library index is not built for a Discover page
                            that has not been set up yet. It hides itself when nothing matches. */}
                        {username && <DiscoverNews />}
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
