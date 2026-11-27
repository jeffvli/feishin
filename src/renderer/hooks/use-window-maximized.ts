import isElectron from 'is-electron';
import { useEffect, useState } from 'react';

const browser = isElectron() ? window.api.browser : null;

export const useWindowMaximized = () => {
    const [maximized, setMaximized] = useState(false);

    useEffect(() => {
        if (!browser) return undefined;

        let active = true;
        browser.isMaximized().then((value) => {
            if (active) setMaximized(value);
        });

        const unsubscribe = browser.onMaximizedChange(setMaximized);

        return () => {
            active = false;
            unsubscribe();
        };
    }, []);

    return maximized;
};
