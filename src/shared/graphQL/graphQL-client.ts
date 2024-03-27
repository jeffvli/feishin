import type { AlbumData } from './models/album-data';
import type { GraphQLResponse } from './models/response';
import { IsErrorResponse, ThrowWithErrorMessage } from './utils/graphQL-utils';
import type { TrackNameData } from './models/track-name-data';
import type { EpisodeNameData } from './models/episode-name-data';
import type { ArtistMinimalData } from './models/artist-minimal-data';
import type { NpvEpisodeData } from './models/npv-episode-data';
import type { AlbumNameAndTracksData } from './models/album-name-and-tracks-data';

// Decorate
// ----------------------------------------

export async function decorateItemsForEnhance(): Promise<unknown> {
    throw new Error('Method not implemented.');
}

export async function decorateContextEpisodesOrChapters(): Promise<unknown> {
    throw new Error('Method not implemented.');
}

export async function decorateContextTracks(): Promise<unknown> {
    throw new Error('Method not implemented.');
}

export async function decoratePlaylists(): Promise<unknown> {
    throw new Error('Method not implemented.');
}

// Fetch extracted colors
// ----------------------------------------

export async function fetchExtractedColors(): Promise<unknown> {
    throw new Error('Method not implemented.');
}

export async function fetchExtractedColorAndImageForAlbumEntity(): Promise<unknown> {
    throw new Error('Method not implemented.');
}

export async function fetchExtractedColorAndImageForArtistEntity(): Promise<unknown> {
    throw new Error('Method not implemented.');
}

export async function fetchExtractedColorAndImageForEpisodeEntity(): Promise<unknown> {
    throw new Error('Method not implemented.');
}

export async function fetchExtractedColorAndImageForPlaylistEntity(): Promise<unknown> {
    throw new Error('Method not implemented.');
}

export async function fetchExtractedColorAndImageForPodcastEntity(): Promise<unknown> {
    throw new Error('Method not implemented.');
}

export async function fetchExtractedColorAndImageForTrackEntity(): Promise<unknown> {
    throw new Error('Method not implemented.');
}

export async function fetchExtractedColorForAlbumEntity(): Promise<unknown> {
    throw new Error('Method not implemented.');
}

export async function fetchExtractedColorForArtistEntity(): Promise<unknown> {
    throw new Error('Method not implemented.');
}

export async function fetchExtractedColorForEpisodeEntity(): Promise<unknown> {
    throw new Error('Method not implemented.');
}

export async function fetchExtractedColorForPlaylistEntity(): Promise<unknown> {
    throw new Error('Method not implemented.');
}

export async function fetchExtractedColorForPodcastEntity(): Promise<unknown> {
    throw new Error('Method not implemented.');
}

export async function fetchExtractedColorForTrackEntity(): Promise<unknown> {
    throw new Error('Method not implemented.');
}

// Album
// ----------------------------------------

export async function getAlbum(
    uri: Spicetify.URI,
    locale: typeof Spicetify.Locale,
    offset: number,
    limit: number,
): Promise<AlbumData> {
    if (uri.type !== Spicetify.URI.Type.ALBUM) {
        throw new Error(`URI '${uri.toString()}' is not an album.`);
    }

    const response = (await Spicetify.GraphQL.Request(
        Spicetify.GraphQL.Definitions.getAlbum,
        {
            uri: uri.toString(),
            locale: locale.getLocale(),
            offset,
            limit,
        },
    )) as GraphQLResponse<AlbumData>;

    if (IsErrorResponse(response)) {
        ThrowWithErrorMessage(response);
    }

    return response.data;
}

export async function getAlbumNameAndTracks(
    uri: Spicetify.URI,
    offset: number,
    limit: number,
): Promise<AlbumNameAndTracksData> {
    if (uri.type !== Spicetify.URI.Type.ALBUM) {
        throw new Error(`URI '${uri.toString()}' is not an album.`);
    }

    const response = (await Spicetify.GraphQL.Request(
        Spicetify.GraphQL.Definitions.getAlbumNameAndTracks,
        {
            uri: uri.toString(),
            offset,
            limit,
        },
    )) as GraphQLResponse<AlbumNameAndTracksData>;

    if (IsErrorResponse(response)) {
        ThrowWithErrorMessage(response);
    }

    return response.data;
}

export async function queryAlbumTrackUris(): Promise<unknown> {
    throw new Error('Method not implemented.');
}

export async function queryAlbumTracks(): Promise<unknown> {
    throw new Error('Method not implemented.');
}

// Episode
// ----------------------------------------

/**
 * Get the name of an episode.
 * @param uri The URI of the episode.
 * @returns The name of the episode.
 */
