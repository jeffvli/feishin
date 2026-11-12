import isElectron from 'is-electron';

import i18n from '/@/i18n/i18n';
import { useAuthStore } from '/@/renderer/store';
import { toast } from '/@/shared/components/toast/toast';

declare module 'axios' {
    interface AxiosRequestConfig {
        // Credential and server a request was sent with, so auth failures can be matched
        // against the session that is current when the response arrives.
        authCredential?: string;
        authServerId?: string;
    }
}

const localSettings = isElectron() ? window.api.localSettings : null;

const AUTH_FAILURE_TOAST_ID = 'auth-failure';

export const authenticationFailure = (args: {
    credential?: string;
    message?: string;
    serverId?: string;
}) => {
    const store = useAuthStore.getState();
    const server = args.serverId ? store.serverList[args.serverId] : undefined;

    // Only expire the session the failing request was authenticated with. Requests sent without
    // credentials (after logout) or with credentials that have since been replaced (in flight across
    // a re-login) must not log the user out of the session they just created.
    if (
        !server ||
        !args.credential ||
        (args.credential !== server.credential && args.credential !== server.ndCredential)
    ) {
        return;
    }

    toast.error({
        id: AUTH_FAILURE_TOAST_ID,
        message: args.message ?? (i18n.t('error.sessionExpiredError') as string),
    });

    localSettings?.passwordRemove(server.id);

    // logout() clears credentials on the server list entry and sets currentServer to null.
    // If the failing server is not the current one, still clear its server list entry.
    if (store.currentServer?.id === server.id) {
        store.actions.logout();
    } else {
        store.actions.updateServer(server.id, {
            credential: '',
            ndCredential: undefined,
            savePassword: false,
        });
    }
};
