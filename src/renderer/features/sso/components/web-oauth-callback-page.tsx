import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import styles from '/@/renderer/features/action-required/routes/action-required-route.module.css';
import { Stack } from '/@/shared/components/stack/stack';
import { TextTitle } from '/@/shared/components/text-title/text-title';

export const WebOAuthCallbackPage = () => {
    const { t } = useTranslation();
    //const navigate = useNavigate();
    const [postMessageFail, setPostMessageFail] = useState(false);

    useEffect(() => {
        const url = window.location.href;

        // Check OIDC callback parameters return if so
        if (!window.opener || window.opener.closed) {
            console.error('No opener window found for OIDC callback');
            setPostMessageFail(true);
            return;
        }
        // Send the callback URL to the opener window and close this window
        window.opener.postMessage({ type: 'sso-callback', url: url }, window.location.origin);
        window.close();
    }, [setPostMessageFail]);

    return (
        <Stack className={styles.wrapper}>
            {!postMessageFail ? (
                <TextTitle size="lg" weight={700}>
                    {t('sso.callbackPageDescription')}
                </TextTitle>
            ) : (
                <TextTitle size="lg" weight={700}>
                    {t('sso.callbackPageError')}
                </TextTitle>
            )}
        </Stack>
    );
};
