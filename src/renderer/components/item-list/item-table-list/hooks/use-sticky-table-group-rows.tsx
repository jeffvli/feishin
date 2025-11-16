import { useEffect, useMemo, useState } from 'react';

import { useWindowSettings } from '/@/renderer/store/settings.store';
import { Platform } from '/@/shared/types/types';

export interface GroupRowInfo {
    groupIndex: number;
    rowIndex: number;
}

export const useStickyTableGroupRows = ({
    containerRef,
    enabled,
    getGroupRowHeight,
    getRowHeight,
    groups,
    headerHeight,
    mainGridRef,
    shouldShowStickyHeader,
    stickyHeaderTop,
}: {
    containerRef: React.RefObject<HTMLDivElement | null>;
    enabled: boolean;
    getGroupRowHeight?: (groupIndex: number) => number;
    getRowHeight: (index: number) => number;
    groups?: Array<{ itemCount: number; rowHeight?: ((index: number) => number) | number }>;
    headerHeight: number;
    mainGridRef: React.RefObject<HTMLDivElement | null>;
    shouldShowStickyHeader?: boolean;
    stickyHeaderTop?: number;
}) => {
    const { windowBarStyle } = useWindowSettings();
    const [stickyGroupIndex, setStickyGroupIndex] = useState<null | number>(null);

    const stickyTop = useMemo(() => {
        // If sticky header is showing, position group row below it with 1px offset to avoid conflict
        // Otherwise, use the base sticky position
        if (shouldShowStickyHeader && stickyHeaderTop !== undefined) {
            return stickyHeaderTop + headerHeight + 1;
        }
        return windowBarStyle === Platform.WINDOWS || windowBarStyle === Platform.MACOS ? 95 : 65;
    }, [windowBarStyle, shouldShowStickyHeader, stickyHeaderTop, headerHeight]);

    // Calculate group row indexes
    const groupRowIndexes = useMemo(() => {
        if (!groups || groups.length === 0) {
            return [];
        }

        const indexes: GroupRowInfo[] = [];
        let cumulativeDataIndex = 0;
        const headerOffset = 1; // Assuming header is enabled

        groups.forEach((group, groupIndex) => {
            const groupHeaderIndex = headerOffset + cumulativeDataIndex + groupIndex;
            indexes.push({
                groupIndex,
                rowIndex: groupHeaderIndex,
            });
            cumulativeDataIndex += group.itemCount;
        });

        return indexes;
    }, [groups]);

    useEffect(() => {
        if (
            !enabled ||
            !groups ||
            groups.length === 0 ||
            !mainGridRef.current ||
            !containerRef.current
        ) {
            return;
        }

        // Get the actual scrollable grid element (first child of the container)
        const mainGridContainer = mainGridRef.current;
        const mainGrid = mainGridContainer.childNodes[0] as HTMLDivElement | null;

        if (!mainGrid) {
            return;
        }

        const updateStickyGroup = () => {
            const scrollTop = mainGrid.scrollTop || 0;
            const containerRect = containerRef.current?.getBoundingClientRect();

            if (!containerRect) {
                return;
            }

            // Calculate the sticky threshold position
            // The sticky group row should appear when a group row scrolls past this position
            // stickyTop already accounts for window bar style and sticky header offset
            const containerTop = containerRect.top;
            const baseStickyPosition = stickyTop; // Base position (window bar + sticky header if showing)

            // Find which group row should be sticky
            // We want to show the current group as soon as its row reaches the sticky position
            // This way it updates "on scroll" when scrolling into a new group section
            let targetGroupIndex: null | number = null;

            // Iterate forward through groups to find which one is at or about to reach the sticky position
            for (let i = 0; i < groupRowIndexes.length; i++) {
                const { groupIndex, rowIndex } = groupRowIndexes[i];

                // Calculate the top position of this group row relative to the grid scroll
                let rowTop = headerHeight;
                for (let r = 0; r < rowIndex; r++) {
                    rowTop += getRowHeight(r);
                }

                // Calculate where this row would be in the viewport (absolute position from top of viewport)
                const rowViewportTop = containerTop + rowTop - scrollTop;

                // Get the height of this group row to account for its own offset
                const groupRowHeight = getGroupRowHeight ? getGroupRowHeight(groupIndex) : 40; // Default group row height

                // Calculate the sticky position accounting for the sticky group row's own height
                // Similar to how stickyTop accounts for sticky header height, we add the group row height
                const stickyPosition = baseStickyPosition + groupRowHeight;

                // Check if this group row has reached or is about to reach the sticky position
                // The sticky group row appears at baseStickyPosition, but we check when the actual group row
                // reaches baseStickyPosition + groupRowHeight to account for the sticky group row's own height
                if (rowViewportTop <= stickyPosition) {
                    // This group has reached the sticky position, so show this group
                    targetGroupIndex = groupIndex;
                    // Don't break here - continue checking to see if a later group should replace it
                } else {
                    // This group hasn't reached the sticky position yet
                    // If we already found a target group, keep it and stop
                    // Otherwise, no group should be sticky yet
                    if (targetGroupIndex !== null) {
                        break;
                    }
                }
            }

            setStickyGroupIndex((prev) => {
                if (prev !== targetGroupIndex) {
                    return targetGroupIndex;
                }
                return prev;
            });
        };

        updateStickyGroup();

        mainGrid.addEventListener('scroll', updateStickyGroup, { passive: true });
        window.addEventListener('scroll', updateStickyGroup, true);
        window.addEventListener('resize', updateStickyGroup);

        return () => {
            mainGrid.removeEventListener('scroll', updateStickyGroup);
            window.removeEventListener('scroll', updateStickyGroup, true);
            window.removeEventListener('resize', updateStickyGroup);
        };
    }, [
        enabled,
        groups,
        groupRowIndexes,
        mainGridRef,
        containerRef,
        getGroupRowHeight,
        getRowHeight,
        headerHeight,
        stickyTop,
    ]);

    return {
        shouldShowStickyGroupRow: stickyGroupIndex !== null,
        stickyGroupIndex,
        stickyTop,
    };
};
