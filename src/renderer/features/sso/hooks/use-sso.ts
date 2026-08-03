import { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react';

import {
    cancelOIDCLogin,
    externalPageOpenedCallback,
    oauthCallback,
    oauthCallbackError,
    removeOAuthListeners,
} from '/@/renderer/features/sso/api/oidc/oidc-api';

export const useSSO = (
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
        const gotSSOError = () => {
            if (!externalSSOPageOpenRef.current) return;

            externalSSOPageOpenRef.current = false;
            setExternalSSOPageOpen(false);
            setIsLoading(false);
        };

        externalPageOpenedCallback(pageOpened);
        oauthCallback(gotSSOResponse);
        oauthCallbackError(gotSSOError);
        return () => {
            removeOAuthListeners();
        };
    }, [setIsLoading]);

    const cancelSSOLogin = () => {
        externalSSOPageOpenRef.current = false;
        setExternalSSOPageOpen(false);
        setIsLoading(false);
        cancelOIDCLogin();
    };

    return { cancelSSOLogin, externalSSOPageOpen, externalSSOPageOpenRef };
};
