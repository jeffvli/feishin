import { ServerListItem } from '/@/shared/types/domain-types';

export const normalizeServerUrl = (url: string) => {
    const trimmed = url.trim();
    // Remove trailing slash
    return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
};

export const getServerUrl = (
    server: null | ServerListItem | undefined,
    forceRemoteUrl?: boolean,
): string | undefined => {
    if (!server) {
        return undefined;
    }

    if (!forceRemoteUrl && !server.preferRemoteUrl) {
        return server.url;
    }

    if (!server.remoteUrl) {
        return server.url;
    }

    return server.remoteUrl;
};
