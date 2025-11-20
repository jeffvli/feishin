import { useInView } from 'motion/react';
import { RefObject, useEffect, useMemo, useRef } from 'react';

import { useWindowSettings } from '/@/renderer/store/settings.store';
import { Platform } from '/@/shared/types/types';

export const useStickyTableHeader = ({
    containerRef,
    enabled,
    headerRef,
    mainGridRef,
    pinnedLeftColumnRef,
    pinnedRightColumnRef,
    stickyHeaderMainRef,
}: {
    containerRef: RefObject<HTMLDivElement | null>;
    enabled: boolean;
    headerRef: RefObject<HTMLDivElement | null>;
    mainGridRef?: RefObject<HTMLDivElement | null>;
    pinnedLeftColumnRef?: RefObject<HTMLDivElement | null>;
    pinnedRightColumnRef?: RefObject<HTMLDivElement | null>;
    stickyHeaderMainRef?: RefObject<HTMLDivElement | null>;
}) => {
    const { windowBarStyle } = useWindowSettings();
    const isScrollingRef = useRef({
        main: false,
        pinnedLeft: false,
        pinnedRight: false,
        stickyHeader: false,
    });

    const topMargin =
        windowBarStyle === Platform.WINDOWS || windowBarStyle === Platform.MACOS
            ? '-130px'
            : '-100px';

    const isTableHeaderInView = useInView(headerRef, {
        margin: `${topMargin} 0px 0px 0px`,
    });

    const isTableInView = useInView(containerRef, {
        margin: `${topMargin} 0px 0px 0px`,
    });

    const shouldShowStickyHeader = useMemo(() => {
        return enabled && !isTableHeaderInView && isTableInView;
    }, [enabled, isTableHeaderInView, isTableInView]);

    const stickyTop = useMemo(() => {
        return windowBarStyle === Platform.WINDOWS || windowBarStyle === Platform.MACOS ? 95 : 65;
    }, [windowBarStyle]);

    // Sync scroll between sticky header and main grid/pinned columns
    useEffect(() => {
        if (!shouldShowStickyHeader || !stickyHeaderMainRef?.current || !mainGridRef?.current) {
            return;
        }

        const stickyMainSection = stickyHeaderMainRef.current;
        const mainGrid = mainGridRef.current.childNodes[0] as HTMLDivElement;
        const pinnedLeft = pinnedLeftColumnRef?.current?.childNodes[0] as HTMLDivElement | null;
        const pinnedRight = pinnedRightColumnRef?.current?.childNodes[0] as HTMLDivElement | null;

        if (!mainGrid) {
            return;
        }

        // Sync initial scroll position when sticky header becomes visible
        const syncInitialScroll = () => {
            const scrollLeft = mainGrid.scrollLeft;
            const scrollTop = mainGrid.scrollTop;

            // Sync horizontal scroll position
            stickyMainSection.scrollTo({
                behavior: 'instant',
                left: scrollLeft,
            });

            // Sync vertical scroll position with pinned columns
            if (pinnedLeft) {
                pinnedLeft.scrollTo({
                    behavior: 'instant',
                    top: scrollTop,
                });
            }
            if (pinnedRight) {
                pinnedRight.scrollTo({
                    behavior: 'instant',
                    top: scrollTop,
                });
            }
        };

        // Sync initial position after a frame to ensure elements are ready
        requestAnimationFrame(() => {
            requestAnimationFrame(syncInitialScroll);
        });

        const syncScroll = (e: Event) => {
            const target = e.currentTarget as HTMLDivElement;
            const scrollLeft = target.scrollLeft;
            const scrollTop = target.scrollTop;

            // Sync horizontal scroll from main grid to sticky header main section
            if (target === mainGrid && !isScrollingRef.current.stickyHeader) {
                isScrollingRef.current.stickyHeader = true;
                stickyMainSection.scrollTo({
                    behavior: 'instant',
                    left: scrollLeft,
                });
                isScrollingRef.current.stickyHeader = false;
            }

            // Sync horizontal scroll from sticky header to main grid
            if (target === stickyMainSection && !isScrollingRef.current.main) {
                isScrollingRef.current.main = true;
                mainGrid.scrollTo({
                    behavior: 'instant',
                    left: scrollLeft,
                });
                isScrollingRef.current.main = false;
            }

            // Sync vertical scroll from main grid to pinned columns
            if (target === mainGrid) {
                if (pinnedLeft && !isScrollingRef.current.pinnedLeft) {
                    isScrollingRef.current.pinnedLeft = true;
                    pinnedLeft.scrollTo({
                        behavior: 'instant',
                        top: scrollTop,
                    });
                    isScrollingRef.current.pinnedLeft = false;
                }
                if (pinnedRight && !isScrollingRef.current.pinnedRight) {
                    isScrollingRef.current.pinnedRight = true;
                    pinnedRight.scrollTo({
                        behavior: 'instant',
                        top: scrollTop,
                    });
                    isScrollingRef.current.pinnedRight = false;
                }
            }

            // Sync vertical scroll from pinned columns to main grid
            if (pinnedLeft && target === pinnedLeft && !isScrollingRef.current.main) {
                isScrollingRef.current.main = true;
                mainGrid.scrollTo({
                    behavior: 'instant',
                    top: scrollTop,
                });
                isScrollingRef.current.main = false;
            }

            if (pinnedRight && target === pinnedRight && !isScrollingRef.current.main) {
                isScrollingRef.current.main = true;
                mainGrid.scrollTo({
                    behavior: 'instant',
                    top: scrollTop,
                });
                isScrollingRef.current.main = false;
            }
        };

        mainGrid.addEventListener('scroll', syncScroll);
        stickyMainSection.addEventListener('scroll', syncScroll);
        if (pinnedLeft) {
            pinnedLeft.addEventListener('scroll', syncScroll);
        }
        if (pinnedRight) {
            pinnedRight.addEventListener('scroll', syncScroll);
        }

        return () => {
            mainGrid.removeEventListener('scroll', syncScroll);
            stickyMainSection.removeEventListener('scroll', syncScroll);
            if (pinnedLeft) {
                pinnedLeft.removeEventListener('scroll', syncScroll);
            }
            if (pinnedRight) {
                pinnedRight.removeEventListener('scroll', syncScroll);
            }
        };
    }, [
        shouldShowStickyHeader,
        mainGridRef,
        pinnedLeftColumnRef,
        pinnedRightColumnRef,
        stickyHeaderMainRef,
    ]);

    return {
        shouldShowStickyHeader,
        stickyTop,
    };
};
