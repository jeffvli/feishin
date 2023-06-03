import { useQuery } from '@tanstack/react-query';
import { LyricsQuery } from '/@/renderer/api/types';
import { QueryHookArgs } from '/@/renderer/lib/react-query';
import { getServerById } from '/@/renderer/store';
import { controller } from '/@/renderer/api/controller';
import { queryKeys } from '/@/renderer/api/query-keys';
import { ServerType } from '/@/renderer/types';

export const useSongLyrics = (args: QueryHookArgs<LyricsQuery>) => {
  const { query, serverId } = args;
  const server = getServerById(serverId);

  return useQuery({
    // Note: This currently fetches for every song, even if it shouldn't have
    // lyrics, because for some reason HasLyrics is not exposed. Thus, ignore the error
    onError: () => {},
    queryFn: ({ signal }) => {
      if (!server) throw new Error('Server not found');
      // This should only be called for Jellyfin. Return null to ignore errors
      if (server.type !== ServerType.JELLYFIN) return null;
      return controller.getLyrics({ apiClientProps: { server, signal }, query });
    },
    queryKey: queryKeys.songs.lyrics(server?.id || '', query),
  });
};
