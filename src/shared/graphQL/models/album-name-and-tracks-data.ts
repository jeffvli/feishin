export type AlbumNameAndTracksData = {
    albumUnion: {
        __typename: 'Album';
        name: string;
        tracks: {
            items: {
                track: {
                    uri: string;
                };
            }[];
            pagingInfo: {
                nextOffset: null | number;
            };
        };
    };
};
