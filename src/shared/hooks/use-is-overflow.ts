import { MutableRefObject, useLayoutEffect, useState } from 'react';

export const useIsOverflow = (ref: MutableRefObject<HTMLDivElement | null>) => {
    const [isOverflow, setIsOverflow] = useState<boolean | undefined>(undefined);

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
