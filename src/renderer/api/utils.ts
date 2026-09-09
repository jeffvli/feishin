import isElectron from 'is-electron';

import i18n from '/@/i18n/i18n';
import { useAuthStore } from '/@/renderer/store';
import { toast } from '/@/shared/components/toast/toast';
import { ServerListItem } from '/@/shared/types/types';

const localSettings = isElectron() ? window.api.localSettings : null;

const AUTH_FAILURE_TOAST_ID = 'auth-failure';

export const authenticationFailure = (currentServer: null | ServerListItem, message?: string) => {
    const store = useAuthStore.getState();
    const serverId = currentServer?.id ?? store.currentServer?.id;

    toast.error({
        id: AUTH_FAILURE_TOAST_ID,
        message: message ?? (i18n.t('error.sessionExpiredError') as string),
    });

    if (!serverId) {
        return;
    }

    console.error(
        `token is expired: ${currentServer?.ndCredential ?? store.currentServer?.ndCredential}`,
    );
    localSettings?.passwordRemove(serverId);

    // logout() clears credentials on the server list entry and sets currentServer to null.
    // If there is no current server, still clear the matching server list entry.
    if (store.currentServer) {
        store.actions.logout();
    } else {
        store.actions.updateServer(serverId, {
            credential: '',
            ndCredential: undefined,
            savePassword: false,
        });
    }
};

export const serializeCustomHeaders = (headers?: Record<string, string>): string => {
    if (!headers) return '';

    return Object.entries(headers)
        .map(([name, value]) => `${name}: ${value}`)
        .join('\n');
};

export const parseCustomHeaders = (raw?: null | string): Record<string, string> => {
    if (!raw?.trim()) return {};

    const headers: Record<string, string> = {};
    for (const line of raw.split(/\r?\n|,/)) {
        const separator = line.indexOf(':');
        if (separator <= 0) continue;

        const name = line.slice(0, separator).trim();
        const value = line.slice(separator + 1).trim();
        if (name && value) {
            headers[name] = value;
        }
    }

    return headers;
};

// Resolve the custom headers to send to a server. Precedence (highest last):
// env default (window.FS_SERVER_CUSTOM_HEADERS, e.g. baked into the web
// build), then caller-supplied headers, then the per-server setting.
export const getCustomRequestHeaders = (
    server?: null | ServerListItem,
    extra?: Record<string, string>,
): Record<string, string> => {
    return {
        ...parseCustomHeaders(window.FS_SERVER_CUSTOM_HEADERS),
        ...extra,
        ...server?.customHeaders,
    };
};
