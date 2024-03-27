export type LocalURI = {
    hasBase64Id: false;

    getPath: () => string;
    toString: () => string;
    toURI: () => string;
    toURL: () => string;
    toURLPath: () => string;
};

export type LocalTrackURI = LocalURI & {
    type: 'local';
    track: string;
    album: string;
    artist: string;
    duration: number;
};

export type LocalArtistURI = LocalURI & {
    type: 'local-artist';
    artist: string;
};

export type LocalAlbumURI = LocalURI & {
    type: 'local-album';
    artist: string;
    album: string;
};

export type LocalTrack = {
    type: 'track';
    uid: string;
    addedAt: Date;
    uri: string;
    name: string;
    album: {
        type: 'album';
        uri: string;
        name: string;
        images: {
            url: string;
            label: string;
        }[];
    };
    artists: {
        type: 'artist';
        uri: string;
        name: string;
    }[];
    discNumber: number;
    trackNumber: number;
    duration: {
        milliseconds: number;
    };
    isExplicit: boolean;
    isLocal: true;
    isPlayable: boolean;
    is19PlusOnly: boolean;
};

export type LocalTrackSortOption = {
    field: 'ALBUM' | 'TITLE' | 'ARTIST' | 'DURATION';
    order: 'DESC' | 'ASC';
};

export type LocalFilesAPI = {
    getTracks: (
        sort?: LocalTrackSortOption | undefined,
        search?: string | '',
    ) => Promise<LocalTrack[]>;
};
