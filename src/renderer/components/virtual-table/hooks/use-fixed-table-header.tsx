import { useInView } from 'motion/react';
import { useEffect, useRef } from 'react';

import { useWindowSettings } from '/@/renderer/store/settings.store';
import { Platform } from '/@/shared/types/types';

export const useFixedTableHeader = ({ enabled }: { enabled: boolean }) => {
    const tableHeaderRef = useRef<HTMLDivElement | null>(null);
    const tableContainerRef = useRef<HTMLDivElement | null>(null);
    const { windowBarStyle } = useWindowSettings();

    const topMargin =
        windowBarStyle === Platform.WINDOWS || windowBarStyle === Platform.MACOS
            ? '-130px'
            : '-100px';

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
            header?.classList.add('ag-header-fixed');
            root?.classList.add('ag-header-fixed-margin');

            if (windowBarStyle === Platform.WINDOWS || windowBarStyle === Platform.MACOS) {
                header?.classList.add('ag-header-window-bar');
            }
        } else if (!isTableInView) {
            header?.classList.remove('ag-header-fixed');
            root?.classList.remove('ag-header-fixed-margin');

            if (windowBarStyle === Platform.WINDOWS || windowBarStyle === Platform.MACOS) {
                header?.classList.remove('ag-header-window-bar');
            }
        } else if (isTableHeaderInView) {
            header?.classList.remove('ag-header-fixed');
            root?.classList.remove('ag-header-fixed-margin');

            if (windowBarStyle === Platform.WINDOWS || windowBarStyle === Platform.MACOS) {
                header?.classList.remove('ag-header-window-bar');
            }
        }
    }, [enabled, isTableHeaderInView, isTableInView, windowBarStyle]);

    return { tableContainerRef, tableHeaderRef };
};
