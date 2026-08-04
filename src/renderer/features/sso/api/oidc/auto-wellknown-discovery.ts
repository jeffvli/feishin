import { discoverIssuer } from './oidc-discover-issuer';

import { logger } from '/@/renderer/utils/logger';
import { IssuerDiscoveryResponse } from '/@/shared/types/domain-types';

// Check if url redirects to a openid-configuration endpoint
export const autoDiscoverIssuerUrl = async (url: string): Promise<IssuerDiscoveryResponse> => {
    logger.info(`Auto-discovering OIDC configuration for URL: ${url}`);

    return fetch(url, { method: 'HEAD', redirect: 'follow' }).then(async (response) => {
        const finalUrl = response.url;
        const configResponse = await discoverIssuer(finalUrl);
        if (configResponse.issuer && configResponse.metadataEndpoint) {
            return configResponse;
        } else {
            throw new Error('Could not auto-discover OIDC/OAuth2 configuration.');
        }
    });
};
