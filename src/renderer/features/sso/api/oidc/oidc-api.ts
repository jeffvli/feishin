import isElectron from 'is-electron';

const oauthIpc = isElectron() ? window.api.oauth : null;

export const attachAccessTokenToRequests: (
    audienceEndpoint: string,
    accessToken: string,
) => void = (audienceEndpoint, accessToken) => {
    if (oauthIpc) {
        oauthIpc.attachAccessTokenToRequests(audienceEndpoint, accessToken);
    }
};

export const endOIDCLogin: () => void = () => {
    window.dispatchEvent(new CustomEvent('sso-end-login'));
};

export const deleteRefreshToken: (key: string) => Promise<void> = async (key) => {
    if (oauthIpc) {
        await oauthIpc.deleteRefreshToken(key);
    }
};

export const ssoSuccessCallback: (callback: (loginResponse: any) => void) => void = (callback) => {
    window.addEventListener('sso-success', callback);
};

export const ssoErrorCallback: (callback: () => void) => void = (callback) => {
    window.addEventListener('sso-error', callback);
};

export const externalPageOpenedCallback: (callback: () => void) => void = (callback) => {
    window.addEventListener('sso-external-page-opened', callback);
};

export const removeExternalPageOpenedCallback: (callback: () => void) => void = (callback) => {
    window.removeEventListener('sso-external-page-opened', callback);
};

export const removeSsoSuccessCallback: (callback: () => void) => void = (callback) => {
    window.removeEventListener('sso-success', callback);
};
export const removeSsoErrorCallback: (callback: () => void) => void = (callback) => {
    window.removeEventListener('sso-error', callback);
};

export const getRefreshToken: (key: string) => Promise<null | string> = async (key) => {
    if (oauthIpc) {
        return await oauthIpc.getRefreshToken(key);
    } else {
        return null;
    }
};

export const storeRefreshToken: (key: string, refreshToken: string) => Promise<void> = (
    key,
    refreshToken,
) => {
    if (oauthIpc) {
        return oauthIpc.storeRefreshToken(key, refreshToken);
    }
    return Promise.resolve();
};

const ssoCallback = (url: string) => {
    const customEvent = new CustomEvent('sso-callback', { detail: { url } });
    window.dispatchEvent(customEvent);
};

// If desktop app, listen for the oauth callback URL from the main process
if (oauthIpc) {
    oauthIpc.registerSSOCallback(ssoCallback);
}
