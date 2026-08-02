import { BrowserWindow } from 'electron';

import { IssuerDiscoveryResponse } from '../../../shared/types/domain-types';
import log from '../../logger';
import { discoverIssuer } from './oidc-discover-issuer';

const DISCOVERY_TIMEOUT = 5 * 1000; //5 seconds

export const autoDiscoverIssuerFromServerUrl = async (
    _event: any,
    url: string,
): Promise<IssuerDiscoveryResponse> => {
    const discoveryWindow = new BrowserWindow({ show: false });
    log.info(`Auto-discovering OIDC configuration for URL: ${url}`);

    return new Promise((resolve, reject) => {
        log.info('Checking URL');
        const checkURL = async (_event, url: string) => {
            const configResponse = await discoverIssuer(url);
            if (configResponse.issuer && configResponse.metadataEndpoint) {
                discoveryWindow.close();
                resolve(configResponse);
            } else {
                reject(new Error('Could not auto-discover OIDC/OAuth2 configuration.'));
            }
        };
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
