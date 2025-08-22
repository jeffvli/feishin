import { useCallback, useRef } from 'react';

import { wait } from '../../shared/utils/wait';

export const useDeferrer = <Params extends Array<any>, Return>(
    callback: (...params: Params) => Return,
    timeout: number,
) => {
    const idRef = useRef(0);

    return useCallback(
        async (...params: Params) => {
            const currentId = Math.random();
            idRef.current = currentId;
            await wait(timeout);
            if (idRef.current !== currentId) {
                return;
            }
            return callback(...params);
        },
        [callback, timeout],
    );
};
