import isElectron from 'is-electron';

const serverHeaders = isElectron() ? window.api?.serverHeaders : null;

// Headers of saved servers are synced to the main process by the auth store. A server
// that is being added or edited is not saved yet, so its headers are registered
// temporarily to be applied to the authentication requests. Call without arguments to clear.
export const setPendingServerHeaders = async (url?: string, headers?: Record<string, string>) => {
    if (!serverHeaders) return;

    const rules =
        url && headers && Object.keys(headers).length > 0 ? [{ baseUrl: url, headers }] : [];

    try {
        await serverHeaders.setPending(rules);
    } catch {
        // Ignore, the request will fail with the proxy's response instead
    }
};
