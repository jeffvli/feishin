import { app, ipcMain, shell } from 'electron';
import path from 'node:path';
import * as openid from 'openid-client';

import { attachAccessTokenToAssetRequests } from './intercept_http_request';
import { storeRefreshToken } from './refresh-token-store';

import { getMainWindow } from '/@/main/index';
import log from '/@/main/logger';
import {
    OAuthAuthenticationConfig,
    OAuthRedirectScheme,
    OIDCLoginResponse,
} from '/@/shared/types/domain-types';
import { formatRefreshTokenKey } from '/@/shared/utils/oauth-format-refresh-token-key';

const gotLock = app.requestSingleInstanceLock();
const CALLBACK_ENDING = '://oauth2/callback';
const AUTH_CALLBACK_URL = `${OAuthRedirectScheme}${CALLBACK_ENDING}`;
const DEFAULT_SCOPES = 'openid profile email';
const DEFAULT_CODE_CHALLENGE_METHOD = 'S256';

export const oidcLogin = async (
    authConfig: OAuthAuthenticationConfig,
    audienceEndpoint: string,
) => {
    log.info('Creating OIDC/OAuth2 signin request');
    try {
        const code_verifier = openid.randomPKCECodeVerifier();
        const { authUrl, config, nonce, state } = await makeAuthorizationUrl(
            authConfig,
            code_verifier,
        );
        const { endSSOLogin, openUrlListener, secondInstanceListener } = createFunctions(
            config,
            code_verifier,
            audienceEndpoint,
            state,
            nonce,
        );

        // Set up listeners for the OIDC/OAuth2 callback URL
        app.once('open-url', openUrlListener);
        app.once('second-instance', secondInstanceListener);
        ipcMain.once('oauth:cancel-sso-login', endSSOLogin);

        // Open the authorization URL in an external browser
        await shell.openExternal(authUrl.href);
        // Show button to cancel SSO login in the main window
        getMainWindow()?.webContents.send('oauth:external-page-opened');
    } catch (error) {
        log.error('Failed to create OIDC/OAuth2 signin request:', error);
        // End authenticateOAuth flow in renderer process
        getMainWindow()?.webContents.send('oauth:endLogin');
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
    const parameters: Record<string, string> = {
        code_challenge: code_challenge,
        code_challenge_method: DEFAULT_CODE_CHALLENGE_METHOD,
        nonce: openid.randomNonce(),
        redirect_uri: AUTH_CALLBACK_URL,
        scope: DEFAULT_SCOPES,
        state: openid.randomState(),
    };
    const authUrl = openid.buildAuthorizationUrl(config, parameters);
    log.info(`Created authorization login URL`);

    // Setup app callback protocol
    if (!gotLock) {
        throw new Error('Failed to acquire single instance lock for OIDC/OAuth2 callback handling');
    }

    if (process.defaultApp) {
        // In development mode, the app is run with `electron .` and not packaged
        app.setAsDefaultProtocolClient(OAuthRedirectScheme, process.execPath, [
            path.resolve(process.argv[1]),
        ]);
    } else {
        app.setAsDefaultProtocolClient(OAuthRedirectScheme);
    }
    return { authUrl, config, nonce: parameters.nonce, state: parameters.state };
};

const createFunctions = (
    config: openid.Configuration,
    code_verifier: string,
    audienceEndpoint: string,
    state: string,
    nonce: string,
) => {
    const openUrlListener = async (_event: Electron.Event, url: string) => {
        if (url.startsWith(AUTH_CALLBACK_URL)) {
            processSigninResponse(url);
        }
    };
    const secondInstanceListener = async (_event: Electron.Event, argv: string[]) => {
        const url = argv.find((arg) => arg.startsWith(AUTH_CALLBACK_URL));
        if (url) {
            processSigninResponse(url);
        }
    };

    const processSigninResponse = async (url: string) => {
        log.info(`Received OIDC/OAuth2 callback URL`);
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
            attachAccessTokenToAssetRequests(audienceEndpoint, tokenResponse.access_token);

            const response: OIDCLoginResponse = {
                accessToken: tokenResponse.access_token,
                claims: claims,
            };
            log.info(
                'Successfully processed OIDC/OAuth2 signin response, sending to renderer process',
            );
            getMainWindow()?.webContents.send('oauth:callback', response);
            endSSOLogin();
        } catch (error) {
            log.error('Failed to process OIDC/OAuth2 signin response:', error);
            getMainWindow()?.webContents.send('oauth:endLogin');
            endSSOLogin();
        }
    };

    const endSSOLogin = () => {
        ipcMain.removeListener('oauth:cancel-sso-login', endSSOLogin);
        app.removeListener('open-url', openUrlListener);
        app.removeListener('second-instance', secondInstanceListener);
        getMainWindow()?.webContents.send('oauth:endLogin');
    };
    return {
        endSSOLogin,
        openUrlListener,
        processSigninResponse,
        secondInstanceListener,
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
