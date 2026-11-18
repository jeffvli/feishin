import { Client, SetActivity } from '@xhayper/discord-rpc';
import { ipcMain } from 'electron';

import log from '/@/main/logger';

const FEISHIN_DISCORD_APPLICATION_ID = '1165957668758900787';

let client: Client | null = null;

const createClient = async (clientId?: string) => {
    client = new Client({
        clientId: clientId || FEISHIN_DISCORD_APPLICATION_ID,
    });

    await client.login();

    return client;
};

const isConnected = () => {
    return client?.isConnected;
};

const setActivity = (activity: SetActivity) => {
    if (client) {
        void client.user?.setActivity({ ...activity }).catch((error) => {
            log.warn('Discord RPC set activity failed', error);
        });
    }
};

const clearActivity = () => {
    if (client) {
        void client.user?.clearActivity().catch((error) => {
            log.warn('Discord RPC clear activity failed', error);
        });
    }
};

const quit = () => {
    if (client) {
        void client.destroy().catch((error) => {
            log.error('Discord RPC destroy failed', error);
        });
    }
};

export interface CoverLookupQuery {
    album?: string;
    albumArtist?: string;
    artist?: string;
    mbzAlbumId?: string;
}

const COVER_CACHE_MAX = 500;
const COVER_LOOKUP_TIMEOUT_MS = 5000;
const coverCache = new Map<string, null | string>();

const normalize = (value?: string) =>
    (value || '')
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/\s*[([].*?(deluxe|edition|remaster|version|expanded|anniversary).*?[)\]]/g, '')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();

const fetchWithTimeout = async (url: string, init?: RequestInit) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), COVER_LOOKUP_TIMEOUT_MS);
    try {
        return await fetch(url, {
            ...init,
            headers: { 'User-Agent': 'Feishin (https://github.com/jeffvli/feishin)' },
            signal: controller.signal,
        });
    } finally {
        clearTimeout(timeout);
    }
};

// Cover Art Archive (MusicBrainz) - exact match when the file is tagged with a release MBID
const lookupCoverArtArchive = async (mbzAlbumId: string) => {
    const response = await fetchWithTimeout(
        `https://coverartarchive.org/release/${encodeURIComponent(mbzAlbumId)}/front-500`,
        { method: 'HEAD', redirect: 'follow' },
    );
    return response.ok ? response.url : null;
};

const pickBest = <T>(
    items: T[],
    getAlbum: (item: T) => string,
    getArtist: (item: T) => string,
    query: CoverLookupQuery,
) => {
    const album = normalize(query.album);
    const artists = [query.albumArtist, query.artist].map(normalize).filter(Boolean);
    const artistMatches = (item: T) => {
        const itemArtist = normalize(getArtist(item));
        return artists.some((a) => itemArtist.includes(a) || a.includes(itemArtist));
    };

    return (
        items.find((item) => normalize(getAlbum(item)) === album && artistMatches(item)) ||
        items.find((item) => normalize(getAlbum(item)).includes(album) && artistMatches(item)) ||
        null
    );
};

const lookupITunes = async (query: CoverLookupQuery) => {
    const term = `${query.albumArtist || query.artist || ''} ${query.album}`.trim();
    const response = await fetchWithTimeout(
        `https://itunes.apple.com/search?media=music&entity=album&limit=10&term=${encodeURIComponent(term)}`,
    );
    if (!response.ok) return null;
    const json = (await response.json()) as {
        results?: { artistName: string; artworkUrl100?: string; collectionName: string }[];
    };
    const best = pickBest(
        json.results || [],
        (r) => r.collectionName,
        (r) => r.artistName,
        query,
    );
    return best?.artworkUrl100?.replace(/\/\d+x\d+bb\./, '/600x600bb.') || null;
};

const lookupDeezer = async (query: CoverLookupQuery) => {
    const q = `${query.albumArtist || query.artist || ''} ${query.album}`.trim();
    const response = await fetchWithTimeout(
        `https://api.deezer.com/search/album?limit=10&q=${encodeURIComponent(q)}`,
    );
    if (!response.ok) return null;
    const json = (await response.json()) as {
        data?: { artist?: { name: string }; cover_xl?: string; title: string }[];
    };
    const best = pickBest(
        json.data || [],
        (r) => r.title,
        (r) => r.artist?.name || '',
        query,
    );
    return best?.cover_xl || null;
};

const lookupCover = async (query: CoverLookupQuery): Promise<null | string> => {
    if (!query.album && !query.mbzAlbumId) return null;

    const key = JSON.stringify([
        query.mbzAlbumId,
        normalize(query.album),
        normalize(query.albumArtist || query.artist),
    ]);
    if (coverCache.has(key)) return coverCache.get(key)!;

    const sources: (() => Promise<null | string>)[] = [];
    if (query.mbzAlbumId) sources.push(() => lookupCoverArtArchive(query.mbzAlbumId!));
    if (query.album && (query.albumArtist || query.artist)) {
        sources.push(
            () => lookupITunes(query),
            () => lookupDeezer(query),
        );
    }

    let result: null | string = null;
    for (const source of sources) {
        try {
            result = await source();
        } catch (error) {
            log.debug('Discord RPC cover lookup source failed', error);
        }
        if (result) break;
    }

    if (coverCache.size >= COVER_CACHE_MAX) {
        coverCache.delete(coverCache.keys().next().value!);
    }
    coverCache.set(key, result);
    return result;
};

ipcMain.handle('discord-rpc-lookup-cover', (_event, query: CoverLookupQuery) => {
    return lookupCover(query);
});

ipcMain.handle('discord-rpc-initialize', async (_event, clientId?: string) => {
    try {
        await createClient(clientId);
        log.info('Discord RPC initialized');
    } catch (error) {
        log.error('Discord RPC initialize failed', error);
        throw error;
    }
});

ipcMain.handle('discord-rpc-is-connected', () => {
    return isConnected();
});

ipcMain.handle('discord-rpc-set-activity', (_event, activity: SetActivity) => {
    setActivity(activity);
});

ipcMain.handle('discord-rpc-clear-activity', () => {
    clearActivity();
});

ipcMain.handle('discord-rpc-quit', () => {
    quit();
    client = null;
    log.info('Discord RPC quit');
});

export const discordRpc = {
    clearActivity,
    createClient,
    isConnected,
    lookupCover,
    quit,
    setActivity,
};
