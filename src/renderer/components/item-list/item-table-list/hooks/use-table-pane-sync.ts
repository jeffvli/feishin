import type { TableScrollShadowStore } from '/@/renderer/components/item-list/item-table-list/table-scroll-shadow-store';

import { autoScrollForElements } from '@atlaskit/pragmatic-drag-and-drop-auto-scroll/element';
import throttle from 'lodash/throttle';
import { useOverlayScrollbars } from 'overlayscrollbars-react';
import { useEffect } from 'react';

import { ItemListStateActions } from '/@/renderer/components/item-list/helpers/item-list-state';

const getPaneScrollViewport = (ref: React.RefObject<HTMLDivElement | null>) =>
    ref.current?.firstElementChild as HTMLDivElement | undefined;

const getPaneElements = ({
    pinnedLeftColumnRef,
    pinnedRightColumnRef,
    pinnedRowRef,
    rowRef,
}: {
    pinnedLeftColumnRef: React.RefObject<HTMLDivElement | null>;
    pinnedRightColumnRef: React.RefObject<HTMLDivElement | null>;
    pinnedRowRef: React.RefObject<HTMLDivElement | null>;
    rowRef: React.RefObject<HTMLDivElement | null>;
}) => ({
    header: getPaneScrollViewport(pinnedRowRef),
    pinnedLeft: getPaneScrollViewport(pinnedLeftColumnRef),
    pinnedRight: getPaneScrollViewport(pinnedRightColumnRef),
    row: getPaneScrollViewport(rowRef),
});

