import { useEffect, useState } from 'react';
import { useTimeout } from '@mantine/hooks';

export const useHideScrollbar = (timeout: number) => {
    const [hideScrollbar, setHideScrollbar] = useState(false);
    const { start, clear } = useTimeout(() => setHideScrollbar(true), timeout);

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
