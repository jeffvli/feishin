// From https://learnersbucket.com/examples/interview/usehasfocus-hook-in-react/

import { useState, useEffect } from 'react';

export const useAppFocus = () => {
    const [focus, setFocus] = useState(document.hasFocus());

    useEffect(() => {
        const onFocus = () => setFocus(true);
        const onBlur = () => setFocus(false);

        window.addEventListener('focus', onFocus);
        window.addEventListener('blur', onBlur);

        return () => {
            window.removeEventListener('focus', onFocus);
            window.removeEventListener('blur', onBlur);
        };
    }, []);

    return focus;
};
