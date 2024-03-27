export type ShowMetadata = {
    type: 'show';
    uri: string;
    name: string;
    description: string;
    htmlDescription: string;
    coverArt: { url: string; width: number; height: number }[];
    trailer: {
        type: 'episode';
        uri: string;
        name: string;
        coverArt: { url: string; width: number; height: number }[];
        audio: {
            items: unknown[];
        };
        audioPreview: unknown | null;
        sharingInfo: unknown | null;
        duration: {
            milliseconds: number;
        };
        contentRating: {
            label: string;
        };
    };
    topics: {
        uri: string;
        title: string;
    }[];
    podcastType: string;
    showTypes: unknown[];
    publisherName: string;
    consumptionOrder: string;
    nextBestEpisode: {
        type: string;
        data: {
            type: 'episode';
            uri: string;
            name: string;
            description: string;
            htmlDescription: string;
            episodeType: string;
            coverArt: { url: string; width: number; height: number }[];
            playedState: {
                playPositionMilliseconds: number;
                playPosition: number;
                state: string;
            };
            mediaTypes: string[];
            audio: {
                items: unknown[];
            };
            audioPreview: unknown | null;
            sharingInfo: unknown | null;
            segmentsCount: number;
            podcast: unknown | null;
            podcastSubscription: {
                isPaywalled: boolean;
                isUserSubscribed: boolean;
            };
            releaseDate: {
                isoString: string;
            };
            playability: {
                playable: boolean;
                reason: string;
            };
            contentRating: {
                label: string;
            };
            duration: {
                milliseconds: number;
            };
            contentInformation: unknown | null;
            transcripts: {
                uri: string;
                language: string;
                curated: boolean;
                cdnUrl: string;
            }[];
        };
    };
    gatedContentAccessReason: unknown | null;
};

export type ShowAPI = {
    getMetadata: (uri: string) => Promise<ShowMetadata>;
};
