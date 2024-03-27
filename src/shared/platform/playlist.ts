export type PlaylistParameters = {
    decorateFormatListData?: boolean;
    hydrateCollaboratorsWithMembers?: boolean;
    withSync?: boolean;
};

export type QueryParameters = {
    filter: string;
    limit: number;
    offset: number;
    sort: string | undefined;
};

export type Playlist = {
    contents: {
        items: unknown[];
        limit: number;
        offset: number;
        totalLength: number;
    };
    metadata: {
        canAdd: boolean;
        canPlay: boolean;
        canRemove: boolean;
        canReportAnnotationAbuse: boolean;
        collaborators: {
            count: number;
            items: unknown[];
        }[];
        description: string;
        duration: {
            isEstimate: boolean;
            milliseconds: number;
        };
        formatListData: {
            attributes: {
                autoplay: string;
                'correlation-id': string;
                episode_description: string;
                header_image_url_desktop: string;
                image_url: string;
                isAlgotorial: string;
                mediaListConfig: string;
                primary_color: string;
                request_id: string;
                status: string;
                uri: string;
            };
            type: string;
        };
        hasDateAdded: boolean;
        hasEpisodes: boolean | null;
        hasSpotifyAudiobooks: boolean | null;
        hasSpotifyTracks: boolean;
        images: {
            url: string;
            label: string;
        }[];
        isCollaborative: boolean;
        isLoaded: boolean;
        isOwnedBySelf: boolean;
        isPublished: boolean;
        madeFor: unknown | null;
        name: string;
        owner: {
            displayName: string;
            images: {
                url: string;
                label: string;
            }[];
            type: string;
            uri: string;
            username: string;
        };
        permissions: {
            canAdministratePermissions: boolean;
            canCancelMembership: boolean;
            canView: boolean;
            isPrivate: boolean;
        };
        totalLength: number;
        totalLikes: number;
        type: 'playlist';
        unfilteredTotalLength: number;
        uri: string;
    };
};

export type PlaylistAPI = {
    add: (
        playlistUri: string,
        tracks: string[],
        options: any | { after: 'end' },
    ) => Promise<void>;

    applyModifications: (
        playlistUri: string,
        modification: {
            operation: string | 'add';
            uris: string[];
            after: 'end' | string;
        },
    ) => Promise<void>;

    getMetadata: (
        playlistUri: string,
        playlistParameters: PlaylistParameters,
    ) => Promise<Playlist['metadata']>;

    getContents: (
        playlistUri: string,
        queryParameters: QueryParameters,
    ) => Promise<Playlist['contents']>;

    getPlaylist: (
        playlistUri: string,
        playlistParameters: PlaylistParameters,
        queryParameters: QueryParameters,
    ) => Promise<Playlist>;
};
