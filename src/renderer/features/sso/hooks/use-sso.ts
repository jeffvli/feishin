import { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react';

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

        window.api.oauth.externalPageOpenedCallback(pageOpened);
        window.api.oauth.oauthCallback(gotSSOResponse);
        window.api.oauth.oauthCallbackError(gotSSOError);
        return () => {
            window.api.oauth.removeOAuthListeners();
        };
    }, [setIsLoading]);

    const cancelSSOLogin = () => {
        externalSSOPageOpenRef.current = false;
        setExternalSSOPageOpen(false);
        setIsLoading(false);
        window.api.oauth.cancelSSOLogin();
    };

    return { cancelSSOLogin, externalSSOPageOpen, externalSSOPageOpenRef };
};
