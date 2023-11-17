import { createContext, useContext } from 'react';
import NoSleep from 'nosleep.js';

export const NoSleepContext = createContext<{
    enabled: boolean;
    noSleep?: NoSleep;
    setEnabled?: (val: boolean) => void;
}>({
    enabled: false,
});

export const useNoSleepContext = () => {
    const ctxValue = useContext(NoSleepContext);
    return ctxValue;
};
