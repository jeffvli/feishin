import { useEffect, useState } from 'react';

import { useTimeout } from '/@/shared/hooks/use-timeout';

export const useHideScrollbar = (timeout: number) => {
    const [hideScrollbar, setHideScrollbar] = useState(false);
    const { clear, start } = useTimeout(() => setHideScrollbar(true), timeout);

    // Automatically hide the scrollbar after the timeout duration
    useEffect(() => {
        start();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const hideScrollbarElementProps = {
        onMouseEnter: () => {
            setHideScrollbar(false);
            clear();
        },
        onMouseLeave: () => {
            start();
        },
    };

    return { hideScrollbarElementProps, isScrollbarHidden: hideScrollbar };
};
