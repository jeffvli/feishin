import http from 'node:http';

const TICKS_PER_SECOND = 10_000_000;
const ONE_PIXEL_PNG = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
    'base64',
);

const makeWave = (durationSeconds = 3) => {
    const sampleRate = 8_000;
    const sampleCount = sampleRate * durationSeconds;
    const dataSize = sampleCount * 2;
    const buffer = Buffer.alloc(44 + dataSize);

    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(36 + dataSize, 4);
    buffer.write('WAVEfmt ', 8);
    buffer.writeUInt32LE(16, 16);
    buffer.writeUInt16LE(1, 20);
    buffer.writeUInt16LE(1, 22);
    buffer.writeUInt32LE(sampleRate, 24);
    buffer.writeUInt32LE(sampleRate * 2, 28);
    buffer.writeUInt16LE(2, 32);
    buffer.writeUInt16LE(16, 34);
    buffer.write('data', 36);
    buffer.writeUInt32LE(dataSize, 40);

    for (let index = 0; index < sampleCount; index += 1) {
        const sample = Math.sin((index / sampleRate) * Math.PI * 2 * 220) * 4_000;
        buffer.writeInt16LE(sample, 44 + index * 2);
    }

    return buffer;
};

const createSong = (index, albumId = 'album-1') => ({
    Album: 'Automation Album',
    AlbumArtist: 'Automation Artist',
    AlbumArtists: [{ Id: 'artist-1', Name: 'Automation Artist' }],
    AlbumId: albumId,
    ArtistItems: [{ Id: 'artist-1', Name: 'Automation Artist' }],
    ChildCount: 0,
    Container: 'wav',
    DateCreated: '2026-01-01T00:00:00.000Z',
    GenreItems: [{ Id: 'genre-1', Name: 'Test Music' }],
    Id: `song-${index}`,
    ImageBlurHashes: {},
    ImageTags: {},
    IndexNumber: index,
    MediaSources: [
        {
            Bitrate: 128_000,
            Container: 'wav',
            Id: `source-${index}`,
            MediaStreams: [
                {
                    BitRate: 128_000,
                    Channels: 1,
                    Codec: 'pcm_s16le',
                    Index: 0,
                    SampleRate: 8_000,
                    Type: 'Audio',
                },
            ],
            Name: `Automation Track ${index}`,
            Path: `C:\\MockMusic\\Automation Track ${index}.wav`,
            Size: 48_044,
        },
    ],
    MediaType: 'Audio',
    Name: `Automation Track ${index}`,
    ParentIndexNumber: 1,
    ProductionYear: 2026,
    RunTimeTicks: 3 * TICKS_PER_SECOND,
    Type: 'Audio',
    UserData: { IsFavorite: false, PlayCount: 0, Played: false },
});

const createLibrary = (songCount = 6) => {
    const songs = Array.from({ length: songCount }, (_, index) => createSong(index + 1));
    const artist = {
        Id: 'artist-1',
        ImageBlurHashes: {},
        ImageTags: {},
        Name: 'Automation Artist',
        Type: 'MusicArtist',
        UserData: { IsFavorite: false },
    };
    const album = {
        AlbumArtist: 'Automation Artist',
        AlbumArtists: [{ Id: 'artist-1', Name: 'Automation Artist' }],
        ArtistItems: [{ Id: 'artist-1', Name: 'Automation Artist' }],
        ChildCount: songs.length,
        DateCreated: '2026-01-01T00:00:00.000Z',
        GenreItems: [{ Id: 'genre-1', Name: 'Test Music' }],
        Id: 'album-1',
        ImageBlurHashes: {},
        ImageTags: {},
        Name: 'Automation Album',
        ProductionYear: 2026,
        RunTimeTicks: songs.length * 3 * TICKS_PER_SECOND,
        Studios: [],
        Type: 'MusicAlbum',
        UserData: { IsFavorite: false, PlayCount: 0, Played: false },
    };
    const playlist = {
        ChildCount: songs.length,
        DateCreated: '2026-01-01T00:00:00.000Z',
        GenreItems: [],
        Id: 'playlist-1',
        ImageBlurHashes: {},
        ImageTags: {},
        IsFolder: false,
        MediaType: 'Playlist',
        Name: 'Automation Playlist',
        Overview: 'Predictable music used only by KatiesAmp automation.',
        RunTimeTicks: songs.length * 3 * TICKS_PER_SECOND,
        Type: 'Playlist',
        UserData: { IsFavorite: false, PlayCount: 0, Played: false },
    };

    return { album, artist, playlist, songs };
};

