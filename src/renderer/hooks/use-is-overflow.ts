import { MutableRefObject, useState, useLayoutEffect } from 'react';

export const useIsOverflow = (ref: MutableRefObject<HTMLDivElement | null>) => {
    const [isOverflow, setIsOverflow] = useState<Boolean | undefined>(undefined);

    useLayoutEffect(() => {
        const { current } = ref;

        const trigger = () => {
            const hasOverflow = (current?.scrollHeight || 0) > (current?.clientHeight || 0);
            setIsOverflow(hasOverflow);
        };

        if (current) {
            trigger();
        }
    }, [ref]);

    return isOverflow;
};
