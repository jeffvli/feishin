import axios from 'axios';

import { plexHeaders, plexRequest, plexUrl } from '/@/renderer/api/plex/plex-api';
import { logger } from '/@/renderer/utils/logger';
import {
    plexAccount,
    plexContainer,
    plexOAuthServer,
    PlexOAuthServer,
    plexPin,
    plexResources,
} from '/@/shared/api/plex/plex-types';
import { ServerListItemWithCredential, ServerType } from '/@/shared/types/domain-types';

const cloudRequest = async (
    path: string,
    signal?: AbortSignal,
    credential = '',
    method: 'GET' | 'POST' = 'GET',
    params: Record<string, unknown> = {},
) => {
    const response = await axios.request({
        headers: plexHeaders(credential),
        method,
        params,
        signal,
        timeout: 30000,
        url: `https://plex.tv/api/v2/${path}`,
    });
    return response.data;
};

const getIdentity = async (url: string, signal?: AbortSignal) => {
    const response = await axios.get(plexUrl(url, '/identity').toString(), {
        headers: { Accept: 'application/json' },
        signal,
        timeout: 5000,
    });
    return plexContainer.parse(response.data).MediaContainer.machineIdentifier;
};

const connectServer = async (
    resource: PlexOAuthServer,
    body: Record<string, any>,
    preferredUrl: string,
    signal?: AbortSignal,
) => {
    const connections = resource.connections
        .filter((entry) => resource.owned || !entry.local)
        .sort((a, b) => {
            const rank = (entry: typeof a) =>
                (entry.relay ? 4 : entry.local ? 0 : 2) + (entry.url.startsWith('https:') ? 0 : 1);
            return rank(a) - rank(b);
        });
    const urls = [
        ...new Set([
            ...(preferredUrl ? [preferredUrl] : []),
            ...connections.map((entry) => entry.url),
        ]),
    ];
    let noMusic = false;
    for (const candidate of urls) {
        if (signal?.aborted) signal.throwIfAborted();
        try {
            // Validate before attaching any credentials; never accept non-HTTP URLs from discovery.
            const url = plexUrl(candidate, '/').toString().replace(/\/$/, '');
            if ((resource.httpsRequired || body.httpsOnly) && !url.startsWith('https://')) continue;
            const probeSignal = AbortSignal.any([
                ...(signal ? [signal] : []),
                AbortSignal.timeout(5000),
            ]);
            if ((await getIdentity(url, probeSignal)) !== resource.id) continue;
            const server: ServerListItemWithCredential = {
                credential: resource.credential,
                id: '',
                name: resource.name,
                type: ServerType.PLEX,
                url,
                userId: body.userId,
                username: body.username,
            };
            const libraries = await plexRequest(
                { server, signal: probeSignal },
                '/library/sections',
            );
            if (!libraries.Directory?.some((entry) => entry.type === 'artist')) {
                noMusic = true;
                continue;
            }
            return {
                credential: resource.credential,
                isAdmin: false,
                name: resource.name,
                plexServerId: resource.id,
                url,
                userId: body.userId,
                username: body.username,
            };
        } catch (error) {
            if (signal?.aborted) throw error;
            // Try the remaining advertised connections, including Plex Relay, before failing.
            logger.debug('Plex connection attempt failed; trying the next address', {
                error: error instanceof Error ? error.message : String(error),
                serverId: resource.id,
            });
        }
    }
    throw new Error(
        noMusic
            ? 'This Plex server has no accessible music libraries'
            : 'Unable to reach this Plex server. Check that it is online and allows remote access.',
    );
};

export const authenticatePlex = async (url: string, body: Record<string, any>) => {
    const signal: AbortSignal | undefined = body.signal;

    if (body.action === 'oauthInitiate') {
        const pin = plexPin.parse(await cloudRequest('pins', signal, '', 'POST', { strong: true }));
        if (!pin.expiresIn) throw new Error('Plex authorization has expired');
        const params = new URLSearchParams({
            clientID: plexHeaders('')['X-Plex-Client-Identifier'],
            code: pin.code,
            'context[device][product]': 'Feishin',
        });
        return {
            authUrl: `https://app.plex.tv/auth#?${params}`,
            code: pin.code,
            expiresIn: pin.expiresIn,
            id: pin.id,
        };
    }

    if (body.action === 'oauthPoll') {
        if (
            !Number.isSafeInteger(body.pinId) ||
            body.pinId <= 0 ||
            typeof body.code !== 'string' ||
            !body.code
        )
            throw new Error('Invalid Plex authorization request');
        const pin = plexPin.parse(
            await cloudRequest(`pins/${body.pinId}`, signal, '', 'GET', { code: body.code }),
        );
        if (pin.id !== body.pinId || pin.code !== body.code)
            throw new Error('Plex authorization request does not match');
        if (!pin.expiresIn) throw new Error('Plex authorization has expired');
        if (!pin.authToken) return null;

        // plex.tv advertises the user's servers and all connection candidates, including shared servers.
        const [resourcesData, accountData] = await Promise.all([
            cloudRequest('resources', signal, pin.authToken, 'GET', {
                includeHttps: 1,
                includeRelay: 1,
            }),
            cloudRequest('user', signal, pin.authToken),
        ]);
        let resources = plexResources.parse(resourcesData).filter(
            (entry) =>
                entry.accessToken &&
                entry.provides
                    .split(',')
                    .map((value) => value.trim())
                    .includes('server'),
        );
        // A configured URL or saved server ID restricts locked deployments and credential renewal.
        const machineId =
            body.serverId || (url.trim() ? await getIdentity(url.trim(), signal) : undefined);
        if (machineId)
            resources = resources.filter((entry) => entry.clientIdentifier === machineId);
        if (!resources.length)
            throw new Error('No accessible Plex servers were found for this account');
        const account = plexAccount.parse(accountData);
        return {
            servers: resources.map((entry) => ({
                connections: entry.connections.map((connection) => ({
                    local: connection.local,
                    relay: connection.relay,
                    url: connection.uri,
                })),
                credential: entry.accessToken!,
                httpsRequired: entry.httpsRequired,
                id: entry.clientIdentifier,
                name: entry.name || entry.clientIdentifier,
                owned: entry.owned,
            })),
            userId: account.id,
            username: account.username || account.title || 'Plex',
        };
    }

    if (body.action === 'oauthConnect') {
        if (
            typeof body.userId !== 'string' ||
            !body.userId ||
            typeof body.username !== 'string' ||
            !body.username
        )
            throw new Error('Invalid Plex account');
        return connectServer(plexOAuthServer.parse(body.server), body, url.trim(), signal);
    }
    if (body.action !== undefined) throw new Error('Unsupported Plex authentication action');
    const credential = typeof body.password === 'string' ? body.password.trim() : '';
    if (!credential) throw new Error('A Plex token is required');
    const username =
        typeof body.username === 'string' && body.username.trim() ? body.username.trim() : 'Plex';
    const userId = 'plex';
    const server: ServerListItemWithCredential = {
        credential,
        id: '',
        name: 'Plex',
        type: ServerType.PLEX,
        url: url.trim().replace(/\/$/, ''),
        userId,
        username,
    };
    await plexRequest({ server, signal }, '/library/sections');
    return { credential, isAdmin: false, userId, username };
};
