import Fuse from 'fuse.js';
import {
  InternetProviderLyricSearchResponse,
  LyricSearchQuery,
} from '../../../../renderer/api/types';

export const orderSearchResults = (args: {
  params: LyricSearchQuery;
  results: InternetProviderLyricSearchResponse[];
}) => {
  const { params, results } = args;

  const options: Fuse.IFuseOptions<InternetProviderLyricSearchResponse> = {
    fieldNormWeight: 1,
    includeScore: true,
    keys: [
      { getFn: (song) => song.name, name: 'name', weight: 3 },
      { getFn: (song) => song.artist, name: 'artist' },
    ],
    threshold: 1.0,
  };

  const fuse = new Fuse(results, options);

  const searchResults = fuse.search<InternetProviderLyricSearchResponse>({
    ...(params.artist && { artist: params.artist }),
    ...(params.name && { name: params.name }),
  });

  return searchResults.map((result) => ({
    ...result.item,
    score: result.score,
  }));
};
