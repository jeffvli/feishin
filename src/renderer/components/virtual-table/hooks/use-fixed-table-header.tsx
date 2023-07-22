import { useInView } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { useWindowSettings } from '/@/renderer/store/settings.store';
import { Platform } from '/@/renderer/types';

export const useFixedTableHeader = ({ enabled }: { enabled: boolean }) => {
    const tableHeaderRef = useRef<HTMLDivElement | null>(null);
    const tableContainerRef = useRef<HTMLDivElement | null>(null);
    const { windowBarStyle } = useWindowSettings();

    const topMargin =
        windowBarStyle === Platform.WINDOWS || windowBarStyle === Platform.MACOS
            ? '-128px'
            : '-98px';

    const isTableHeaderInView = useInView(tableHeaderRef, {
        margin: `${topMargin} 0px 0px 0px`,
    });

    const isTableInView = useInView(tableContainerRef, {
        margin: `${topMargin} 0px 0px 0px`,
    });

    useEffect(() => {
        if (!enabled) {
            return;
        }

        const header = document.querySelector('main .ag-header');
        const root = document.querySelector('main .ag-root');

        if (!isTableHeaderInView && isTableInView) {
            if (windowBarStyle === Platform.WINDOWS || windowBarStyle === Platform.MACOS) {
                header?.classList.add('window-frame');
            }
            header?.classList.add('ag-header-fixed');
            root?.classList.add('ag-header-fixed-margin');
        } else if (!isTableInView) {
            if (windowBarStyle === Platform.WINDOWS || windowBarStyle === Platform.MACOS) {
                header?.classList.remove('window-frame');
            }
            header?.classList.remove('ag-header-fixed');
            root?.classList.remove('ag-header-fixed-margin');
        } else if (isTableHeaderInView) {
            if (windowBarStyle === Platform.WINDOWS || windowBarStyle === Platform.MACOS) {
                header?.classList.remove('window-frame');
            }
            header?.classList.remove('ag-header-fixed');
            root?.classList.remove('ag-header-fixed-margin');
        }
    }, [enabled, isTableHeaderInView, isTableInView, windowBarStyle]);

    return { tableContainerRef, tableHeaderRef };
};
