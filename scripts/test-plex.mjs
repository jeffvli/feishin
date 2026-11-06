import axios from 'axios';
// Run with Node >=22.15: node scripts/test-plex.mjs. No Plex account or running server required.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

registerHooks({
    load(url, context, next) {
        if (!url.endsWith('.ts')) return next(url, context);
        return {
            format: 'module',
            shortCircuit: true,
            source: ts.transpileModule(readFileSync(fileURLToPath(url), 'utf8'), {
                compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
            }).outputText,
        };
    },
    resolve(specifier, context, next) {
        if (specifier === '/@/renderer/utils/logger')
            return {
                shortCircuit: true,
                url: 'data:text/javascript,export const logger = {debug() {}};',
            };
        if (specifier === '/@/renderer/store/auth.store') {
            return {
                shortCircuit: true,
                url: 'data:text/javascript,export const useAuthStore = { getState: () => ({ deviceId: "test-device" }) };',
            };
        }
        if (specifier.startsWith('/@/')) {
            return {
                shortCircuit: true,
                url: new URL(`../src/${specifier.slice(3)}.ts`, import.meta.url).href,
            };
        }
        if (specifier.startsWith('lodash/') || specifier.startsWith('semver/functions/'))
            return next(`${specifier}.js`, context);
        return next(specifier, context);
    },
});

const { PlexController: api } = await import('../src/renderer/api/plex/plex-controller.ts');
const { plexUrl } = await import('../src/renderer/api/plex/plex-api.ts');
const { plexNormalize } = await import('../src/shared/api/plex/plex-normalize.ts');
const { plexMetadata } = await import('../src/shared/api/plex/plex-types.ts');

const server = {
    credential: 'secret-token',
    id: 'server-1',
    name: 'Music',
    remoteUrl: 'https://remote.example/plex',
    type: 'plex',
    url: 'https://plex.example/proxy',
    userId: 'plex',
    username: 'Listener',
};
const apiClientProps = { server, serverId: server.id };
const track = {
    duration: 123456,
    grandparentRatingKey: '1',
    grandparentTitle: 'Album artist',
    index: 3,
    key: '/library/metadata/3',
    Media: [
        {
            audioCodec: 'flac',
            bitrate: 900,
            container: 'flac',
            Part: [
                {
                    file: '/music/song.flac',
                    key: '/library/parts/30/file.flac',
                    size: 123,
                    Stream: [{ bitDepth: 24, samplingRate: 96000, streamType: 2 }],
                },
            ],
        },
    ],
    originalTitle: 'Guest artist',
    parentIndex: 2,
    parentRatingKey: '2',
    parentThumb: '/library/metadata/2/thumb/123',
    parentTitle: 'Album',
    playlistItemID: '300',
    ratingKey: '3',
    title: 'Song',
    type: 'track',
    userRating: 8,
    year: 2024,
};
const playlist = {
    key: '/playlists/9',
    playlistType: 'audio',
    ratingKey: '9',
    smart: false,
    title: 'Playlist',
    type: 'playlist',
};
const calls = [];
let failAppend = false;
let failMove = false;
let smart = false;
let unauthorized = false;
let playlistTracks = [track, { ...track, playlistItemID: '301' }];

