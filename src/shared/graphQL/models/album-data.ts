import type { ImageSource } from './image-source';

export type AlbumData = {
    albumUnion: {
        __typename: 'Album';
        uri: string;
        name: string;
        artists: {
            totalCount: number;
            items: {
                id: string;
                uri: string;
                profile: {
                    name: string;
                };
                visuals: {
                    avatarImage: {
                        sources: ImageSource[];
                    };
                };
                sharingInfo: {
                    shareUrl: string;
                };
            }[];
        };
        coverArt: {
            extractedColors: {
                colorRaw: {
                    hex: string;
                };
                colorLight: {
                    hex: string;
                };
                colorDark: {
                    hex: string;
                };
            };
            sources: ImageSource[];
        };
        discs: {
            totalCount: number;
            items: {
                number: number;
                tracks: {
                    totalCount: number;
                };
            }[];
        };
        releases: {
            totalCount: number;
            items: unknown[];
        };
        type: 'SINGLE';
        date: {
            isoString: string;
            precision: 'DAY';
        };
        playability: {
            playable: boolean;
            reason: 'PLAYABLE';
        };
        label: string;
        copyright: {
            totalCount: number;
            items: {
                type: string;
                text: string;
            }[];
        };
        courtesyLine: string;
        saved: boolean;
        sharingInfo: {
            shareUrl: string;
            shareId: string;
        };
        tracks: {
            totalCount: number;
            items: {
                uid: string;
                track: {
                    saved: boolean;
                    uri: string;
                    name: string;
                    playCount: string;
                    discNumber: number;
                    trackNumber: number;
                    contentRating: {
                        label: string;
                    };
                    relinkingInformation: unknown | null;
                    duration: {
                        totalMilliseconds: number;
                    };
                    playability: {
                        playable: boolean;
                    };
                    artists: {
                        items: {
                            uri: string;
                            profile: {
                                name: string;
                            };
                        }[];
                    };
                };
            }[];
        }[];
        moreAlbumsByArtist: {
            items: {
                discography: {
                    popularReleasesAlbums: {
                        items: {
                            id: string;
                            uri: string;
                            name: string;
                            date: {
                                year: number;
                            };
                            coverArt: {
                                sources: ImageSource[];
                            };
                            playability: {
                                playable: boolean;
                                reason: 'PLAYABLE';
                            };
                            sharingInfo: {
                                shareId: string;
                                shareUrl: string;
                            };
                            type: 'SINGLE';
                        }[];
                    };
                };
            }[];
        };
    };
};
