import { useQuery } from '@tanstack/react-query';
import isElectron from 'is-electron';
import { queryKeys } from '/@/renderer/api/query-keys';
import {
  InternetProviderLyricSearchResponse,
  LyricSearchQuery,
  LyricSource,
} from '/@/renderer/api/types';
import { QueryHookArgs } from '/@/renderer/lib/react-query';

const lyricsIpc = isElectron() ? window.electron.lyrics : null;

export const useLyricSearch = (args: Omit<QueryHookArgs<LyricSearchQuery>, 'serverId'>) => {
  const { options, query } = args;

  return useQuery<Record<LyricSource, InternetProviderLyricSearchResponse[]>>({
    cacheTime: 1000 * 60 * 1,
    enabled: !!query.artist || !!query.name,
    queryFn: () => lyricsIpc?.searchRemoteLyrics(query),
    queryKey: queryKeys.songs.lyricsSearch(query),
    staleTime: 1000 * 60 * 1,
    ...options,
  });
};
