export type DlnaChangedTrack = {
    trackUrl: string;
};

export type DlnaDevice = {
    name: string;
    url: string;
};

export type DlnaInitialize = {
    deviceUrl: string;
    volume: number;
};

export type DlnaMetadata = {
    album?: string;
    albumArtMimeType?: string;
    albumArtSize?: number;
    albumArtUrl?: string;
    bitrate?: number;
    creator?: string;
    date?: string;
    discNumber?: number;
    duration?: number;
    genre?: string;
    size?: number;
    title?: string;
    trackNumber?: number;
    type?: 'audio' | 'image' | 'image';
};

export type DlnaPositionInfo = {
    position: number;
    trackUrl: string;
};

export type DlnaQueue = {
    current: DlnaQueueItem;
    isPaused: boolean;
    next?: DlnaQueueItem;
};

export type DlnaQueueItem = {
    metadata: DlnaMetadata;
    mimeType: string;
    url: string;
};