const getQuery = (url, name) => {
    for (const [key, value] of url.searchParams.entries()) {
        if (key.toLowerCase() === name.toLowerCase()) return value;
    }

    return undefined;
};

const sendJson = (response, status, value) => {
    const body = JSON.stringify(value);
    response.writeHead(status, {
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        'Access-Control-Allow-Origin': '*',
        'Content-Length': Buffer.byteLength(body),
        'Content-Type': 'application/json',
    });
    response.end(body);
};

const readJson = async (request) => {
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    if (chunks.length === 0) return {};

    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
};

const sendAudio = (request, response, audio) => {
    const range = request.headers.range;
    if (!range) {
        response.writeHead(200, {
            'Accept-Ranges': 'bytes',
            'Access-Control-Allow-Origin': '*',
            'Content-Length': audio.length,
            'Content-Type': 'audio/wav',
        });
        response.end(audio);
        return;
    }

    const [startText, endText] = range.replace('bytes=', '').split('-');
    const start = Number(startText || 0);
    const end = Math.min(Number(endText || audio.length - 1), audio.length - 1);
    const chunk = audio.subarray(start, end + 1);
    response.writeHead(206, {
        'Accept-Ranges': 'bytes',
        'Access-Control-Allow-Origin': '*',
        'Content-Length': chunk.length,
        'Content-Range': `bytes ${start}-${end}/${audio.length}`,
        'Content-Type': 'audio/wav',
    });
    response.end(chunk);
};