axios.defaults.adapter = async (config) => {
    calls.push(config);
    if (unauthorized)
        throw new axios.AxiosError(
            'Request failed with status code 401',
            'ERR_BAD_REQUEST',
            config,
            undefined,
            { status: 401 },
        );
    assert.equal(config.headers.get('X-Plex-Token'), server.credential);
    assert.equal(config.headers.get('X-Plex-Client-Identifier'), 'test-device');
    const path = new URL(config.url).pathname.replace(/^\/(proxy|plex)/, '');
    let container = {};
    if (path === '/library/sections')
        container = {
            Directory: [
                { key: '7', title: 'Music', type: 'artist' },
                { key: '8', title: 'Movies', type: 'movie' },
            ],
        };
    else if (path === '/') container = { machineIdentifier: 'machine-1', version: '1.40.0' };
    else if (path === '/library/metadata/3') container = { Metadata: [track] };
    else if (path === '/library/metadata/2')
        container = {
            Metadata: [
                { key: '/library/metadata/2', ratingKey: '2', title: 'Album', type: 'album' },
            ],
        };
    else if (path === '/library/metadata/2/children')
        container = {
            Metadata: [track, { ...track, index: 1, parentIndex: 1, ratingKey: '4' }],
            size: 2,
        };
    else if (path === '/playlists/9') container = { Metadata: [{ ...playlist, smart }] };
    else if (path === '/playlists') container = { Metadata: [playlist], size: 1 };
    else if (path === '/playlists/9/items' && config.method === 'get')
        container = { Metadata: playlistTracks, size: playlistTracks.length };
    else if (/^\/playlists\/9\/items\/[^/]+\/move$/.test(path) && config.method === 'put') {
        if (failMove) throw new Error('Simulated move failure');
        const id = path.split('/').at(-2);
        const from = playlistTracks.findIndex((entry) => entry.playlistItemID === id);
        assert.ok(from >= 0);
        const [entry] = playlistTracks.splice(from, 1);
        const after = config.params.after;
        const index = after
            ? playlistTracks.findIndex((item) => item.playlistItemID === after) + 1
            : 0;
        playlistTracks.splice(index, 0, entry);
    } else if (path === '/playlists/9/items' && config.method === 'put' && failAppend)
        throw new Error('Simulated network failure');
    else if (path === '/library/all' || path === '/library/sections/7/all') {
        const start = config.params['X-Plex-Container-Start'];
        const size = config.params['X-Plex-Container-Size'];
        // Deliberately return only one item per page to exercise server-imposed pagination.
        container = {
            Metadata: size === 0 || start >= 3 ? [] : [{ ...track, ratingKey: String(start + 3) }],
            size: size === 0 ? 0 : 1,
            totalSize: 3,
        };
    }
    return {
        config,
        data: { MediaContainer: container },
        headers: {},
        status: 200,
        statusText: 'OK',
    };
};

const song = plexNormalize.song(plexMetadata.parse(track), server);
assert.equal(song.duration, 123456);
assert.equal(song.sampleRate, 96000);
assert.equal(song.bitDepth, 24);
assert.equal(song.albumId, '2');
assert.equal(song.artistName, 'Guest artist');
assert.equal(song.albumArtists[0].name, 'Album artist');
assert.equal(song.playlistItemId, '300');
assert.equal(song.userRating, 4);
assert.equal(song.userFavorite, false);
assert.equal(
    plexNormalize.song(plexMetadata.parse({ ...track, userRating: 10 }), server).userFavorite,
    true,
);
assert.equal(song.imageId, track.parentThumb);
assert.equal(
    plexNormalize.song(
        plexMetadata.parse({ key: '/library/metadata/4', ratingKey: 4, title: 'Minimal' }),
        server,
    ).duration,
    0,
);
assert.throws(() => plexMetadata.parse({ title: 'Invalid' }));

const auth = await api.authenticate(server.url, { password: ` ${server.credential} ` });
assert.equal(auth.credential, server.credential);
assert.equal(auth.username, 'Plex');
await assert.rejects(api.authenticate(server.url, { password: '' }));
assert.equal((await api.getMusicFolderList({ apiClientProps })).items.length, 1);
assert.equal((await api.getUserInfo({ apiClientProps, query: { id: 'plex' } })).id, 'plex');
unauthorized = true;
await assert.rejects(api.getUserInfo({ apiClientProps, query: { id: 'plex' } }), { status: 401 });
unauthorized = false;
const aborted = new AbortController();
aborted.abort();
await assert.rejects(
    api.getMusicFolderList({ apiClientProps: { ...apiClientProps, signal: aborted.signal } }),
    { code: 'ERR_CANCELED' },
);

const query = { sortBy: 'name', sortOrder: 'ASC', startIndex: 0 };
const page = await api.getSongList({ apiClientProps, query });
assert.equal(page.items.length, 3);
assert.equal(page.totalRecordCount, 3);
assert.deepEqual(
    page.items.map((entry) => entry.id),
    ['3', '4', '5'],
);
assert.equal(
    (await api.getSongList({ apiClientProps, query: { ...query, limit: -1 } })).items.length,
    3,
);
const album = await api.getAlbumDetail({ apiClientProps, query: { id: '2' } });
assert.equal(album.songCount, 2);
assert.equal(album.duration, track.duration * 2);
assert.deepEqual(
    album.songs.map((entry) => entry.discNumber),
    [1, 2],
);
assert.equal(await api.getSongListCount({ apiClientProps, query }), 3);
await api.getSongList({
    apiClientProps,
    query: {
        ...query,
        albumIds: ['2'],
        favorite: true,
        limit: 1,
        musicFolderId: ['7'],
        startIndex: 1,
    },
});
assert.equal(calls.at(-1).params['album.id'], '2');
assert.equal(calls.at(-1).params.userRating, 10);
assert.equal(calls.at(-1).params['X-Plex-Container-Start'], 1);
assert.equal(new URL(calls.at(-1).url).pathname, '/proxy/library/sections/7/all');

