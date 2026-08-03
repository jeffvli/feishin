import { refreshServerAccessToken } from '../features/sso/utils/oidc-reauth-refresh';

import i18n from '/@/i18n/i18n';
import { openSsoModal } from '/@/renderer/features/sso/utils/open-sso-modal';
import { logger } from '/@/renderer/utils/logger';
import { OIDCLoginResponse, ServerListItem } from '/@/shared/types/domain-types';

export const refreshOAuth = async (currentServer: ServerListItem): Promise<string> => {
    // Try to refresh the access token first, if that fails, try to reauthenticate via SSO flow.
    return refreshServerAccessToken(currentServer)
        .then((accessToken) => {
            if (!accessToken) {
                throw new Error(i18n.t('error.ssoError'));
            }

            return accessToken;
        })
        .catch((accessTokenError) => {
            logger.error('Error when trying to refresh access token: ', accessTokenError);
            // Prompt OIDC flow to reauthenticate the user via SSO modal
            return new Promise<null | OIDCLoginResponse>((resolve, reject) => {
                openSsoModal(
                    currentServer,
                    (tokenResponse) => resolve(tokenResponse),
                    () => reject(),
                );
            })
                .then((loginResponse) => {
                    if (!loginResponse) {
                        throw new Error(i18n.t('error.ssoError'));
                    }
                    const accessToken = loginResponse.accessToken;
                    return accessToken;
                })
                .catch((reauthError) => {
                    logger.error('Error when trying to handle OAuth: ', reauthError);
                    throw reauthError;
                });
        });
};
