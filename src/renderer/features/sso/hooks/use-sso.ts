import { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react';

import {
    endOIDCLogin,
    externalPageOpenedCallback,
    removeExternalPageOpenedCallback,
    removeSsoEndCallback,
    removeSsoSuccessCallback,
    ssoEndCallback,
    ssoSuccessCallback,
} from '/@/renderer/features/sso/api/oidc/oidc-api';

export const useSSOPageOpen = (
    setIsLoading: Dispatch<SetStateAction<boolean>>,
): {
    cancelSSOLogin: () => void;
    externalSSOPageOpen: boolean;
    externalSSOPageOpenRef: React.RefObject<boolean>;
} => {
    const [externalSSOPageOpen, setExternalSSOPageOpen] = useState(false);
    const externalSSOPageOpenRef = useRef(false);

    useEffect(() => {
        const pageOpened = () => {
            setIsLoading(true);
            externalSSOPageOpenRef.current = true;
            setExternalSSOPageOpen(true);
        };
        const gotSSOResponse = () => {
            externalSSOPageOpenRef.current = false;
            setExternalSSOPageOpen(false);
        };
        const gotSSOEnd = () => {
            if (!externalSSOPageOpenRef.current) return;

            externalSSOPageOpenRef.current = false;
            setExternalSSOPageOpen(false);
            setIsLoading(false);
        };

        externalPageOpenedCallback(pageOpened);
        ssoSuccessCallback(gotSSOResponse);
        ssoEndCallback(gotSSOEnd);
        return () => {
            removeExternalPageOpenedCallback(pageOpened);
            removeSsoSuccessCallback(gotSSOResponse);
            removeSsoEndCallback(gotSSOEnd);
        };
    }, [setIsLoading]);

    const cancelSSOLogin = () => {
        externalSSOPageOpenRef.current = false;
        setExternalSSOPageOpen(false);
        setIsLoading(false);
        endOIDCLogin();
    };

    return { cancelSSOLogin, externalSSOPageOpen, externalSSOPageOpenRef };
};