const direct = new URL(
    await api.getStreamUrl({ apiClientProps, query: { id: '3', transcode: false } }),
);
assert.equal(direct.pathname, '/proxy/library/parts/30/file.flac');
assert.equal(direct.searchParams.get('X-Plex-Token'), server.credential);
assert.equal(direct.searchParams.get('X-Plex-Client-Identifier'), 'test-device');
assert.equal(direct.searchParams.get('X-Plex-Product'), 'Feishin');
const remote = new URL(
    await api.getStreamUrl({
        apiClientProps: { ...apiClientProps, forceRemoteUrl: true },
        query: { id: '3', transcode: false },
    }),
);
assert.equal(remote.origin, 'https://remote.example');
assert.equal(remote.pathname, '/plex/library/parts/30/file.flac');
const transcode = new URL(
    await api.getStreamUrl({ apiClientProps, query: { bitrate: 128, id: '3', transcode: true } }),
);
assert.equal(transcode.pathname, '/proxy/music/:/transcode/universal/start.mp3');
assert.equal(transcode.searchParams.get('audioBitrate'), '128');
assert.equal(transcode.searchParams.get('X-Plex-Client-Identifier'), 'test-device');
assert.equal(
    new URL(await api.getDownloadUrl({ apiClientProps, query: { id: '3' } })).searchParams.get(
        'download',
    ),
    '1',
);
const image = api.getImageRequest({
    apiClientProps,
    query: { id: track.parentThumb, itemType: 'song' },
});
assert.equal(new URL(image.url).pathname, `/proxy${track.parentThumb}`);
assert.ok(!image.url.includes(server.credential));
assert.ok(!image.cacheKey.includes(server.credential));
assert.throws(() => plexUrl(server.url, '//evil.example/image'));
assert.throws(() => plexUrl(server.url, 'https://evil.example/image'));
assert.throws(() => plexUrl('file:///etc', '/library'));
assert.throws(() => plexUrl('https://user:pass@plex.example', '/library'));

const entries = await api.getPlaylistSongList({ apiClientProps, query: { id: '9' } });
assert.equal(
    (await api.createPlaylist({ apiClientProps, body: { name: 'New playlist' } })).id,
    '9',
);
assert.equal(calls.at(-1).params.title, 'New playlist');
assert.equal(calls.at(-1).method, 'post');
assert.equal(
    (await api.getPlaylistDetail({ apiClientProps, query: { id: '9' } })).name,
    'Playlist',
);
assert.deepEqual(
    entries.items.map((entry) => entry.playlistItemId),
    ['300', '301'],
);
await api.removeFromPlaylist({ apiClientProps, query: { id: '9', songId: ['301'] } });
assert.equal(new URL(calls.at(-1).url).pathname, '/proxy/playlists/9/items/301');
await api.addToPlaylist({ apiClientProps, body: { songId: ['3', '3'] }, query: { id: '9' } });
assert.equal(
    calls.at(-1).params.uri,
    'server://machine-1/com.plexapp.plugins.library/library/metadata/3,3',
);
smart = true;
await assert.rejects(
    api.addToPlaylist({ apiClientProps, body: { songId: ['3'] }, query: { id: '9' } }),
    /regular Plex music playlists/,
);
smart = false;
failAppend = true;
const before = calls.length;
await assert.rejects(
    api.replacePlaylist({ apiClientProps, body: { songId: ['3'] }, query: { id: '9' } }),
    /Simulated network failure/,
);
assert.ok(
    !calls.slice(before).some((call) => call.method === 'delete'),
    'An unsuccessful replacement must not erase the old playlist',
);
failAppend = false;
const replacementStart = calls.length;
await api.replacePlaylist({ apiClientProps, body: { songId: ['3'] }, query: { id: '9' } });
const replacementCalls = calls.slice(replacementStart);
const firstDelete = replacementCalls.findIndex((call) => call.method === 'delete');
const append = replacementCalls.findIndex((call) => call.method === 'put');
assert.ok(append >= 0 && firstDelete > append);
assert.equal(replacementCalls.filter((call) => call.method === 'delete').length, 2);

