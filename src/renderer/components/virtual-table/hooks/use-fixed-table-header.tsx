import { useEffect, useRef } from 'react';
import { useInView } from 'framer-motion';
import { useWindowSettings } from '/@/renderer/store/settings.store';
import { Platform } from '/@/renderer/types';

export const useFixedTableHeader = () => {
    const intersectRef = useRef<HTMLDivElement | null>(null);
    const tableContainerRef = useRef<HTMLDivElement | null>(null);
    const { windowBarStyle } = useWindowSettings();

    const isNotPastTableIntersection = useInView(intersectRef, {
        margin:
            windowBarStyle === Platform.WEB || windowBarStyle === Platform.LINUX
                ? '-68px 0px 0px 0px'
                : '-98px 0px 0px 0px',
    });

    const tableInView = useInView(tableContainerRef, {
        margin: '-128px 0px 0px 0px',
    });

    useEffect(() => {
        const header = document.querySelector('main .ag-header');
        const root = document.querySelector('main .ag-root');

        if (isNotPastTableIntersection || !tableInView) {
            if (windowBarStyle === Platform.WINDOWS || windowBarStyle === Platform.MACOS) {
                header?.classList.remove('window-frame');
            }
            header?.classList.remove('ag-header-fixed');
            root?.classList.remove('ag-header-fixed-margin');
        } else {
            if (windowBarStyle === Platform.WINDOWS || windowBarStyle === Platform.MACOS) {
                header?.classList.add('window-frame');
            }
            header?.classList.add('ag-header-fixed');
            root?.classList.add('ag-header-fixed-margin');
        }
    }, [isNotPastTableIntersection, tableInView, windowBarStyle]);

    return { intersectRef, tableContainerRef };
};
