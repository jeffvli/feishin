import { Dispatch, SetStateAction, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { useSSO } from '/@/renderer/features/sso/hooks/use-sso';
import { ModalButton } from '/@/shared/components/modal/model-shared';

export const CancelSSOLoginButton = ({
    setIsLoading,
}: {
    setIsLoading: Dispatch<SetStateAction<boolean>>;
}) => {
    const { t } = useTranslation();
    const { cancelSSOLogin, externalSSOPageOpen, externalSSOPageOpenRef } = useSSO(setIsLoading);
    useEffect(() => {
        const externalSSOPageOpen = externalSSOPageOpenRef.current;
        return () => {
            if (externalSSOPageOpen) {
                cancelSSOLogin(); // Clean up SSO if component unmounts while SSO is in progress
            }
        };
    }, [cancelSSOLogin, externalSSOPageOpenRef]);

    return externalSSOPageOpen ? (
        <ModalButton disabled={!externalSSOPageOpen} onClick={cancelSSOLogin} variant="default">
            {t('form.addServer.cancelSSO')}
        </ModalButton>
    ) : null;
};
