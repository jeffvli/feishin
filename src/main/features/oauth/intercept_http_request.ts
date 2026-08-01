import { session } from 'electron';

import logger from '/@/main/logger';

// Loading songs/images needs Authorization headers
// even if axios calls can have access tokens
export const attachAccessTokenToAssetRequests = (audienceEndpoint: string, accessToken: string) => {
    const cleanedEndpoint = audienceEndpoint.replace(/\/$/, ''); // Remove trailing slash if present
    const subsonicWildcard = `${cleanedEndpoint}/rest/*`;
    const navidromeWildcard = `${cleanedEndpoint}/api/*`;
    const urlsToIntercept = [subsonicWildcard, navidromeWildcard];

    session.defaultSession.webRequest.onBeforeSendHeaders(
        { urls: urlsToIntercept },
        (details, callback) => {
            logger.info(`Modifying request headers for URLs: ${urlsToIntercept.join(', ')}`);
            details.requestHeaders['Authorization'] = `Bearer ${accessToken}`;
            callback({ requestHeaders: details.requestHeaders });
        },
    );
};
