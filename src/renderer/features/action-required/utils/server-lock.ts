import { ServerListItemWithCredential } from '/@/shared/types/domain-types';
import { ServerType } from '/@/shared/types/types';

export const normalizeServerUrl = (url: string) => url.replace(/\/$/, '');

export const findExistingServerLockServer = (
    serverList: Record<string, ServerListItemWithCredential>,
    configuredUrl: string,
    serverType?: null | ServerType,
): ServerListItemWithCredential | undefined => {
    const servers = Object.values(serverList);

    if (servers.length === 0) {
        return undefined;
    }

    const normalizedUrl = normalizeServerUrl(configuredUrl);
    const byUrl = servers.find((server) => normalizeServerUrl(server.url) === normalizedUrl);

    if (byUrl) {
        return byUrl;
    }

    // Server lock allows only one server — reuse the existing entry even if the URL changed.
    if (servers.length === 1) {
        return servers[0];
    }

    if (serverType) {
        return servers.find((server) => server.type === serverType);
    }

    return undefined;
};
