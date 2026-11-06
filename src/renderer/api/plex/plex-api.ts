import axios from 'axios';

import { useAuthStore } from '/@/renderer/store/auth.store';
import { getServerUrl } from '/@/renderer/utils/normalize-server-url';
import { plexContainer } from '/@/shared/api/plex/plex-types';
import { ServerListItemWithCredential } from '/@/shared/types/domain-types';

type ClientProps = {
    forceRemoteUrl?: boolean;
    server: null | ServerListItemWithCredential;
    signal?: AbortSignal;
};

export const plexHeaders = (credential: string) => ({
    Accept: 'application/json',
    'X-Plex-Client-Identifier': useAuthStore.getState().deviceId,
    'X-Plex-Product': 'Feishin',
    'X-Plex-Token': credential,
});

// Only server-relative paths are accepted: never forward a token to a metadata-provided host.
export const plexUrl = (base: string, path: string): URL => {
    if (!path.startsWith('/') || path.startsWith('//') || path.includes('\\')) {
        throw new Error('Invalid Plex resource path');
    }
    const url = new URL(base);
    if (
        !['http:', 'https:'].includes(url.protocol) ||
        url.username ||
        url.password ||
        url.search ||
        url.hash
    ) {
        throw new Error('Invalid Plex server URL');
    }
    url.pathname = `${url.pathname.replace(/\/$/, '')}${path.split('?')[0]}`;
    url.search = path.includes('?') ? path.slice(path.indexOf('?')) : '';
    return url;
};

export const plexRequest = async (
    props: ClientProps,
    path: string,
    params: Record<string, unknown> = {},
    method: 'DELETE' | 'GET' | 'POST' | 'PUT' = 'GET',
) => {
    const base = getServerUrl(props.server, props.forceRemoteUrl);
    if (!base || !props.server?.credential) throw new Error('Plex server and token are required');
    const response = await axios.request({
        headers: plexHeaders(props.server.credential),
        method,
        params,
        signal: props.signal,
        timeout: 30000,
        url: plexUrl(base, path).toString(),
    });
    return plexContainer.parse(response.data).MediaContainer;
};

export const plexMutation = async (
    props: ClientProps,
    path: string,
    params: Record<string, unknown> = {},
    method: 'DELETE' | 'GET' | 'POST' | 'PUT' = 'PUT',
) => {
    const base = getServerUrl(props.server, props.forceRemoteUrl);
    if (!base || !props.server?.credential) throw new Error('Plex server and token are required');
    await axios.request({
        headers: plexHeaders(props.server.credential),
        method,
        params,
        signal: props.signal,
        timeout: 30000,
        url: plexUrl(base, path).toString(),
    });
};
