export type NpvEpisodeData = {
    episodeUnionV2: {
        __typename: 'Episode';
        id: string;
        uri: string;
        name: string;
        podcastV2: {
            data: {
                __typename: 'Podcast';
                uri: string;
                name: string;
                topics: {
                    items: {
                        __typename: 'PodcastTopic';
                        title: string;
                        uri: string;
                    }[];
                };
            };
        };
        type: 'PODCAST_EPISODE';
        transcripts: {
            items: {
                uri: string;
                cdnUrl: string;
                language: string;
            }[];
        };
    };
};