export const useTablePaneSync = ({
    enableDrag,
    enableDragScroll,
    enableHeader,
    handleRef,
    onScrollEndRef,
    pinnedLeftColumnCount,
    pinnedLeftColumnRef,
    pinnedRightColumnCount,
    pinnedRightColumnRef,
    pinnedRowRef,
    rowRef,
    scrollContainerRef,
    scrollShadowStore,
    scrollSyncKey,
}: {
    enableDrag: boolean | undefined;
    enableDragScroll: boolean | undefined;
    enableHeader: boolean;
    handleRef: React.RefObject<null | { internalState: ItemListStateActions }>;
    onScrollEndRef: React.RefObject<
        ((offset: number, internalState: ItemListStateActions) => void) | undefined
    >;
    pinnedLeftColumnCount: number;
    pinnedLeftColumnRef: React.RefObject<HTMLDivElement | null>;
    pinnedRightColumnCount: number;
    pinnedRightColumnRef: React.RefObject<HTMLDivElement | null>;
    pinnedRowRef: React.RefObject<HTMLDivElement | null>;
    rowRef: React.RefObject<HTMLDivElement | null>;
    scrollContainerRef: React.RefObject<HTMLDivElement | null>;
    scrollShadowStore: TableScrollShadowStore;
    scrollSyncKey: string;
}) => {
    // Main grid overlayscrollbars - only handle X-axis if right-pinned columns exist
    const [initialize, osInstance] = useOverlayScrollbars({
        defer: false,
        events: {
            initialized(osInstance) {
                const { viewport } = osInstance.elements();
                viewport.style.overflowX = `var(--os-viewport-overflow-x)`;

                if (pinnedRightColumnCount > 0) {
                    viewport.style.overflowY = 'auto';
                } else {
                    viewport.style.overflowY = `var(--os-viewport-overflow-y)`;
                }
            },
        },
        options: {
            overflow: {
                x: 'scroll',
                y: pinnedRightColumnCount > 0 ? 'hidden' : 'scroll',
            },
            paddingAbsolute: true,
            scrollbars: {
                autoHide: 'leave',
                autoHideDelay: 500,
                pointers: ['mouse', 'pen', 'touch'],
                theme: 'feishin-os-scrollbar',
            },
        },
    });

    // Right pinned columns overlayscrollbars - enable Y-axis scroll when right-pinned columns exist
    const [initializeRightPinned, osInstanceRightPinned] = useOverlayScrollbars({
        defer: false,
        events: {
            initialized(osInstance) {
                const { viewport } = osInstance.elements();
                viewport.style.overflowX = `var(--os-viewport-overflow-x)`;
                viewport.style.overflowY = `var(--os-viewport-overflow-y)`;
            },
        },
        options: {
            overflow: { x: 'hidden', y: 'scroll' },
            paddingAbsolute: true,
            scrollbars: {
                autoHide: 'leave',
                autoHideDelay: 500,
                pointers: ['mouse', 'pen', 'touch'],
                theme: 'feishin-os-scrollbar',
            },
        },
    });

    useEffect(() => {
        const { current: root } = scrollContainerRef;

        if (!root || !root.firstElementChild) {
            return;
        }

        const viewport = root.firstElementChild as HTMLElement;

        initialize({
            elements: { viewport },
            target: root,
        });

        let autoScrollCleanup: (() => void) | null = null;
        if (enableDrag && enableDragScroll) {
            autoScrollCleanup = autoScrollForElements({
                canScroll: () => true,
                element: viewport,
                getAllowedAxis: () => 'vertical',
                getConfiguration: () => ({ maxScrollSpeed: 'fast' }),
            });
        }

        return () => {
            if (autoScrollCleanup) {
                autoScrollCleanup();
            }

            try {
                const instance = osInstance();
                const { current: root } = scrollContainerRef;

                if (instance && root) {
                    const viewport = root.firstElementChild as HTMLElement;

                    const rootInDocument = document.contains(root);
                    const viewportInDocument = viewport && document.contains(viewport);

                    if (rootInDocument && viewportInDocument) {
                        instance.destroy();
                    }
                }
            } catch {
                // Ignore error
            }
        };
    }, [
        enableDrag,
        enableDragScroll,
        initialize,
        osInstance,
        pinnedRightColumnCount,
        scrollContainerRef,
        scrollSyncKey,
    ]);

    useEffect(() => {
        if (pinnedLeftColumnCount === 0) {
            return;
        }

        const { current: root } = pinnedLeftColumnRef;

        if (!root || !root.firstElementChild) {
            return;
        }

        const viewport = root.firstElementChild as HTMLElement;

        let autoScrollCleanup: (() => void) | null = null;
        if (enableDrag && enableDragScroll) {
            autoScrollCleanup = autoScrollForElements({
                canScroll: () => true,
                element: viewport,
                getAllowedAxis: () => 'vertical',
                getConfiguration: () => ({ maxScrollSpeed: 'fast' }),
            });
        }

        return () => {
            if (autoScrollCleanup) {
                autoScrollCleanup();
            }
        };
    }, [enableDrag, enableDragScroll, pinnedLeftColumnCount, pinnedLeftColumnRef]);

    // Initialize overlayscrollbars for right pinned columns
    useEffect(() => {
        if (pinnedRightColumnCount === 0) {
            return;
        }

        const { current: root } = pinnedRightColumnRef;

        if (!root || !root.firstElementChild) {
            return;
        }

        const viewport = root.firstElementChild as HTMLElement;

        initializeRightPinned({
            elements: { viewport },
            target: root,
        });

        let autoScrollCleanup: (() => void) | null = null;
        if (enableDrag && enableDragScroll) {
            autoScrollCleanup = autoScrollForElements({
                canScroll: () => true,
                element: viewport,
                getAllowedAxis: () => 'vertical',
                getConfiguration: () => ({ maxScrollSpeed: 'fast' }),
            });
        }

        return () => {
            if (autoScrollCleanup) {
                autoScrollCleanup();
            }

            try {
                const instance = osInstanceRightPinned();
                const { current: root } = pinnedRightColumnRef;

                if (instance && root) {
                    const viewport = root.firstElementChild as HTMLElement;

                    const rootInDocument = document.contains(root);
                    const viewportInDocument = viewport && document.contains(viewport);

                    if (rootInDocument && viewportInDocument) {
                        instance.destroy();
                    }
                }
            } catch {
                // Ignore error
            }
        };
    }, [
        enableDrag,
        enableDragScroll,
        initializeRightPinned,
        osInstanceRightPinned,
        pinnedRightColumnCount,
        pinnedRightColumnRef,
        scrollSyncKey,
    ]);

    useEffect(() => {
        let disposed = false;
        let cleanup: (() => void) | undefined;
        let setupFrameId = 0;

        const resolvePaneRefs = () =>
            getPaneElements({
                pinnedLeftColumnRef,
                pinnedRightColumnRef,
                pinnedRowRef,
                rowRef,
            });

        const isVerticalScrollHostReady = (
            row: HTMLDivElement,
            pinnedRight: HTMLDivElement | undefined,
        ) => {
            const verticalScrollHost = pinnedRightColumnCount > 0 ? pinnedRight : row;

            if (!verticalScrollHost) {
                return false;
            }

            if (pinnedRightColumnCount > 0) {
                return verticalScrollHost.scrollHeight > verticalScrollHost.clientHeight;
            }

            return verticalScrollHost.scrollHeight > 0;
        };

        const setupScrollSync = () => {
            if (disposed) {
                return;
            }

            cleanup?.();

            const { header, pinnedLeft, pinnedRight, row } = resolvePaneRefs();

            if (!row || !isVerticalScrollHostReady(row, pinnedRight)) {
                setupFrameId = requestAnimationFrame(setupScrollSync);
                return;
            }

            const syncHeights = () => {
                const panes = resolvePaneRefs();
                const syncRow = panes.row;
                const syncPinnedLeft = panes.pinnedLeft;
                const syncPinnedRight = panes.pinnedRight;

                if (!syncRow) {
                    return;
                }

                const rowHeight = syncRow.scrollHeight;
                let targetHeight = rowHeight;

                if (syncPinnedLeft) {
                    targetHeight = Math.max(targetHeight, syncPinnedLeft.scrollHeight);
                }

                if (syncPinnedRight) {
                    targetHeight = Math.max(targetHeight, syncPinnedRight.scrollHeight);
                }

                if (targetHeight <= 0) {
                    return;
                }

                if (syncPinnedLeft && syncPinnedLeft.style.height !== `${targetHeight}px`) {
                    syncPinnedLeft.style.height = `${targetHeight}px`;
                }
                if (syncPinnedRight && syncPinnedRight.style.height !== `${targetHeight}px`) {
                    syncPinnedRight.style.height = `${targetHeight}px`;
                }
                if (rowHeight > 0 && syncRow.style.height !== `${targetHeight}px`) {
                    syncRow.style.height = `${targetHeight}px`;
                }
            };

            const timeoutId = setTimeout(syncHeights, 0);

            const activeElement = { element: null } as { element: HTMLDivElement | null };
            const scrollingElements = new Set<HTMLDivElement>();
            const scrollTimeouts = new Map<HTMLDivElement, NodeJS.Timeout>();

            const setActiveElement = (e: HTMLElementEventMap['pointermove']) => {
                activeElement.element = e.currentTarget as HTMLDivElement;
            };
            const setActiveElementFromWheel = (e: HTMLElementEventMap['wheel']) => {
                activeElement.element = e.currentTarget as HTMLDivElement;
            };

            const markElementAsScrolling = (element: HTMLDivElement) => {
                scrollingElements.add(element);

                const existingTimeout = scrollTimeouts.get(element);
                if (existingTimeout) {
                    clearTimeout(existingTimeout);
                }

                const timeout = setTimeout(() => {
                    scrollingElements.delete(element);

                    const panes = resolvePaneRefs();
                    const hasRightPinnedColumns = pinnedRightColumnCount > 0;
                    const scrollElement =
                        hasRightPinnedColumns && panes.pinnedRight ? panes.pinnedRight : panes.row;

                    if (scrollElement && onScrollEndRef.current) {
                        onScrollEndRef.current(
                            scrollElement.scrollTop,
                            (handleRef.current?.internalState ??
                                (undefined as any)) as ItemListStateActions,
                        );
                    }

                    scrollTimeouts.delete(element);
                }, 150);

                scrollTimeouts.set(element, timeout);
            };

            const syncScroll = (e: HTMLElementEventMap['scroll']) => {
                const currentElement = e.currentTarget as HTMLDivElement;
                markElementAsScrolling(currentElement);

                const panes = resolvePaneRefs();
                const syncHeader = panes.header;
                const syncRow = panes.row;
                const syncPinnedLeft = panes.pinnedLeft;
                const syncPinnedRight = panes.pinnedRight;

                if (!syncRow) {
                    return;
                }

                const shouldSync =
                    currentElement === activeElement.element ||
                    scrollingElements.has(currentElement);

                if (!shouldSync) return;

                const scrollTop = currentElement.scrollTop;
                const scrollLeft = currentElement.scrollLeft;

                const isScrolling = {
                    header: false,
                    pinnedLeft: false,
                    pinnedRight: false,
                    row: false,
                };

                const hasRightPinnedColumns = pinnedRightColumnCount > 0;

                if (syncHeader && currentElement === syncHeader && !isScrolling.row) {
                    isScrolling.row = true;
                    syncRow.scrollTo({ behavior: 'instant', left: scrollLeft });
                    isScrolling.row = false;
                }

                if (
                    currentElement === syncRow &&
                    !isScrolling.header &&
                    !isScrolling.pinnedLeft &&
                    !isScrolling.pinnedRight
                ) {
                    if (syncHeader) {
                        isScrolling.header = true;
                        syncHeader.scrollTo({ behavior: 'instant', left: scrollLeft });
                    }
                    if (hasRightPinnedColumns && syncPinnedRight) {
                        isScrolling.pinnedRight = true;
                        syncPinnedRight.scrollTo({ behavior: 'instant', top: scrollTop });
                        isScrolling.pinnedRight = false;
                    } else {
                        if (syncPinnedLeft) {
                            isScrolling.pinnedLeft = true;
                            syncPinnedLeft.scrollTo({ behavior: 'instant', top: scrollTop });
                        }
                        if (syncPinnedRight) {
                            isScrolling.pinnedRight = true;
                            syncPinnedRight.scrollTo({ behavior: 'instant', top: scrollTop });
                        }
                    }
                    isScrolling.header = false;
                    isScrolling.pinnedLeft = false;
                }

                if (syncPinnedLeft && currentElement === syncPinnedLeft && !isScrolling.row) {
                    if (hasRightPinnedColumns && syncPinnedRight) {
                        isScrolling.pinnedRight = true;
                        syncPinnedRight.scrollTo({ behavior: 'instant', top: scrollTop });
                        isScrolling.pinnedRight = false;
                    } else {
                        isScrolling.row = true;
                        syncRow.scrollTo({ behavior: 'instant', top: scrollTop });
                        isScrolling.row = false;
                    }
                }

                if (syncPinnedRight && currentElement === syncPinnedRight && !isScrolling.row) {
                    isScrolling.row = true;
                    syncRow.scrollTo({ behavior: 'instant', top: scrollTop });
                    isScrolling.row = false;
                    if (syncPinnedLeft) {
                        isScrolling.pinnedLeft = true;
                        syncPinnedLeft.scrollTo({ behavior: 'instant', top: scrollTop });
                        isScrolling.pinnedLeft = false;
                    }
                }
            };

            if (header) {
                header.addEventListener('pointermove', setActiveElement);
                header.addEventListener('wheel', setActiveElementFromWheel);
                header.addEventListener('scroll', syncScroll);
            }
            row.addEventListener('pointermove', setActiveElement);
            row.addEventListener('wheel', setActiveElementFromWheel);
            row.addEventListener('scroll', syncScroll);
            if (pinnedLeft) {
                pinnedLeft.addEventListener('pointermove', setActiveElement);
                pinnedLeft.addEventListener('wheel', setActiveElementFromWheel);
                pinnedLeft.addEventListener('scroll', syncScroll);
            }
            if (pinnedRight) {
                pinnedRight.addEventListener('pointermove', setActiveElement);
                pinnedRight.addEventListener('wheel', setActiveElementFromWheel);
                pinnedRight.addEventListener('scroll', syncScroll);
            }

            let heightSyncDebounceTimeout: NodeJS.Timeout | null = null;
            const resizeObserver = new ResizeObserver(() => {
                if (heightSyncDebounceTimeout) {
                    clearTimeout(heightSyncDebounceTimeout);
                }
                heightSyncDebounceTimeout = setTimeout(() => {
                    syncHeights();
                }, 100);
            });

            resizeObserver.observe(row);
            if (pinnedLeft) resizeObserver.observe(pinnedLeft);
            if (pinnedRight) resizeObserver.observe(pinnedRight);

            cleanup = () => {
                clearTimeout(timeoutId);
                scrollTimeouts.forEach((timeout) => clearTimeout(timeout));
                scrollTimeouts.clear();
                scrollingElements.clear();

                if (header) {
                    header.removeEventListener('pointermove', setActiveElement);
                    header.removeEventListener('wheel', setActiveElementFromWheel);
                    header.removeEventListener('scroll', syncScroll);
                }
                row.removeEventListener('pointermove', setActiveElement);
                row.removeEventListener('wheel', setActiveElementFromWheel);
                row.removeEventListener('scroll', syncScroll);
                if (pinnedLeft) {
                    pinnedLeft.removeEventListener('pointermove', setActiveElement);
                    pinnedLeft.removeEventListener('wheel', setActiveElementFromWheel);
                    pinnedLeft.removeEventListener('scroll', syncScroll);
                }
                if (pinnedRight) {
                    pinnedRight.removeEventListener('pointermove', setActiveElement);
                    pinnedRight.removeEventListener('wheel', setActiveElementFromWheel);
                    pinnedRight.removeEventListener('scroll', syncScroll);
                }
                if (heightSyncDebounceTimeout) {
                    clearTimeout(heightSyncDebounceTimeout);
                }
                resizeObserver.disconnect();
            };
        };

        setupFrameId = requestAnimationFrame(() => {
            setupFrameId = requestAnimationFrame(setupScrollSync);
        });

        return () => {
            disposed = true;
            cancelAnimationFrame(setupFrameId);
            cleanup?.();
        };
    }, [
        handleRef,
        onScrollEndRef,
        pinnedLeftColumnCount,
        pinnedLeftColumnRef,
        pinnedRightColumnCount,
        pinnedRightColumnRef,
        pinnedRowRef,
        rowRef,
        scrollSyncKey,
    ]);

    // Handle left and right shadow visibility based on horizontal scroll
    useEffect(() => {
        const row = rowRef.current?.childNodes[0] as HTMLDivElement;

        if (!row) {
            const timeout = setTimeout(() => {
                scrollShadowStore.setSnapshot({
                    showLeftShadow: false,
                    showRightShadow: false,
                });
            }, 0);

            return () => clearTimeout(timeout);
        }

        const checkScrollPosition = throttle(() => {
            const scrollLeft = row.scrollLeft;
            const maxScrollLeft = row.scrollWidth - row.clientWidth;

            scrollShadowStore.setSnapshot({
                showLeftShadow: pinnedLeftColumnCount > 0 && scrollLeft > 0,
                showRightShadow: pinnedRightColumnCount > 0 && scrollLeft < maxScrollLeft,
            });
        }, 50);

        checkScrollPosition();

        row.addEventListener('scroll', checkScrollPosition, { passive: true });

        return () => {
            checkScrollPosition.cancel();
            row.removeEventListener('scroll', checkScrollPosition);
        };
    }, [pinnedLeftColumnCount, pinnedRightColumnCount, rowRef, scrollShadowStore]);

    // Handle top shadow visibility based on vertical scroll
    useEffect(() => {
        const row = rowRef.current?.childNodes[0] as HTMLDivElement;
        const pinnedRight = pinnedRightColumnRef.current?.childNodes[0] as HTMLDivElement;

        if (!row || !enableHeader) {
            const timeout = setTimeout(() => {
                scrollShadowStore.setSnapshot({ showTopShadow: false });
            }, 0);

            return () => clearTimeout(timeout);
        }

        const scrollElement = pinnedRightColumnCount > 0 && pinnedRight ? pinnedRight : row;

        const checkScrollPosition = throttle(() => {
            const currentScrollTop = scrollElement.scrollTop;
            scrollShadowStore.setSnapshot({ showTopShadow: currentScrollTop > 0 });
        }, 50);

        checkScrollPosition();

        scrollElement.addEventListener('scroll', checkScrollPosition, { passive: true });

        return () => {
            checkScrollPosition.cancel();
            scrollElement.removeEventListener('scroll', checkScrollPosition);
        };
    }, [enableHeader, pinnedRightColumnCount, pinnedRightColumnRef, rowRef, scrollShadowStore]);
};
