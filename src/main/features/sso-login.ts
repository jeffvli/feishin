import { BrowserWindow, session } from 'electron';

import { SSO_COOKIE_KEYS } from '/@/shared/constants/sso-cookie-keys';
import { SsoLoginResponse } from '/@/shared/types/domain-types';

export const handleSsoLogin = async (
    _event: any,
    url: string,
    ssoCookieName = SSO_COOKIE_KEYS.CLOUDFLARE_ACCESS,
): Promise<SsoLoginResponse> => {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        throw new Error('Invalid SSO URL protocol');
    }

    const ssoWindow = new BrowserWindow({
        autoHideMenuBar: true,
        height: 800,
        title: 'SSO Login',
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
        },
        width: 600,
    });

    let success = false;

    return new Promise((resolve) => {
        ssoWindow.loadURL(url);

        const checkCookies = async () => {
            const cookies = await session.defaultSession.cookies.get({ url });
            const cookieMap: Record<string, string> = {};
            cookies.forEach((cookie) => {
                cookieMap[cookie.name] = cookie.value;
            });
            return cookieMap;
        };

        ssoWindow.on('closed', async () => {
            const cookies = await checkCookies();
            const finalSuccess = success || !!cookies[ssoCookieName];
            resolve({ cookies, success: finalSuccess });
        });

        // We could also poll or listen to navigation to see if we reached the app
        // but often SSO proxies redirect back to the original URL.
        ssoWindow.webContents.on('did-navigate', async (_event, navigatedUrl) => {
            if (navigatedUrl.startsWith(url)) {
                // Potential success, but let the user decide if they are done or wait for a specific cookie
                const cookies = await checkCookies();
                // If we see a typical SSO cookie, we might consider resolving early or just wait for window close.
                if (cookies[ssoCookieName]) {
                    success = true;
                    ssoWindow.close();
                }
            }
        });
    });
};