playlistTracks = [
    track,
    { ...track, playlistItemID: '301', ratingKey: '4' },
    { ...track, playlistItemID: '302' },
];
const reorderStart = calls.length;
await api.setPlaylistSongs({ apiClientProps, body: { id: '9', songIds: ['3', '3', '4'] } });
assert.deepEqual(
    playlistTracks.map((entry) => entry.playlistItemID),
    ['300', '302', '301'],
);
let reorderWrites = calls.slice(reorderStart).filter((call) => call.method !== 'get');
assert.equal(reorderWrites.length, 1);
assert.equal(new URL(reorderWrites[0].url).pathname, '/proxy/playlists/9/items/302/move');
assert.equal(reorderWrites[0].params.after, '300');
const moveToStart = calls.length;
await api.setPlaylistSongs({ apiClientProps, body: { id: '9', songIds: ['4', '3', '3'] } });
assert.deepEqual(
    playlistTracks.map((entry) => entry.playlistItemID),
    ['301', '300', '302'],
);
reorderWrites = calls.slice(moveToStart).filter((call) => call.method !== 'get');
assert.equal(reorderWrites.length, 1);
assert.equal(new URL(reorderWrites[0].url).pathname, '/proxy/playlists/9/items/301/move');
assert.deepEqual(reorderWrites[0].params, {});
const unchanged = calls.length;
await api.setPlaylistSongs({ apiClientProps, body: { id: '9', songIds: ['4', '3', '3'] } });
assert.ok(!calls.slice(unchanged).some((call) => call.method !== 'get'));
failMove = true;
const failedReorder = calls.length;
await assert.rejects(
    api.setPlaylistSongs({ apiClientProps, body: { id: '9', songIds: ['3', '4', '3'] } }),
    /Simulated move failure/,
);
assert.deepEqual(
    playlistTracks.map((entry) => entry.playlistItemID),
    ['301', '300', '302'],
);
assert.ok(
    calls.slice(failedReorder).every((call) => call.method === 'get' || call.url.endsWith('/move')),
    'A failed reorder must not fall back to appending or deleting tracks',
);
failMove = false;
smart = true;
const smartReorder = calls.length;
await assert.rejects(
    api.setPlaylistSongs({ apiClientProps, body: { id: '9', songIds: ['3', '4', '3'] } }),
    /regular Plex music playlists/,
);
assert.ok(!calls.slice(smartReorder).some((call) => call.method !== 'get'));
smart = false;
await assert.rejects(
    api.movePlaylistItem({
        apiClientProps,
        query: { endingIndex: 0.5, playlistId: '9', trackId: '301' },
    }),
    /Invalid Plex playlist position/,
);
playlistTracks = [track, { ...track, playlistItemID: undefined }];
const missingEntryId = calls.length;
await assert.rejects(
    api.setPlaylistSongs({ apiClientProps, body: { id: '9', songIds: ['3', '3'] } }),
    /Plex playlist entry ID is missing/,
);
await assert.rejects(
    api.replacePlaylist({ apiClientProps, body: { songId: ['3'] }, query: { id: '9' } }),
    /Plex playlist entry ID is missing/,
);
assert.ok(
    !calls.slice(missingEntryId).some((call) => call.method !== 'get'),
    'Missing occurrence IDs must be rejected before any replacement or reorder writes',
);
playlistTracks = [track, { ...track, playlistItemID: '301' }];
const changedContents = calls.length;
await api.setPlaylistSongs({ apiClientProps, body: { id: '9', songIds: ['3'] } });
assert.equal(calls.slice(changedContents).filter((call) => call.method === 'delete').length, 2);
assert.ok(calls.slice(changedContents).some((call) => call.method === 'put' && call.params.uri));
const cleared = calls.length;
await api.setPlaylistSongs({ apiClientProps, body: { id: '9', songIds: [] } });
assert.equal(calls.slice(cleared).filter((call) => call.method === 'delete').length, 2);
assert.ok(!calls.slice(cleared).some((call) => call.method === 'put'));

