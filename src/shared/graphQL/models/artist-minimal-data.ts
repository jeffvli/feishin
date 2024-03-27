export type ArtistMinimalData = {
    artistUnion: {
        __typename: 'Artist';
        id: string;
        uri: string;
        profile: {
            name: string;
        };
    };
};
