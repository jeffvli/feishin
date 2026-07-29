import { BrowserWindow } from 'electron';

import log from '/@/main/logger';
import { OIDCConfigResponse } from '/@/shared/types/domain-types';
import { discoverOIDCConfig } from '/@/shared/utils/oidc';

const DISCOVERY_TIMEOUT = 5 * 1000; //5 seconds

export const discoverIssuer = async (_event: any, url: string): Promise<OIDCConfigResponse> => {
    const discoveryWindow = new BrowserWindow({ show: false });
    log.info(`Discovering OIDC configuration for URL: ${url}`);

    return new Promise((resolve, reject) => {
        const checkURL = async (_event, url: string) => {
            log.info(`Navigated to URL: ${url}`);
            const configResponse = await discoverOIDCConfig(url);
            if (configResponse.found) {
                discoveryWindow.close();
                resolve(configResponse);
            } else {
                reject(
                    new Error(
                        'Failed to auto discover OIDC config, please provide the issuer URL manually',
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
                reject(new Error('Timeout while discovering OIDC config'));
            }
        }, DISCOVERY_TIMEOUT);
    });
};
