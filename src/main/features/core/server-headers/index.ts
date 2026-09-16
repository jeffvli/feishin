import { app, ipcMain, session } from 'electron';

import log from '/@/main/logger';

export type ServerHeaderRule = {
    baseUrl: string;
    headers: Record<string, string>;
};

let serverHeaderRules: { baseUrl: string; headers: Record<string, string> }[] = [];
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

export const setServerHeaderRules = (rules: ServerHeaderRule[]) => {
    serverHeaderRules = (rules || [])
        .map((rule) => ({
            baseUrl: normalizeBaseUrl(rule.baseUrl),
            headers: rule.headers || {},
        }))
        .filter((rule) => rule.baseUrl && Object.keys(rule.headers).length > 0);
};

export const findMatchingRule = (urlStr: string) => {
    for (const rule of serverHeaderRules) {
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
            const rule = findMatchingRule(details.url);
            if (rule) {
                for (const [customKey, customValue] of Object.entries(rule.headers)) {
                    const lowerKey = customKey.toLowerCase();
                    for (const existingKey of Object.keys(details.requestHeaders)) {
                        if (existingKey.toLowerCase() === lowerKey) {
                            delete details.requestHeaders[existingKey];
                        }
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

app.whenReady()
    .then(() => registerNetworkInterceptor())
    .catch((error) => log.error('Failed to register server headers interceptor', error));
