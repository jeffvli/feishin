import { BrowserWindow } from 'electron';

import { OAuthDiscoveryResponse } from '../../../shared/types/domain-types';
import { discoverIssuer } from '../../../shared/utils/oauth';
import log from '../../logger';

const DISCOVERY_TIMEOUT = 5 * 1000; //5 seconds

export const discoverIssuerFromRedirects = async (
    _event: any,
    url: string,
): Promise<OAuthDiscoveryResponse> => {
    const discoveryWindow = new BrowserWindow({ show: false });
    log.info(`Discovering OIDC configuration for URL: ${url}`);

    return new Promise((resolve, reject) => {
        const checkURL = async (_event, url: string) => {
            log.info(`Navigated to URL: ${url}`);
            const configResponse = await discoverIssuer(url);
            if (configResponse.found) {
                discoveryWindow.close();
                resolve(configResponse);
            } else {
                reject(
                    new Error(
                        'Failed to auto discover OIDC/OAuth2 issuer, please provide the issuer URL manually',
                    ),
                );
            }
        };
        log.info('loading url');
        discoveryWindow.webContents.on('did-navigate', checkURL);
        discoveryWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
            log.error(`URL could not be loaded: ${errorDescription} (Error code: ${errorCode})`);
            discoveryWindow.close();
            reject(new Error(`URL could not be loaded: ${url}`));
        });
        discoveryWindow.loadURL(url);
        setTimeout(() => {
            if (!discoveryWindow.isDestroyed()) {
                discoveryWindow.close();
                reject(new Error('URL timeout exceeded'));
            }
        }, DISCOVERY_TIMEOUT);
    });
};
