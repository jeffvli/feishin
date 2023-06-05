import { useQuery } from '@tanstack/react-query';
import {
  LyricsQuery,
  QueueSong,
  SynchronizedLyricsArray,
  InternetProviderLyricResponse,
} from '/@/renderer/api/types';
import { QueryHookArgs } from '/@/renderer/lib/react-query';
import { getServerById, useLyricsSettings } from '/@/renderer/store';
import { queryKeys } from '/@/renderer/api/query-keys';
import { ServerType } from '/@/renderer/types';
import { api } from '/@/renderer/api';
import isElectron from 'is-electron';

const lyricsIpc = isElectron() ? window.electron.lyrics : null;

// use by https://github.com/ustbhuangyi/lyric-parser
const timeExp = /\[(\d{2,}):(\d{2})(?:\.(\d{2,3}))?]([^\n]+)\n/g;

const formatLyrics = (lyrics: string) => {
  const synchronizedLines = lyrics.matchAll(timeExp);
  const formattedLyrics: SynchronizedLyricsArray = [];

  for (const line of synchronizedLines) {
    const [, minute, sec, ms, text] = line;
    const minutes = parseInt(minute, 10);
    const seconds = parseInt(sec, 10);
    const milis = ms?.length === 3 ? parseInt(ms, 10) : parseInt(ms, 10) * 10;

    const timeInMilis = (minutes * 60 + seconds) * 1000 + milis;
    formattedLyrics.push([timeInMilis, text]);
  }

  // If no synchronized lyrics were found, return the original lyrics
  if (formattedLyrics.length === 0) return lyrics;

  return formattedLyrics;
};

export const useServerLyrics = (args: QueryHookArgs<LyricsQuery>) => {
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
      return api.controller.getLyrics({ apiClientProps: { server, signal }, query });
    },
    queryKey: queryKeys.songs.lyrics(server?.id || '', query),
  });
};

export const useSongLyrics = (args: QueryHookArgs<LyricsQuery>, song: QueueSong | undefined) => {
  const { query } = args;
  const { fetch } = useLyricsSettings();
  const server = getServerById(song?.serverId);

  return useQuery({
    cacheTime: 1000 * 60 * 10,
    enabled: !!song && !!server,
    onError: () => {},
    queryFn: async ({ signal }) => {
      if (!server) throw new Error('Server not found');
      if (!song) return null;

      if (song.lyrics) {
        return {
          artist: song.artists?.[0]?.name,
          lyrics: formatLyrics(song.lyrics),
          name: song.name,
          source: server?.name ?? 'music server',
        };
      }

      if (server.type === ServerType.JELLYFIN) {
        const jfLyrics = await api.controller.getLyrics({
          apiClientProps: { server, signal },
          query: { songId: song.id },
        });

        if (jfLyrics) {
          return {
            artist: song.artists?.[0]?.name,
            lyrics: jfLyrics,
            name: song.name,
            source: server?.name ?? 'music server',
          };
        }
      }

      if (fetch) {
        const remoteLyricsResult: InternetProviderLyricResponse | null =
          await lyricsIpc?.fetchRemoteLyrics(song);

        if (remoteLyricsResult) {
          return {
            ...remoteLyricsResult,
            lyrics: formatLyrics(remoteLyricsResult.lyrics),
          };
        }
      }

      return null;
    },
    queryKey: queryKeys.songs.lyrics(server?.id || '', query),
    staleTime: 1000 * 60 * 2,
  });
};
