import { ipcRenderer } from 'electron';

export const oauth = {
    attachAccessTokenToRequests: (audienceEndpoint: string, accessToken: string): void => {
        ipcRenderer.invoke('oauth-attach-token', audienceEndpoint, accessToken);
    },
    deleteRefreshToken: (key: string): Promise<void> =>
        ipcRenderer.invoke('oauth-delete-refresh-token', key),
    getRefreshToken: (key: string): Promise<null | string> =>
        ipcRenderer.invoke('oauth-get-refresh-token', key),
    registerSSOCallback: (callback: (url: string) => void): void => {
        ipcRenderer.on('oauth-callback-url', (_event, url) => {
            callback(url);
        });
    },
    storeRefreshToken: (key: string, refreshToken: string): Promise<void> =>
        ipcRenderer.invoke('oauth-store-refresh-token', key, refreshToken),
};