await api.scrobble({
    apiClientProps,
    query: { id: '3', mediaType: 'song', playbackRate: 1, submission: true },
});
assert.equal(new URL(calls.at(-1).url).pathname, '/proxy/:/scrobble');
assert.equal(calls.at(-1).params.key, '3');
const serverInfo = await api.getServerInfo({ apiClientProps });
assert.deepEqual(serverInfo.features.reportPlayback, [1]);
for (const [event, state] of [
    ['start', 'playing'],
    ['timeupdate', 'playing'],
    ['pause', 'paused'],
    ['unpause', 'playing'],
    ['stop', 'stopped'],
]) {
    const beforeTimeline = calls.length;
    await api.scrobble({
        apiClientProps,
        query: {
            duration: track.duration,
            event,
            id: '3',
            mediaType: 'song',
            playbackRate: 1,
            position: 12345.6,
            submission: false,
        },
    });
    assert.equal(calls.length, beforeTimeline + 1, 'Timeline reports need no extra metadata fetch');
    assert.equal(new URL(calls.at(-1).url).pathname, '/proxy/:/timeline');
    assert.equal(calls.at(-1).method, 'get');
    assert.deepEqual(calls.at(-1).params, {
        duration: track.duration,
        identifier: 'com.plexapp.plugins.library',
        key: '/library/metadata/3',
        ratingKey: '3',
        state,
        time: 12346,
    });
}
const noEvent = calls.length;
await api.scrobble({
    apiClientProps,
    query: { id: '3', mediaType: 'song', playbackRate: 1, submission: false },
});
assert.equal(calls.length, noEvent, 'An empty event must not create a playing session');
await api.scrobble({
    apiClientProps,
    query: { event: 'start', id: '3', mediaType: 'song', playbackRate: 1, submission: false },
});
assert.equal(calls.at(-1).params.duration, track.duration);
assert.equal(calls.at(-1).params.time, 0);
for (const values of [
    { duration: -1, position: 0 },
    { duration: track.duration, position: NaN },
    { duration: Infinity, position: 0 },
    { duration: track.duration, position: -1 },
]) {
    const invalidReport = calls.length;
    await assert.rejects(
        api.scrobble({
            apiClientProps,
            query: {
                ...values,
                event: 'timeupdate',
                id: '3',
                mediaType: 'song',
                playbackRate: 1,
                submission: false,
            },
        }),
        /Invalid Plex playback position or duration/,
    );
    assert.equal(calls.length, invalidReport, 'Invalid timing must not be sent to Plex');
}
const submission = calls.length;
await api.scrobble({
    apiClientProps,
    query: { event: 'stop', id: '3', mediaType: 'song', playbackRate: 1, submission: true },
});
assert.equal(calls.length, submission + 1);
assert.equal(new URL(calls.at(-1).url).pathname, '/proxy/:/scrobble');
unauthorized = true;
await assert.rejects(
    api.scrobble({
        apiClientProps,
        query: {
            duration: track.duration,
            event: 'start',
            id: '3',
            mediaType: 'song',
            playbackRate: 1,
            submission: false,
        },
    }),
    { status: 401 },
);
unauthorized = false;
await assert.rejects(
    api.setRating({ apiClientProps, query: { id: ['3'], rating: 99, type: 'song' } }),
);
await api.setRating({ apiClientProps, query: { id: ['3'], rating: 4, type: 'song' } });
assert.equal(calls.at(-1).params.rating, 8);
await api.createFavorite({ apiClientProps, query: { id: ['3'], type: 'song' } });
assert.equal(calls.at(-1).params.rating, 10);
await api.deleteFavorite({ apiClientProps, query: { id: ['3'], type: 'song' } });
assert.equal(calls.at(-1).params.rating, 0);