export const startMockJellyfin = async ({ songCount = 6 } = {}) => {
    const state = {
        available: true,
        deniedItemIds: new Set(),
        library: createLibrary(songCount),
        musicFolders: [
            {
                id: 'music-folder-1',
                name: "Katie O'Brien's Music",
            },
        ],
        requests: [],
    };
    const audio = makeWave();

    const server = http.createServer(async (request, response) => {
        const url = new URL(request.url || '/', 'http://127.0.0.1');
        const pathname = url.pathname.toLowerCase();
        state.requests.push({
            method: request.method,
            pathname: url.pathname,
            query: Object.fromEntries(url.searchParams),
        });

        if (request.method === 'OPTIONS') {
            response.writeHead(204, {
                'Access-Control-Allow-Headers': '*',
                'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
                'Access-Control-Allow-Origin': '*',
            });
            response.end();
            return;
        }

        if (!state.available) {
            sendJson(response, 503, { error: 'Mock server unavailable' });
            return;
        }

        if (request.method === 'POST' && pathname === '/users/authenticatebyname') {
            const body = await readJson(request);
            if (body.Username !== 'Admin' || body.Pw !== 'password') {
                sendJson(response, 401, { error: 'Invalid username or password' });
                return;
            }

            sendJson(response, 200, {
                AccessToken: 'automation-access-token',
                ServerId: 'mock-server',
                SessionInfo: { Id: 'mock-session' },
                User: {
                    Id: 'test-user',
                    Name: 'Admin',
                    Policy: { IsAdministrator: true },
                },
            });
            return;
        }

        if (request.method === 'GET' && pathname === '/system/info/public') {
            sendJson(response, 200, {
                Id: 'mock-server',
                OperatingSystem: 'Automation',
                ProductName: 'Jellyfin Server',
                ServerName: 'KATIESMUSICSERVER',
                StartupWizardCompleted: true,
                Version: '10.10.7',
            });
            return;
        }

        if (request.method === 'GET' && pathname === '/system/info') {
            sendJson(response, 200, {
                Id: 'mock-server',
                ServerName: 'KATIESMUSICSERVER',
                Version: '10.10.7',
            });
            return;
        }

        if (request.method === 'GET' && pathname === '/users/test-user') {
            sendJson(response, 200, {
                Id: 'test-user',
                Name: 'Admin',
                Policy: { IsAdministrator: true },
            });
            return;
        }

        if (request.method === 'GET' && pathname === '/users/test-user/items') {
            const artistIds = getQuery(url, 'ArtistIds')?.split(',');
            const itemTypes = getQuery(url, 'IncludeItemTypes');
            const searchTerm = getQuery(url, 'SearchTerm')?.toLowerCase();
            let items;

            if (itemTypes?.includes('MusicAlbum')) items = [state.library.album];
            else if (itemTypes?.includes('Audio')) items = state.library.songs;
            else if (itemTypes?.includes('Playlist')) items = [state.library.playlist];
            else {
                items = state.musicFolders.map((folder) => ({
                    CollectionType: 'music',
                    Id: folder.id,
                    IsFolder: true,
                    Name: folder.name,
                    Type: 'CollectionFolder',
                }));
            }

            if (searchTerm) {
                items = items.filter((item) => {
                    const searchableText = [
                        item.Name,
                        item.Album,
                        item.AlbumArtist,
                        ...(item.ArtistItems || []).map((artist) => artist.Name),
                    ]
                        .filter(Boolean)
                        .join(' ')
                        .toLowerCase();

                    return searchableText.includes(searchTerm);
                });
            }
            if (artistIds?.length) {
                items = items.filter((item) =>
                    item.ArtistItems?.some((artist) => artistIds.includes(artist.Id)),
                );
            }

            sendJson(response, 200, {
                Items: items,
                StartIndex: 0,
                TotalRecordCount: items.length,
            });
            return;
        }

        if (request.method === 'GET' && pathname.startsWith('/users/test-user/items/')) {
            const id = url.pathname.split('/').at(-1);
            if (state.deniedItemIds.has(id)) {
                sendJson(response, 401, { error: 'Item is no longer accessible' });
                return;
            }
            const item =
                state.library.songs.find((song) => song.Id === id) ||
                (state.library.album.Id === id ? state.library.album : undefined) ||
                (state.library.artist.Id === id ? state.library.artist : undefined) ||
                (state.library.playlist.Id === id ? state.library.playlist : undefined);
            sendJson(response, item ? 200 : 404, item || { error: 'Item not found' });
            return;
        }

        if (request.method === 'GET' && pathname === '/playlists/playlist-1/items') {
            sendJson(response, 200, {
                Items: state.library.songs,
                StartIndex: 0,
                TotalRecordCount: state.library.songs.length,
            });
            return;
        }

        if (
            request.method === 'GET' &&
            (pathname === '/artists/albumartists' || pathname === '/artists')
        ) {
            const searchTerm = getQuery(url, 'SearchTerm')?.toLowerCase();
            let artists = [state.library.artist];
            if (searchTerm) {
                artists = artists.filter((artist) =>
                    artist.Name.toLowerCase().includes(searchTerm),
                );
            }
            sendJson(response, 200, {
                Items: artists,
                StartIndex: 0,
                TotalRecordCount: artists.length,
            });
            return;
        }

        if (request.method === 'GET' && pathname === '/musicgenres') {
            const genres = [{ Id: 'genre-1', Name: 'Test Music' }];
            sendJson(response, 200, {
                Items: genres,
                StartIndex: 0,
                TotalRecordCount: genres.length,
            });
            return;
        }

        if (request.method === 'GET' && pathname === '/items/filters') {
            sendJson(response, 200, {
                Genres: ['Test Music'],
                OfficialRatings: [],
                Tags: [],
                Years: [2026],
            });
            return;
        }

        if (request.method === 'GET' && pathname === '/studios') {
            sendJson(response, 200, { Items: [], StartIndex: 0, TotalRecordCount: 0 });
            return;
        }

        if (request.method === 'GET' && pathname.includes('/images/')) {
            response.writeHead(200, {
                'Access-Control-Allow-Origin': '*',
                'Content-Length': ONE_PIXEL_PNG.length,
                'Content-Type': 'image/png',
            });
            response.end(ONE_PIXEL_PNG);
            return;
        }

        if (
            request.method === 'GET' &&
            (pathname.includes('/audio/') || pathname.includes('/items/')) &&
            (pathname.includes('/stream') ||
                pathname.includes('/universal') ||
                pathname.endsWith('/download'))
        ) {
            sendAudio(request, response, audio);
            return;
        }

        if (request.method === 'POST' && pathname.startsWith('/sessions/playing')) {
            sendJson(response, 204, {});
            return;
        }

        if (request.method === 'GET' && pathname === '/scheduledtasks') {
            sendJson(response, 200, []);
            return;
        }

        if (request.method === 'POST' && pathname.startsWith('/scheduledtasks/running/')) {
            sendJson(response, 204, {});
            return;
        }

        sendJson(response, 200, { Items: [], StartIndex: 0, TotalRecordCount: 0 });
    });

    await new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(0, '127.0.0.1', resolve);
    });

    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Mock Jellyfin did not bind');

    return {
        close: () =>
            new Promise((resolve, reject) =>
                server.close((error) => (error ? reject(error) : resolve())),
            ),
        setAvailable: (available) => {
            state.available = available;
        },
        setDeniedItemIds: (ids) => {
            state.deniedItemIds = new Set(ids);
        },
        setMusicFolders: (folders) => {
            state.musicFolders = folders;
        },
        state,
        url: `http://127.0.0.1:${address.port}`,
    };
};
