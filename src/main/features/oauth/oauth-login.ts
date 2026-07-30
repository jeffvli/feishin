import { app, ipcMain, shell } from 'electron';
import path from 'node:path';
import { CreateSigninRequestArgs, OidcClient } from 'oidc-client-ts';

import { storeRefreshToken } from '/@/main/features/oauth/oauth-refresh-token-store';
import { getMainWindow } from '/@/main/index';
import log from '/@/main/logger';
import { OAuthRedirectScheme } from '/@/shared/types/domain-types';
import { formatRefreshTokenKey } from '/@/shared/utils/oauth-format-refresh-token-key';

const gotLock = app.requestSingleInstanceLock();

export const oauthLogin = async (oidcClient: OidcClient, signinArgs: CreateSigninRequestArgs) => {
    const client = oidcClient;
    log.info('Creating OIDC/OAuth2 signin request');
    try {
        const url = await setupAuthorizeUrl(client, signinArgs);
        const { endOAuthLogin, openUrlListener, secondInstanceListener } = createFunctions(client);

        // Set up listeners for the OIDC/OAuth2 callback URL
        app.once('open-url', openUrlListener);
        app.once('second-instance', secondInstanceListener);
        ipcMain.handleOnce('oauth:cancel-sso-login', endOAuthLogin);

        // Open the authorization URL in an external browser
        await shell.openExternal(url);
        // Show button to cancel SSO login in the main window
        getMainWindow()?.webContents.send('oauth:external-page-opened');
    } catch (error) {
        log.error('Failed to create OIDC/OAuth2 signin request:', error);
        // End authenticateOAuth flow in renderer process
        getMainWindow()?.webContents.send('oauth:endLogin');
    }
};

const setupAuthorizeUrl = async (client: OidcClient, signinArgs: CreateSigninRequestArgs) => {
    const signinRequest = await client.createSigninRequest(signinArgs);

    if (!signinRequest) {
        throw new Error('Failed to create OIDC/OAuth2 signin request');
    }

    const url = signinRequest.url;
    log.info(`Opening OIDC/OAuth2 login URL`);

    if (!gotLock) {
        throw new Error('Failed to acquire single instance lock for OIDC/OAuth2 callback handling');
    }

    // Setup app callback protocol
    if (process.defaultApp) {
        // In development mode, the app is run with `electron .` and not packaged
        app.setAsDefaultProtocolClient(OAuthRedirectScheme, process.execPath, [
            path.resolve(process.argv[1]),
        ]);
    } else {
        app.setAsDefaultProtocolClient(OAuthRedirectScheme);
    }
    return url;
};

const createFunctions = (client: OidcClient) => {
    const openUrlListener = async (_event: Electron.Event, url: string) => {
        if (url.startsWith(`${OAuthRedirectScheme}://`)) {
            processSigninResponse(url);
        }
    };
    const secondInstanceListener = async (_event: Electron.Event, argv: string[]) => {
        const url = argv.find((arg) => arg.startsWith(`${OAuthRedirectScheme}://`));
        if (url) {
            processSigninResponse(url);
        }
    };

    const processSigninResponse = async (url: string) => {
        log.info(`Received OIDC/OAuth2 callback URL`);
        try {
            const signinResponse = await client.processSigninResponse(url);
            log.info('Successfully processed OIDC/OAuth2 signin response');
            if (signinResponse.refresh_token) {
                const identifier = formatRefreshTokenKey(
                    signinResponse.profile.sub,
                    signinResponse.profile.iss,
                    client.settings.client_id,
                );
                await storeRefreshToken(identifier, signinResponse.refresh_token);
            }
            getMainWindow()?.webContents.send('oauth:callback', signinResponse);
            endOAuthLogin();
        } catch (error) {
            log.error('Failed to process OIDC/OAuth2 signin response:', error);
            getMainWindow()?.webContents.send('oauth:endLogin');
            endOAuthLogin();
        }
    };

    const endOAuthLogin = () => {
        ipcMain.removeHandler('oauth:cancel-sso-login');
        app.removeListener('open-url', openUrlListener);
        app.removeListener('second-instance', secondInstanceListener);
        getMainWindow()?.webContents.send('oauth:endLogin');
    };
    return {
        endOAuthLogin,
        openUrlListener,
        processSigninResponse,
        secondInstanceListener,
    };
};