// Account-first discovery: the user never needs to enter a media-server endpoint.
const oauthCalls = [];
let approved = false;
let expiresIn = 600;
let returnedCode = 'strong-pin-code';
let localAvailable = true;
let remoteAvailable = true;
let musicAvailable = true;
let wrongIdentity = false;
let identityXml = false;
const discoveredResources = [
    {
        accessToken: 'server-scoped-token',
        clientIdentifier: 'machine-1',
        connections: [
            { local: true, relay: false, uri: 'https://lan-plex.example/proxy' },
            { local: true, relay: false, uri: 'http://192.168.1.25:32400' },
            { local: false, relay: false, uri: 'https://remote-plex.example/proxy' },
            { local: false, relay: true, uri: 'https://relay-plex.example' },
        ],
        name: 'My music',
        owned: true,
        provides: 'server',
    },
    {
        accessToken: 'shared-server-token',
        clientIdentifier: 'machine-2',
        connections: [
            { local: true, relay: false, uri: 'http://192.168.1.88:32400' },
            { local: false, relay: false, uri: 'https://shared-plex.example' },
        ],
        name: 'Shared music',
        owned: false,
        provides: 'server',
    },
    {
        accessToken: 'client-token',
        clientIdentifier: 'player',
        connections: [],
        name: 'TV',
        provides: 'client',
    },
    { clientIdentifier: 'inaccessible', connections: [], name: 'Unavailable', provides: 'server' },
];
let resources = discoveredResources;
axios.defaults.adapter = async (config) => {
    oauthCalls.push(config);
    const url = new URL(config.url);
    let data;
    if (url.origin === 'https://plex.tv') {
        assert.equal(config.headers.get('X-Plex-Client-Identifier'), 'test-device');
        if (url.pathname.startsWith('/api/v2/pins')) {
            assert.equal(config.headers.get('X-Plex-Token'), '');
            data = {
                authToken: approved ? 'account-only-token' : null,
                code: returnedCode,
                expiresIn,
                id: 123,
            };
        } else {
            assert.equal(config.headers.get('X-Plex-Token'), 'account-only-token');
            data =
                url.pathname === '/api/v2/user' ? { id: 42, username: 'Plex listener' } : resources;
        }
    } else {
        assert.notEqual(config.headers.get('X-Plex-Token'), 'account-only-token');
        assert.notEqual(
            url.hostname,
            '192.168.1.88',
            'Never probe a shared server on an unrelated local network',
        );
        const shared = url.hostname === 'shared-plex.example';
        if (
            (url.hostname === 'lan-plex.example' && !wrongIdentity) ||
            (url.hostname === '192.168.1.25' && !localAvailable) ||
            (url.hostname === 'remote-plex.example' && !remoteAvailable)
        )
            throw new Error('Simulated unreachable address');
        if (url.pathname.endsWith('/identity')) {
            assert.equal(config.headers.get('X-Plex-Token'), undefined);
            data = {
                MediaContainer: {
                    machineIdentifier: shared
                        ? 'machine-2'
                        : wrongIdentity && url.hostname === 'lan-plex.example'
                          ? 'wrong-server'
                          : 'machine-1',
                },
            };
            if (identityXml)
                data = `<?xml version="1.0" encoding="UTF-8"?><MediaContainer size="0" claimed="1" machineIdentifier="${data.MediaContainer.machineIdentifier}" version="1.40.0"/>`;
        } else {
            assert.ok(url.pathname.endsWith('/library/sections'));
            assert.notEqual(
                url.hostname,
                'lan-plex.example',
                'Do not send a token to a mismatched server',
            );
            assert.equal(
                config.headers.get('X-Plex-Token'),
                shared ? 'shared-server-token' : 'server-scoped-token',
            );
            data = {
                MediaContainer: {
                    Directory: [
                        { key: '7', title: 'Music', type: musicAvailable ? 'artist' : 'movie' },
                    ],
                },
            };
        }
    }
    return { config, data, headers: {}, status: 200, statusText: 'OK' };
};

