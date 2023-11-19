import { z } from 'zod';

const error = z.object({
    errors: z.array(
        z.object({
            category: z.string(),
            code: z.string(),
            detail: z.string(),
            field: z.string().optional(),
        }),
    ),
});

const authenticate400Error = z.object({
    error: z.string(),
    error_description: z.string(),
    status: z.number(),
    sub_status: z.number(),
});

const image = z.object({ height: z.number(), url: z.string(), width: z.number() });

const authenticate = z.object({
    access_token: z.string(),
    expires_in: z.number(),
    token_type: z.string(),
});

const authenticateParameters = z.string();

const artist = z.object({
    id: z.string(),
    main: z.boolean().optional(),
    name: z.string(),
    picture: z.array(image),
});

const album = z.object({
    artists: z.array(artist),
    barcodeId: z.string(),
    copyright: z.string(),
    duration: z.number(),
    id: z.string(),
    imageCover: z.array(image),
    mediaMetadata: z.object({ tags: z.string() }),
    numberOfTracks: z.number(),
    numberOfVideos: z.number(),
    numberOfVolumes: z.number(),
    properties: z.object({ content: z.string() }),
    releaseDate: z.string(),
    title: z.string(),
    type: z.string(),
    videoCover: z.array(image),
});

const getAlbumByIdParameters = z.object({
    countryCode: z.string(),
});

const getAlbumById = z.object({
    resource: album,
});

const getAlbumByBarcodeIdParameters = z.object({
    barcodeId: z.string(),
    countryCode: z.string(),
});

const getAlbumByBarcodeId = z.object({
    data: z.array(
        z.object({
            id: z.string(),
            message: z.string(),
            resource: album,
            status: z.number(),
        }),
    ),
    metadata: z.object({
        failure: z.number(),
        requested: z.number(),
        success: z.number(),
    }),
});

const getAlbumItemsParameters = z.object({
    countryCode: z.string(),
    limit: z.number().optional(),
    offset: z.number().optional(),
});

const getAlbumItems = z.object({
    data: z.array(
        z.object({
            id: z.string(),
            message: z.string(),
            resource: z.object({
                album: z.object({
                    id: z.string(),
                    imageCover: z.array(
                        z.object({ height: z.number(), url: z.string(), width: z.number() }),
                    ),
                    title: z.string(),
                    videoCover: z.array(
                        z.object({ height: z.number(), url: z.string(), width: z.number() }),
                    ),
                }),
                albumId: z.string(),
                artifactType: z.string(),
                artists: z.array(artist),
                copyright: z.string(),
                duration: z.number(),
                id: z.string(),
                isrc: z.string(),
                mediaMetadata: z.object({ tags: z.string() }),
                properties: z.object({
                    additionalProp1: z.array(z.string()).optional(),
                    additionalProp2: z.array(z.string()).optional(),
                    additionalProp3: z.array(z.string()).optional(),
                    content: z.string(),
                }),
                providerId: z.string(),
                title: z.string(),
                trackNumber: z.number(),
                version: z.string(),
                volumeNumber: z.number(),
            }),
            status: z.number(),
        }),
    ),
    metadata: z.object({ total: z.number() }),
});

const getSimilarAlbumsParameters = z.object({
    albumId: z.string(),
    countryCode: z.string(),
    limit: z.number().optional(),
    offset: z.number().optional(),
});

const getSimilarAlbums = z.object({
    data: z.array(z.object({ resource: z.object({ id: z.string() }) })),
    metadata: z.object({ total: z.number() }),
});

const getAlbumsByArtistIdParameters = z.object({
    countryCode: z.string(),
    limit: z.number().optional(),
    offset: z.number().optional(),
});

const getAlbumsByArtistId = z.object({
    data: z.array(
        z.object({ id: z.string(), message: z.string(), resource: album, status: z.number() }),
    ),
    metadata: z.object({ total: z.number() }),
});

const getAlbumsByIdsParameters = z.object({
    countryCode: z.string(),
    ids: z.string(),
});

const getAlbumsByIds = z.object({
    data: z.array(
        z.object({ id: z.string(), message: z.string(), resource: album, status: z.number() }),
    ),
    metadata: z.object({ total: z.number() }),
});

const track = z.object({
    album: z.object({
        id: z.string(),
        imageCover: z.array(image),
        title: z.string(),
        videoCover: z.array(image),
    }),
    artists: z.array(artist),
    copyright: z.string(),
    duration: z.number(),
    id: z.string(),
    isrc: z.string(),
    mediaMetadata: z.object({ tags: z.string() }),
    properties: z.object({ content: z.string() }),
    title: z.string(),
    trackNumber: z.number(),
    version: z.string(),
    volumeNumber: z.number(),
});

