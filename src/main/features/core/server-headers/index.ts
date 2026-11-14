import type { ServerHeaderRule } from '/@/shared/utils/server-headers';

import { app, ipcMain, session } from 'electron';

import { getMainWindow } from '/@/main/index';
import log from '/@/main/logger';

export type { ServerHeaderRule };

let serverHeaderRules: ServerHeaderRule[] = [];
// Rules for servers that are not saved yet (e.g. while adding a server). They take
// precedence over saved rules so edited headers are used for re-authentication.
let pendingHeaderRules: ServerHeaderRule[] = [];

// Headers Feishin itself uses to authenticate against the server. A custom header must
// never replace them, otherwise the server login breaks (e.g. Jellyfin's Authorization).
const PROTECTED_HEADERS = new Set(['authorization', 'x-emby-authorization', 'x-nd-authorization']);
let interceptorRegistered = false;

const normalizeBaseUrl = (url: string) => {
    try {
        const parsed = new URL(url);
        const pathname = parsed.pathname.replace(/\/+$/, '');
        return `${parsed.origin}${pathname}`;
    } catch {
        return url.trim().replace(/\/+$/, '');
    }
};

const normalizeRules = (rules: ServerHeaderRule[]) =>
    (Array.isArray(rules) ? rules : [])
        .map((rule) => ({
            baseUrl: normalizeBaseUrl(rule.baseUrl),
            headers: rule.headers || {},
        }))
        .filter((rule) => rule.baseUrl && Object.keys(rule.headers).length > 0);

export const setServerHeaderRules = (rules: ServerHeaderRule[]) => {
    serverHeaderRules = normalizeRules(rules);
};

export const findMatchingRule = (urlStr: string) => {
    for (const rule of [...pendingHeaderRules, ...serverHeaderRules]) {
        if (
            urlStr === rule.baseUrl ||
            urlStr.startsWith(`${rule.baseUrl}/`) ||
            urlStr.startsWith(`${rule.baseUrl}?`)
        ) {
            return rule;
        }
    }
    return null;
};

const registerNetworkInterceptor = () => {
    if (interceptorRegistered) return;
    interceptorRegistered = true;

    session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
        try {
            // Only requests made by the app itself, never by other windows
            const mainWindow = getMainWindow();
            const isFromMainWindow =
                !!mainWindow &&
                !mainWindow.isDestroyed() &&
                details.webContentsId === mainWindow.webContents.id;

            const rule = isFromMainWindow ? findMatchingRule(details.url) : null;
            if (rule) {
                for (const [customKey, customValue] of Object.entries(rule.headers)) {
                    const lowerKey = customKey.toLowerCase();
                    const existingKeys = Object.keys(details.requestHeaders).filter(
                        (existingKey) => existingKey.toLowerCase() === lowerKey,
                    );

                    if (PROTECTED_HEADERS.has(lowerKey) && existingKeys.length > 0) {
                        continue;
                    }

                    for (const existingKey of existingKeys) {
                        delete details.requestHeaders[existingKey];
                    }
                    details.requestHeaders[customKey] = customValue;
                }
            }
        } catch (error) {
            log.error('Failed to apply server headers in webRequest', error);
        }

        callback({ requestHeaders: details.requestHeaders });
    });
};

ipcMain.handle('server-headers-sync', (_event, rules: ServerHeaderRule[]) => {
    setServerHeaderRules(rules);
});

ipcMain.handle('server-headers-set-pending', (_event, rules: ServerHeaderRule[]) => {
    pendingHeaderRules = normalizeRules(rules);
});

ipcMain.handle('session-clear-server-cookies', async (_event, serverUrl: string) => {
    if (!serverUrl) return false;
    try {
        const parsed = new URL(serverUrl);
        const cookies = await session.defaultSession.cookies.get({ domain: parsed.hostname });
        for (const cookie of cookies) {
            const domain = (cookie.domain || parsed.hostname).replace(/^\./, '');
            const protocol = cookie.secure ? 'https://' : 'http://';
            const path = cookie.path || '/';
            const cookieUrl = `${protocol}${domain}${path}`;
            await session.defaultSession.cookies.remove(cookieUrl, cookie.name);
        }
        log.info('Cleared session cookies for server', {
            count: cookies.length,
            hostname: parsed.hostname,
        });
        return true;
    } catch (error) {
        log.error('Failed to clear server cookies', error);
        return false;
    }
});

app.whenReady()
    .then(() => registerNetworkInterceptor())
    .catch((error) => log.error('Failed to register server headers interceptor', error));
