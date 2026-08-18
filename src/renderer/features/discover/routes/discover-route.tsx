import { Suspense, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { useGridCarouselContainerQuery } from '/@/renderer/components/grid-carousel/grid-carousel-v2';
import { NativeScrollArea } from '/@/renderer/components/native-scroll-area/native-scroll-area';
import { DiscoverCarousel } from '/@/renderer/features/discover/components/discover-carousel';
import { DiscoverFeatureCarousel } from '/@/renderer/features/discover/components/discover-feature-carousel';
import { DiscoverHistoryBanner } from '/@/renderer/features/discover/components/discover-history-banner';
import { DiscoverNews } from '/@/renderer/features/discover/components/discover-news';
import { DiscoverSkeleton } from '/@/renderer/features/discover/components/discover-skeleton';
import { DiscoverSocial } from '/@/renderer/features/discover/components/discover-social';
import { DiscoverSpotlight } from '/@/renderer/features/discover/components/discover-spotlight';
import { useDiscoverSync } from '/@/renderer/features/discover/discover-sync-store';
import {
    DiscoverRow,
    useDiscoverData,
} from '/@/renderer/features/discover/hooks/use-discover-data';
import { useMarkDiscoverSeen } from '/@/renderer/features/discover/hooks/use-discover-unread';
import { usePreviewActions } from '/@/renderer/features/preview/preview-store';
import { AnimatedPage } from '/@/renderer/features/shared/components/animated-page';
import { LibraryContainer } from '/@/renderer/features/shared/components/library-container';
import { LibraryHeaderBar } from '/@/renderer/features/shared/components/library-header-bar';
import { PageErrorBoundary } from '/@/renderer/features/shared/components/page-error-boundary';
import {
    DiscoverSection,
    useDiscoverItems,
    useDiscoverSettings,
    useWindowSettings,
} from '/@/renderer/store';
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
    const { history, isError, library, progress, rows } = useDiscoverData(username);
    const markSeen = useMarkDiscoverSeen();
    const { stop } = usePreviewActions();
    const sync = useDiscoverSync();
    const sections = useDiscoverItems();

    const visibleSections = useMemo(() => sections.filter((s) => !s.disabled), [sections]);

    /**
     * The rows that are actually going to be drawn, in configured order.
     *
     * Sections the user turned off are dropped here rather than at render, because this list is
     * also what marks items as seen: counting a hidden row's items as read would clear the
     * sidebar badge for suggestions that were never put in front of anyone.
     */
    const visibleRows = useMemo(() => {
        const byKey = new Map(rows.map((row) => [row.key, row]));

        return visibleSections
            .map((section) => byKey.get(section.id))
            .filter((row): row is DiscoverRow => row !== undefined);
    }, [rows, visibleSections]);

    // The live pass when one is running, the stored index when one is not. The walk runs as
    // bounded passes with a gap between them and the sync store empties when a pass ends, so
    // without the stored fallback the banner would blank for most of the wait.
    const isReadingHistory = !history.isComplete && !history.isUnavailable;
    const historyDone = sync.phase === 'history' ? sync.done : history.indexedCount;
    const historyTotal = sync.total || history.listenCount;

    // Visiting the page is what counts as reading the feed, so the badge clears here.
    useEffect(() => {
        markSeen(visibleRows.flatMap((row) => row.items.map((item) => item.id)));
    }, [visibleRows, markSeen]);

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
                            alongside the rows it is describing. The rows themselves each draw
                            their own placeholders, so nothing here stands in for them. */}
                        {username && (!library.isReady || progress.failed > 0) && (
                            <Center>
                                <Stack
                                    align="center"
                                    gap="sm"
                                    style={{ maxWidth: '32rem', width: '100%' }}
                                >
                                    {!library.isReady && (
                                        <Text isMuted size="sm" style={{ textAlign: 'center' }}>
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
                        {username && isError && rows.length === 0 && (
                            <Center>
                                <Text isMuted size="md">
                                    {t('page.discover.unavailable')}
                                </Text>
                            </Center>
                        )}
                        {/* Above the rows, because it is a caveat on all of them and a reader who
                            meets it after scrolling four carousels has already formed a view of
                            why a familiar track is there. */}
                        {username && visibleRows.length > 0 && isReadingHistory && (
                            <DiscoverHistoryBanner
                                done={historyDone}
                                etaSeconds={sync.etaSeconds}
                                total={historyTotal}
                            />
                        )}
                        {/* Order and visibility both come from settings, so the two sections
                            that are not rows are dispatched from the same list as the rows
                            rather than pinned after them. */}
                        {visibleSections.map((section) => {
                            if (section.id === DiscoverSection.SOCIAL) {
                                return username ? (
                                    <DiscoverSocial key={section.id} username={username} />
                                ) : null;
                            }

                            if (section.id === DiscoverSection.NEWS) {
                                // Gated on the username only so the library index is not built
                                // for a Discover page that has not been set up yet. It hides
                                // itself when nothing matches.
                                return username ? <DiscoverNews key={section.id} /> : null;
                            }

                            const row = rows.find((candidate) => candidate.key === section.id);

                            if (!row) {
                                return null;
                            }

                            // A row whose sources are still answering keeps its slot and
                            // draws placeholders. Rendering however much has arrived instead
                            // is what made the page look like it was loading three different
                            // times: each source landing reordered the merge and re-cut the
                            // cap, so the strip was rewritten rather than extended.
                            if (row.isPending) {
                                return <DiscoverSkeleton key={row.key} rowCount={1} />;
                            }

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
