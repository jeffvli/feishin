import { Suspense, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { useGridCarouselContainerQuery } from '/@/renderer/components/grid-carousel/grid-carousel-v2';
import { NativeScrollArea } from '/@/renderer/components/native-scroll-area/native-scroll-area';
import { DiscoverCarousel } from '/@/renderer/features/discover/components/discover-carousel';
import { DiscoverFeatureCarousel } from '/@/renderer/features/discover/components/discover-feature-carousel';
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
import { Progress } from '/@/shared/components/progress/progress';
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
    const { history, isError, isIndexing, isPending, library, progress, rows } =
        useDiscoverData(username);
    const markSeen = useMarkDiscoverSeen();
    const { stop } = usePreviewActions();
    const sync = useDiscoverSync();

    // The live pass when one is running, the stored index when one is not. See the bar below.
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
                        {username && isPending && (
                            <>
                                <Center>
                                    <Stack
                                        align="center"
                                        gap="sm"
                                        style={{ maxWidth: '32rem', width: '100%' }}
                                    >
                                        <Text size="md">
                                            {t('page.discover.loadingProgress', {
                                                ready: progress.ready,
                                                total: progress.total,
                                            })}
                                        </Text>
                                        {isIndexing && !isReadingHistory && (
                                            <Text isMuted size="sm">
                                                {t('page.discover.loadingLibrary')}
                                            </Text>
                                        )}
                                        {/* The history walk is the only wait measured in minutes,
                                            so it is the only one that gets a bar and a count
                                            rather than a sentence. It runs as a series of bounded
                                            passes with a gap between them, and the count has to
                                            survive those gaps: the live sync store empties when a
                                            pass ends, so the stored index is what the bar falls
                                            back to. Without that the page spends most of the wait
                                            showing nothing at all. */}
                                        {isReadingHistory && (
                                            <>
                                                <Text
                                                    isMuted
                                                    size="sm"
                                                    style={{ textAlign: 'center' }}
                                                >
                                                    {historyTotal === 0
                                                        ? t('page.discover.loadingHistoryStart')
                                                        : sync.etaSeconds !== null
                                                          ? t('page.discover.loadingHistory', {
                                                                done: historyDone.toLocaleString(),
                                                                eta: formatEta(sync.etaSeconds),
                                                                total: historyTotal.toLocaleString(),
                                                            })
                                                          : t('page.discover.loadingHistoryPass', {
                                                                done: historyDone.toLocaleString(),
                                                                total: historyTotal.toLocaleString(),
                                                            })}
                                                </Text>
                                                {historyTotal > 0 && (
                                                    <Progress
                                                        size="sm"
                                                        style={{ width: '100%' }}
                                                        value={(historyDone / historyTotal) * 100}
                                                    />
                                                )}
                                            </>
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
                            second. Without a line saying which, the page cannot be read. */}
                        {username && rows.length > 0 && (
                            <Center pb="3rem" pt="1rem">
                                <Text isMuted size="sm" style={{ textAlign: 'center' }}>
                                    {t('page.discover.libraryFiltered', {
                                        tracks: library.trackCount.toLocaleString(),
                                    })}
                                    {history.isUnavailable
                                        ? t('page.discover.historyUnavailable')
                                        : ` ${t('page.discover.historyReady', {
                                              tracks: history.trackKeyCount.toLocaleString(),
                                          })}`}
                                </Text>
                            </Center>
                        )}
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

/**
 * A duration a reader can act on, rather than a number of seconds.
 *
 * Rounded up to the minute above a minute, because an estimate that counts down in single
 * seconds over a seven minute wait invites watching it, and its own accuracy does not justify
 * that much precision.
 */
function formatEta(seconds: number): string {
    if (seconds < 60) {
        return `${Math.max(1, seconds)}s`;
    }

    return `${Math.ceil(seconds / 60)} min`;
}

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
