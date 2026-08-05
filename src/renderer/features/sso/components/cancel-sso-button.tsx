import { Dispatch, SetStateAction, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { useSSOPageOpen } from '/@/renderer/features/sso/hooks/use-sso';
import { ModalButton } from '/@/shared/components/modal/model-shared';

export const CancelSSOLoginButton = ({
    setIsLoading,
}: {
    setIsLoading: Dispatch<SetStateAction<boolean>>;
}) => {
    const { t } = useTranslation();
    const { cancelSSOLogin, externalSSOPageOpen, externalSSOPageOpenRef } =
        useSSOPageOpen(setIsLoading);
    const ssoStillOpen = externalSSOPageOpenRef.current;
    useEffect(() => {
        return () => {
            if (ssoStillOpen) {
                cancelSSOLogin(); // Clean up SSO if component unmounts while SSO is in progress
            }
        };
    }, [cancelSSOLogin, ssoStillOpen]);

    return externalSSOPageOpen ? (
        <ModalButton disabled={!externalSSOPageOpen} onClick={cancelSSOLogin} variant="default">
            {t('sso.cancelSignIn')}
        </ModalButton>
    ) : null;
};