const video = z.object({
    album: z.object({
        id: z.string(),
        imageCover: z.array(z.object({ height: z.number(), url: z.string(), width: z.number() })),
        title: z.string(),
        videoCover: z.array(z.object({ height: z.number(), url: z.string(), width: z.number() })),
    }),
    artists: z.array(
        z.object({
            id: z.string(),
            main: z.boolean(),
            name: z.string(),
            picture: z.array(
                z.object({
                    height: z.number(),
                    url: z.string(),
                    width: z.number(),
                }),
            ),
        }),
    ),
    copyright: z.string(),
    duration: z.number(),
    id: z.string(),
    image: z.array(z.object({ height: z.number(), url: z.string(), width: z.number() })),
    isrc: z.string(),
    properties: z.object({ content: z.string(), 'video-type': z.string() }),
    releaseDate: z.string(),
    title: z.string(),
    trackNumber: z.number(),
    version: z.string(),
    volumeNumber: z.number(),
});

const getArtistByIdParameters = z.object({
    countryCode: z.string(),
    limit: z.number().optional(),
    offset: z.number().optional(),
});

const getArtistById = z.object({
    resource: artist,
});

const getArtistsByIdsParameters = z.object({
    countryCode: z.string(),
    ids: z.string(),
});

const getArtistsByIds = z.object({
    data: z.array(
        z.object({ id: z.string(), message: z.string(), resource: artist, status: z.number() }),
    ),
    metadata: z.object({ total: z.number() }),
});

const getSimilarArtistsParameters = z.object({
    countryCode: z.string(),
    limit: z.number().optional(),
    offset: z.number().optional(),
});

const getSimilarArtists = z.object({
    data: z.array(z.object({ resource: z.object({ id: z.string() }) })),
    metadata: z.object({ total: z.number() }),
});

const getSimilarTracksParameters = z.object({
    countryCode: z.string(),
    limit: z.number().optional(),
    offset: z.number().optional(),
});

const getSimilarTracks = z.object({
    data: z.array(z.object({ resource: z.object({ id: z.string() }) })),
    metadata: z.object({ total: z.number() }),
});

const getTrackByIdParameters = z.object({
    countryCode: z.string(),
});

const getTrackById = z.object({
    resource: track,
});

const getTracksByIdsParameters = z.object({
    countryCode: z.string(),
    ids: z.string(),
});

const getTracksByIds = z.object({
    data: z.array(
        z.object({ id: z.string(), message: z.string(), resource: track, status: z.number() }),
    ),
    metadata: z.object({ total: z.number() }),
});

const tidalSearchType = {
    ALBUM: 'ALBUM',
    ARTIST: 'ARTIST',
    PLAYLIST: 'PLAYLIST',
    TRACK: 'TRACK',
    VIDEO: 'VIDEO',
} as const;

const searchParameters = z.object({
    countryCode: z.string(),
    limit: z.number().optional(),
    offset: z.number().optional(),
    popularity: z.string().optional(),
    query: z.string(),
    type: z.nativeEnum(tidalSearchType).optional(),
});

const search = z.object({
    albums: z.array(
        z.object({
            id: z.string(),
            message: z.string(),
            resource: album,
            status: z.number(),
        }),
    ),
    artists: z.array(
        z.object({
            id: z.string(),
            message: z.string(),
            resource: artist,
            status: z.number(),
        }),
    ),
    tracks: z.array(
        z.object({
            id: z.string(),
            message: z.string(),
            resource: track,
            status: z.number(),
        }),
    ),
    videos: z.array(
        z.object({
            id: z.string(),
            message: z.string(),
            resource: video,
            status: z.number(),
        }),
    ),
});

export const tidalType = {
    _parameters: {
        authenticate: authenticateParameters,
        getAlbumByBarcodeId: getAlbumByBarcodeIdParameters,
        getAlbumById: getAlbumByIdParameters,
        getAlbumItems: getAlbumItemsParameters,
        getAlbumsByArtistId: getAlbumsByArtistIdParameters,
        getAlbumsByIds: getAlbumsByIdsParameters,
        getArtistById: getArtistByIdParameters,
        getArtistsByIds: getArtistsByIdsParameters,
        getSimilarAlbums: getSimilarAlbumsParameters,
        getSimilarArtists: getSimilarArtistsParameters,
        getSimilarTracks: getSimilarTracksParameters,
        getTrackById: getTrackByIdParameters,
        getTracksByIds: getTracksByIdsParameters,
        search: searchParameters,
    },
    _response: {
        authenticate,
        authenticate400Error,
        error,
        getAlbumByBarcodeId,
        getAlbumById,
        getAlbumItems,
        getAlbumsByArtistId,
        getAlbumsByIds,
        getArtistById,
        getArtistsByIds,
        getSimilarAlbums,
        getSimilarArtists,
        getSimilarTracks,
        getTrackById,
        getTracksByIds,
        search,
    },
};
