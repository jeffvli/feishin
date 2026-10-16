import Fuse, { FuseResult, IFuseOptions } from 'fuse.js';

import {
    InternetProviderLyricSearchResponse,
    LyricSearchQuery,
} from '/@/shared/types/domain-types';

export const orderSearchResults = (args: {
    params: LyricSearchQuery;
    results: InternetProviderLyricSearchResponse[];
}) => {
    const { params, results } = args;

    const options: IFuseOptions<InternetProviderLyricSearchResponse> = {
        fieldNormWeight: 1,
        includeScore: true,
        keys: [
            { getFn: (song) => song.name, name: 'name', weight: 2 },
            { getFn: (song) => song.artist, name: 'artist', weight: 2 },
        ],
        threshold: 0.6,
    };

    const fuse = new Fuse(results, options);

    let searchResults: Array<FuseResult<InternetProviderLyricSearchResponse>>;

    if (params.artist && params.name) {
        const artistFuse = new Fuse(results, {
            includeScore: true,
            keys: [{ getFn: (song) => song.artist, name: 'artist' }],
            threshold: 0.6,
        });

        const nameFuse = new Fuse(results, {
            includeScore: true,
            keys: [{ getFn: (song) => song.name, name: 'name' }],
            threshold: 0.6,
        });

        const artistResults = artistFuse.search(params.artist);
        const nameResults = nameFuse.search(params.name);

        const artistScores = new Map(artistResults.map((r) => [r.item.id, r.score ?? 1]));
        const nameScores = new Map(nameResults.map((r) => [r.item.id, r.score ?? 1]));

        const combinedResults = new Map<string, FuseResult<InternetProviderLyricSearchResponse>>();

        artistResults.forEach((result) => {
            const nameScore = nameScores.get(result.item.id);
            if (nameScore !== undefined) {
                const combinedScore = Math.max(result.score ?? 1, nameScore);
                combinedResults.set(result.item.id, {
                    ...result,
                    score: combinedScore,
                });
            }
        });

        nameResults.forEach((result) => {
            if (!combinedResults.has(result.item.id)) {
                const artistScore = artistScores.get(result.item.id);
                if (artistScore !== undefined) {
                    const combinedScore = Math.max(result.score ?? 1, artistScore);
                    combinedResults.set(result.item.id, {
                        ...result,
                        score: combinedScore,
                    });
                }
            }
        });

        searchResults = Array.from(combinedResults.values());
    } else {
        searchResults = fuse.search({
            ...(params.artist && { artist: params.artist }),
            ...(params.name && { name: params.name }),
        });
    }

    const sortedResults = searchResults.sort((a, b) => {
        const aIsSync = a.item.isSync === true ? 1 : 0;
        const bIsSync = b.item.isSync === true ? 1 : 0;

        if (aIsSync !== bIsSync) {
            return bIsSync - aIsSync;
        }

        return (a.score || 0) - (b.score || 0);
    });

    return sortedResults.map((result) => ({
        ...result.item,
        score: result.score,
    }));
};
