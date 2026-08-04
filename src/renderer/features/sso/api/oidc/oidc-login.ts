import isElectron from 'is-electron';
import * as openid from 'openid-client';

import {
    attachAccessTokenToRequests,
    storeRefreshToken,
} from '/@/renderer/features/sso/api/oidc/oidc-api';
import { AppRoute } from '/@/renderer/router/routes';
import { logger } from '/@/renderer/utils/logger';
import {
    OAuthAuthenticationConfig,
    OAuthRedirectScheme,
    OIDCLoginResponse,
} from '/@/shared/types/domain-types';
import { formatRefreshTokenKey } from '/@/shared/utils/oauth-format-refresh-token-key';

const CALLBACK_PATH = AppRoute.OAUTH_CALLBACK;
const ELECTRON_CALLBACK_URL = `${OAuthRedirectScheme}:/${CALLBACK_PATH}`;
const DEFAULT_SCOPES = 'openid profile email';
const DEFAULT_CODE_CHALLENGE_METHOD = 'S256';

export const oidcLogin = async (
    authConfig: OAuthAuthenticationConfig,
    audienceEndpoint: string,
) => {
    logger.info('Creating OIDC/OAuth2 signin request', {
        audienceEndpoint,
        clientId: authConfig.clientId,
        issuerUrl: authConfig.issuerUrl,
    });
    try {
        const code_verifier = openid.randomPKCECodeVerifier();
        const { authUrl, config, nonce, state } = await makeAuthorizationUrl(
            authConfig,
            code_verifier,
        );

        return new Promise<OIDCLoginResponse>((resolve, reject) => {
            const { endSSOLogin, ssoCallback } = createFunctions(
                config,
                code_verifier,
                audienceEndpoint,
                state,
                nonce,
                resolve,
                reject,
            );

            // Set up listeners for the OIDC/OAuth2 callback URL
            window.addEventListener('sso-callback', ssoCallback);
            window.addEventListener('sso-end-login', endSSOLogin);

            // Open the OIDC/OAuth2 login page in a new tab/window
            window.open(authUrl, '_blank');

            // Show button to cancel SSO login in the main window
            window.dispatchEvent(new CustomEvent('sso-external-page-opened'));
        });
    } catch (error) {
        logger.error('Failed to create OIDC/OAuth2 signin request:', error);
        // End authenticateOAuth flow in renderer process
        window.dispatchEvent(new CustomEvent('sso-end-login'));
        return Promise.reject(error);
    }
};

const makeAuthorizationUrl = async (
    authConfig: OAuthAuthenticationConfig,
    code_verifier: string,
) => {
    const issuerUrl = new URL(authConfig.issuerUrl);
    const clientId = authConfig.clientId;
    const config: openid.Configuration = await openid.discovery(
        issuerUrl,
        clientId,
        undefined,
        openid.None(),
    );
    if (!config) {
        throw new Error('Failed to discover OIDC/OAuth2 issuer configuration');
    }

    const code_challenge = await openid.calculatePKCECodeChallenge(code_verifier);

    // Redirect URI is different for Electron and web
    // Web redirect URI is the current origin + callback path
    const redirectURI = isElectron()
        ? ELECTRON_CALLBACK_URL
        : `${window.location.origin}${CALLBACK_PATH}`;
    const parameters: Record<string, string> = {
        code_challenge: code_challenge,
        code_challenge_method: DEFAULT_CODE_CHALLENGE_METHOD,
        nonce: openid.randomNonce(),
        redirect_uri: redirectURI,
        scope: DEFAULT_SCOPES,
        state: openid.randomState(),
    };
    const authUrl = openid.buildAuthorizationUrl(config, parameters);
    logger.info(`Created authorization login URL`);

    return { authUrl, config, nonce: parameters.nonce, state: parameters.state };
};

const createFunctions = (
    config: openid.Configuration,
    code_verifier: string,
    audienceEndpoint: string,
    state: string,
    nonce: string,
    resolve: (value: OIDCLoginResponse | PromiseLike<OIDCLoginResponse>) => void,
    reject: (reason?: any) => void,
) => {
    const ssoCallback = async (event: any) => {
        window.removeEventListener('sso-callback', ssoCallback);
        const url = event.detail.url;
        const webCallbackUrl = new URL(
            CALLBACK_PATH,
            window.location.origin + window.location.pathname,
        ).href;
        const urlCheck = isElectron()
            ? url.startsWith(ELECTRON_CALLBACK_URL)
            : url.startsWith(webCallbackUrl);
        if (!urlCheck) {
            logger.warn(`Received unexpected callback URL: ${url}`);
            return;
        }
        processSigninResponse(url);
    };
    const processSigninResponse = async (url: string) => {
        logger.info(`Received OIDC/OAuth2 callback URL`);
        try {
            const tokenResponse = await getTokens(config, url, code_verifier, state, nonce);
            const claims = tokenResponse.claims();
            if (!claims || !claims.sub || !claims.iss)
                throw new Error('Failed to get claims from token response');

            if (tokenResponse.refresh_token) {
                const identifier = formatRefreshTokenKey(
                    claims.sub,
                    claims.iss,
                    config.clientMetadata().client_id,
                );
                await storeRefreshToken(identifier, tokenResponse.refresh_token);
            }
            attachAccessTokenToRequests(audienceEndpoint, tokenResponse.access_token);

            const response: OIDCLoginResponse = {
                accessToken: tokenResponse.access_token,
                claims: claims,
            };
            logger.info(
                'Successfully processed OIDC/OAuth2 signin response, sending to renderer process',
            );
            window.dispatchEvent(new CustomEvent('sso-success'));
            resolve(response);
            endSSOLogin();
        } catch (error) {
            logger.error('Failed to process OIDC/OAuth2 signin response:', error);
            reject(error);
            window.dispatchEvent(new CustomEvent('sso-error', { detail: error }));
            endSSOLogin();
        }
    };

    const endSSOLogin = () => {
        window.removeEventListener('sso-end-login', endSSOLogin);
        window.removeEventListener('sso-callback', ssoCallback);
        window.dispatchEvent(new CustomEvent('sso-end-login'));
    };
    return {
        endSSOLogin,
        processSigninResponse,
        ssoCallback,
    };
};

const getTokens = async (
    config: openid.Configuration,
    url: string,
    code_verifier: string,
    state: string,
    nonce: string,
) => {
    const callbackUrl = new URL(url);
    const tokenResponse: openid.TokenEndpointResponse & openid.TokenEndpointResponseHelpers =
        await openid.authorizationCodeGrant(config, callbackUrl, {
            expectedNonce: nonce,
            expectedState: state,
            pkceCodeVerifier: code_verifier,
        });
    return tokenResponse;
};