const pin = await api.authenticate('', { action: 'oauthInitiate' });
assert.equal(oauthCalls[0].method, 'post');
assert.equal(oauthCalls[0].params.strong, true);
assert.equal(pin.id, 123);
assert.equal(pin.expiresIn, 600);
const approval = new URL(pin.authUrl);
assert.equal(approval.origin, 'https://app.plex.tv');
assert.equal(approval.pathname, '/auth');
const approvalParams = new URLSearchParams(approval.hash.slice(2));
assert.equal(approvalParams.get('clientID'), 'test-device');
assert.equal(approvalParams.get('code'), 'strong-pin-code');
const poll = { action: 'oauthPoll', code: pin.code, pinId: pin.id };
assert.equal(await api.authenticate('', poll), null);
assert.equal(oauthCalls.at(-1).params.code, pin.code);
assert.ok(oauthCalls.every((call) => new URL(call.url).origin === 'https://plex.tv'));
expiresIn = 0;
await assert.rejects(api.authenticate(server.url, poll), /expired/);
expiresIn = 600;
returnedCode = 'another-pin';
await assert.rejects(api.authenticate(server.url, poll), /does not match/);
returnedCode = pin.code;
await assert.rejects(
    api.authenticate(server.url, { ...poll, pinId: '../user' }),
    /Invalid Plex authorization/,
);
await assert.rejects(
    api.authenticate('file:///etc', { password: server.credential }),
    /Invalid Plex server URL/,
);
approved = true;
const oauthAccount = await api.authenticate('', poll);
assert.equal(oauthAccount.servers.length, 2);
assert.equal(oauthAccount.servers[0].name, 'My music');
assert.equal(oauthAccount.servers[1].credential, 'shared-server-token');
assert.ok(
    oauthCalls.every((call) => new URL(call.url).origin === 'https://plex.tv'),
    'Discovery must not require a server endpoint',
);
const connectArgs = {
    action: 'oauthConnect',
    server: oauthAccount.servers[0],
    userId: oauthAccount.userId,
    username: oauthAccount.username,
};
const oauthResult = await api.authenticate('', connectArgs);
assert.deepEqual(oauthResult, {
    credential: 'server-scoped-token',
    isAdmin: false,
    name: 'My music',
    plexServerId: 'machine-1',
    url: 'http://192.168.1.25:32400',
    userId: '42',
    username: 'Plex listener',
});
identityXml = true;
assert.equal((await api.authenticate('', connectArgs)).url, 'http://192.168.1.25:32400');
wrongIdentity = true;
assert.equal((await api.authenticate('', connectArgs)).url, 'http://192.168.1.25:32400');
wrongIdentity = false;
identityXml = false;
localAvailable = false;
assert.equal((await api.authenticate('', connectArgs)).url, 'https://remote-plex.example/proxy');
remoteAvailable = false;
assert.equal((await api.authenticate('', connectArgs)).url, 'https://relay-plex.example');
remoteAvailable = true;
const httpsStart = oauthCalls.length;
assert.equal(
    (await api.authenticate('', { ...connectArgs, httpsOnly: true })).url,
    'https://remote-plex.example/proxy',
);
assert.ok(oauthCalls.slice(httpsStart).every((call) => new URL(call.url).protocol === 'https:'));
const shared = await api.authenticate('', { ...connectArgs, server: oauthAccount.servers[1] });
assert.equal(shared.credential, 'shared-server-token');
assert.equal(shared.plexServerId, 'machine-2');
const constrained = await api.authenticate('', { ...poll, serverId: 'machine-2' });
assert.equal(constrained.servers.length, 1);
assert.equal(constrained.servers[0].id, 'machine-2');
musicAvailable = false;
await assert.rejects(api.authenticate('', connectArgs), /no accessible music libraries/);
musicAvailable = true;
wrongIdentity = true;
localAvailable = true;
assert.equal((await api.authenticate('', connectArgs)).url, 'http://192.168.1.25:32400');
wrongIdentity = false;
resources = [];
await assert.rejects(api.authenticate('', poll), /No accessible Plex servers/);
resources = discoveredResources;
await assert.rejects(
    api.authenticate('', { ...poll, serverId: 'inaccessible' }),
    /No accessible Plex servers/,
);
const badUrlStart = oauthCalls.length;
await assert.rejects(
    api.authenticate('', {
        ...connectArgs,
        server: {
            ...connectArgs.server,
            connections: [{ local: true, relay: false, url: 'file:///etc' }],
        },
    }),
    /Unable to reach/,
);
assert.equal(oauthCalls.length, badUrlStart);
const cancelledOAuth = new AbortController();
cancelledOAuth.abort();
const cancelledStart = oauthCalls.length;
await assert.rejects(api.authenticate(server.url, { ...poll, signal: cancelledOAuth.signal }), {
    code: 'ERR_CANCELED',
});
assert.equal(oauthCalls.length, cancelledStart);
await assert.rejects(api.authenticate('', { ...connectArgs, signal: cancelledOAuth.signal }), {
    name: 'AbortError',
});

console.log(
    'Plex checks passed: browser/PIN sign-in, shared-server tokens, expiration/cancellation, normalization, pagination, streaming, artwork and playlist safety.',
);
