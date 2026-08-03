import isElectron from 'is-electron';

import {
    IssuerDiscoveryResponse,
    OAuthAuthenticationConfig,
    OIDCLoginResponse,
} from '/@/shared/types/domain-types';

export const attachAccessTokenToRequests: (
    audienceEndpoint: string,
    accessToken: string,
) => void = (audienceEndpoint, accessToken) => {
    if (isElectron()) {
        window.api?.oauth.attachAccessTokenToRequests(audienceEndpoint, accessToken);
    }
};

export const autoDiscoverIssuerUrl: (url: string) => Promise<IssuerDiscoveryResponse> = (url) =>
    window.api?.oauth.autoDiscoverIssuerUrl(url);

export const cancelOIDCLogin: () => void = () => window.api?.oauth.cancelSSOLogin();

export const discoverIssuer: (url: string) => Promise<IssuerDiscoveryResponse> = (url) =>
    window.api?.oauth.discoverIssuer(url);

export const externalPageOpenedCallback: (callback: () => void) => void = (callback) =>
    window.api?.oauth.externalPageOpenedCallback(callback);

export const getRefreshToken: (key: string) => Promise<null | string> = async (key) => {
    if (isElectron()) {
        return await window.api?.oauth.getRefreshToken(key);
    } else {
        return null;
    }
};

export const login: (authConfig: OAuthAuthenticationConfig, audienceEndpoint: string) => void = (
    authConfig,
    audienceEndpoint,
) => window.api?.oauth.login(authConfig, audienceEndpoint);

export const oauthCallback: (callback: (loginResponse: OIDCLoginResponse) => void) => void = (
    callback,
) => {
    window.api?.oauth.oauthCallback(callback);
};

export const oauthCallbackError: (callback: () => void) => void = (callback) =>
    window.api?.oauth.oauthCallbackError(callback);

export const refreshAccessToken: (
    refreshTokenKey: string,
    authConfig: OAuthAuthenticationConfig,
    audienceEndpoint: string,
) => Promise<null | string> = (refreshTokenKey, authConfig, audienceEndpoint) =>
    window.api?.oauth.refreshAccessToken(refreshTokenKey, authConfig, audienceEndpoint);

export const removeOAuthListeners: () => void = () => window.api?.oauth.removeOAuthListeners();

export const revokeRefreshToken: (
    refreshTokenKey: string,
    authConfig: OAuthAuthenticationConfig,
) => Promise<void> = (refreshTokenKey, authConfig) =>
    window.api?.oauth.revokeRefreshToken(refreshTokenKey, authConfig);

export const storeRefreshToken: (key: string, refreshToken: string) => Promise<void> = (
    key,
    refreshToken,
) => window.api?.oauth.storeRefreshToken(key, refreshToken);
