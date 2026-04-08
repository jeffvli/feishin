import type { TableScrollShadowStore } from '/@/renderer/components/item-list/item-table-list/table-scroll-shadow-store';

import { autoScrollForElements } from '@atlaskit/pragmatic-drag-and-drop-auto-scroll/element';
import throttle from 'lodash/throttle';
import { useOverlayScrollbars } from 'overlayscrollbars-react';
import { useEffect } from 'react';

import { ItemListStateActions } from '/@/renderer/components/item-list/helpers/item-list-state';

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
    ]);

    useEffect(() => {
        const header = pinnedRowRef.current?.childNodes[0] as HTMLDivElement;
        const row = rowRef.current?.childNodes[0] as HTMLDivElement;
        const pinnedLeft = pinnedLeftColumnRef.current?.childNodes[0] as HTMLDivElement;
        const pinnedRight = pinnedRightColumnRef.current?.childNodes[0] as HTMLDivElement;

        if (!row) return;

        // Ensure all containers have the same height
        const syncHeights = () => {
            const rowHeight = row.scrollHeight;
            let targetHeight = rowHeight;

            if (pinnedLeft) {
                const pinnedLeftHeight = pinnedLeft.scrollHeight;
                targetHeight = Math.max(targetHeight, pinnedLeftHeight);
            }

            if (pinnedRight) {
                const pinnedRightHeight = pinnedRight.scrollHeight;
                targetHeight = Math.max(targetHeight, pinnedRightHeight);
            }

            if (pinnedLeft && pinnedLeft.style.height !== `${targetHeight}px`) {
                pinnedLeft.style.height = `${targetHeight}px`;
            }
            if (pinnedRight && pinnedRight.style.height !== `${targetHeight}px`) {
                pinnedRight.style.height = `${targetHeight}px`;
            }
            if (row.style.height !== `${targetHeight}px`) {
                row.style.height = `${targetHeight}px`;
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

                const hasRightPinnedColumns = pinnedRightColumnCount > 0;
                const scrollElement = hasRightPinnedColumns && pinnedRight ? pinnedRight : row;

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

            const shouldSync =
                currentElement === activeElement.element || scrollingElements.has(currentElement);
            if (!shouldSync) return;

            const scrollTop = (e.currentTarget as HTMLDivElement).scrollTop;
            const scrollLeft = (e.currentTarget as HTMLDivElement).scrollLeft;

            const isScrolling = {
                header: false,
                pinnedLeft: false,
                pinnedRight: false,
                row: false,
            };

            const hasRightPinnedColumns = pinnedRightColumnCount > 0;

            if (header && e.currentTarget === header && !isScrolling.row) {
                isScrolling.row = true;
                row.scrollTo({ behavior: 'instant', left: scrollLeft });
                isScrolling.row = false;
            }

            if (
                e.currentTarget === row &&
                !isScrolling.header &&
                !isScrolling.pinnedLeft &&
                !isScrolling.pinnedRight
            ) {
                if (header) {
                    isScrolling.header = true;
                    header.scrollTo({ behavior: 'instant', left: scrollLeft });
                }
                if (hasRightPinnedColumns && pinnedRight) {
                    isScrolling.pinnedRight = true;
                    pinnedRight.scrollTo({ behavior: 'instant', top: scrollTop });
                    isScrolling.pinnedRight = false;
                } else {
                    if (pinnedLeft) {
                        isScrolling.pinnedLeft = true;
                        pinnedLeft.scrollTo({ behavior: 'instant', top: scrollTop });
                    }
                    if (pinnedRight) {
                        isScrolling.pinnedRight = true;
                        pinnedRight.scrollTo({ behavior: 'instant', top: scrollTop });
                    }
                }
                isScrolling.header = false;
                isScrolling.pinnedLeft = false;
            }

            if (pinnedLeft && e.currentTarget === pinnedLeft && !isScrolling.row) {
                if (hasRightPinnedColumns && pinnedRight) {
                    isScrolling.pinnedRight = true;
                    pinnedRight.scrollTo({ behavior: 'instant', top: scrollTop });
                    isScrolling.pinnedRight = false;
                } else {
                    isScrolling.row = true;
                    row.scrollTo({ behavior: 'instant', top: scrollTop });
                    isScrolling.row = false;
                }
            }

            if (pinnedRight && e.currentTarget === pinnedRight && !isScrolling.row) {
                isScrolling.row = true;
                row.scrollTo({ behavior: 'instant', top: scrollTop });
                isScrolling.row = false;
                if (pinnedLeft) {
                    isScrolling.pinnedLeft = true;
                    pinnedLeft.scrollTo({ behavior: 'instant', top: scrollTop });
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

        return () => {
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
    }, [
        handleRef,
        onScrollEndRef,
        pinnedLeftColumnCount,
        pinnedLeftColumnRef,
        pinnedRightColumnCount,
        pinnedRightColumnRef,
        pinnedRowRef,
        rowRef,
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