export async function getEpisodeName(
    uri: Spicetify.URI,
): Promise<EpisodeNameData> {
    if (uri.type !== Spicetify.URI.Type.EPISODE) {
        throw new Error(`URI '${uri.toString()}' is not an episode.`);
    }

    const response = (await Spicetify.GraphQL.Request(
        Spicetify.GraphQL.Definitions.getEpisodeName,
        {
            uri: uri.toString(),
        },
    )) as GraphQLResponse<EpisodeNameData>;

    if (IsErrorResponse(response)) {
        ThrowWithErrorMessage(response);
    }

    return response.data;
}

export async function queryNpvEpisode(
    uri: Spicetify.URI,
): Promise<NpvEpisodeData> {
    if (uri.type !== Spicetify.URI.Type.EPISODE) {
        throw new Error(`URI '${uri.toString()}' is not an episode.`);
    }

    const response = (await Spicetify.GraphQL.Request(
        Spicetify.GraphQL.Definitions.queryNpvEpisode,
        {
            uri: uri.toString(),
        },
    )) as GraphQLResponse<NpvEpisodeData>;

    if (IsErrorResponse(response)) {
        ThrowWithErrorMessage(response);
    }

    return response.data;
}

// Track
// ----------------------------------------

/**
 * Get the name of a track.
 * @param uri The URI of the track.
 * @returns The name of the track.
 */
export async function getTrackName(uri: Spicetify.URI): Promise<TrackNameData> {
    if (uri.type !== Spicetify.URI.Type.TRACK) {
        throw new Error(`URI '${uri.toString()}' is not a track.`);
    }

    const response = (await Spicetify.GraphQL.Request(
        Spicetify.GraphQL.Definitions.getTrackName,
        {
            uri: uri.toString(),
        },
    )) as GraphQLResponse<TrackNameData>;

    if (IsErrorResponse(response)) {
        ThrowWithErrorMessage(response);
    }

    return response.data;
}

export async function queryTrackArtists(): Promise<unknown> {
    throw new Error('Method not implemented.');
}

export async function fetchTracksForRadioStation(): Promise<unknown> {
    throw new Error('Method not implemented.');
}

// Artist
// ----------------------------------------

export async function queryArtistOverview(): Promise<unknown> {
    throw new Error('Method not implemented.');
}

export async function queryArtistAppearsOn(): Promise<unknown> {
    throw new Error('Method not implemented.');
}

export async function queryArtistDiscographyAlbums(): Promise<unknown> {
    throw new Error('Method not implemented.');
}

export async function queryArtistDiscographySingles(): Promise<unknown> {
    throw new Error('Method not implemented.');
}

export async function queryArtistDiscographyCompilations(): Promise<unknown> {
    throw new Error('Method not implemented.');
}

export async function queryArtistDiscographyAll(): Promise<unknown> {
    throw new Error('Method not implemented.');
}

export async function queryArtistDiscographyOverview(): Promise<unknown> {
    throw new Error('Method not implemented.');
}

export async function queryArtistPlaylists(): Promise<unknown> {
    throw new Error('Method not implemented.');
}

export async function queryArtistDiscoveredOn(): Promise<unknown> {
    throw new Error('Method not implemented.');
}

export async function queryArtistFeaturing(): Promise<unknown> {
    throw new Error('Method not implemented.');
}

export async function queryArtistRelated(): Promise<unknown> {
    throw new Error('Method not implemented.');
}

/**
 * Get minimal informations about an artist.
 * @param uri The artist URI.
 * @returns Minimal informations about the artist.
 */
export async function queryArtistMinimal(
    uri: Spicetify.URI,
): Promise<ArtistMinimalData> {
    if (uri.type !== Spicetify.URI.Type.ARTIST) {
        throw new Error(`URI '${uri.toString()}' is not an artist.`);
    }

    const response = (await Spicetify.GraphQL.Request(
        Spicetify.GraphQL.Definitions.queryArtistMinimal,
        {
            uri: uri.toString(),
        },
    )) as GraphQLResponse<ArtistMinimalData>;

    if (IsErrorResponse(response)) {
        ThrowWithErrorMessage(response);
    }

    return response.data;
}

/**
 * Get Now Playing View info for the artist.
 */
export async function queryNpvArtist(
    artistUri: Spicetify.URI,
    trackUri: Spicetify.URI,
): Promise<unknown> {
    throw new Error('Method not implemented.');
}

// Other
// ----------------------------------------

export async function queryFullscreenMode(): Promise<unknown> {
    throw new Error('Method not implemented.');
}

export async function searchModalResults(): Promise<unknown> {
    throw new Error('Method not implemented.');
}

export async function queryWhatsNewFeed(): Promise<unknown> {
    throw new Error('Method not implemented.');
}

export async function whatsNewFeedNewItems(): Promise<unknown> {
    throw new Error('Method not implemented.');
}

export async function browseAll(): Promise<unknown> {
    throw new Error('Method not implemented.');
}
