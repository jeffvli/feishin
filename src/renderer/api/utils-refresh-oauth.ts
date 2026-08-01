import { AxiosInstance, AxiosResponse } from 'axios';

import i18n from '/@/i18n/i18n';
import {
    reauthenticateOAuth,
    refreshAccessToken,
} from '/@/renderer/features/sso/utils/oauth-access';
import { ServerListItem } from '/@/shared/types/domain-types';

export const refreshOAuth = async ({
    axiosClient,
    config,
    currentServer,
}: {
    axiosClient: AxiosInstance;
    config: any;
    currentServer: ServerListItem;
}): Promise<AxiosResponse<any, any, object> | void> => {
    // Try to refresh the access token first, if that fails, try to reauthenticate via SSO flow.
    return refreshAccessToken(currentServer)
        .then((accessToken) => {
            if (!accessToken) {
                throw new Error(i18n.t('error.ssoError'));
            }
            config.headers['Authorization'] = `Bearer ${accessToken}`;
            return axiosClient.request(config);
        })
        .catch((accessTokenError) => {
            console.error('Error when trying to refresh access token: ', accessTokenError);
            // Try to prompt OIDC flow
            return reauthenticateOAuth(currentServer)
                .then((signinResponse) => {
                    if (!signinResponse) {
                        throw new Error(i18n.t('error.ssoError'));
                    }
                    return axiosClient.request(config);
                })
                .catch((reauthError) => {
                    console.error('Error when trying to handle OAuth: ', reauthError);
                    throw reauthError;
                });
        });
};
