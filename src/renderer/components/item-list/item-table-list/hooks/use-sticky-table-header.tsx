import { useInView } from 'motion/react';
import { RefObject, useMemo } from 'react';

import { useWindowSettings } from '/@/renderer/store/settings.store';
import { Platform } from '/@/shared/types/types';

export const useStickyTableHeader = ({
    containerRef,
    enabled,
    headerRef,
}: {
    containerRef: RefObject<HTMLDivElement | null>;
    enabled: boolean;
    headerRef: RefObject<HTMLDivElement | null>;
}) => {
    const { windowBarStyle } = useWindowSettings();

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

    return {
        shouldShowStickyHeader,
        stickyTop,
    };
};
