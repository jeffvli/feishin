import axios, { AxiosResponse } from 'axios';
import { LyricSource } from '../../../../renderer/types';
import type {
  InternetProviderLyricResponse,
  InternetProviderLyricSearchResponse,
  LyricSearchQuery,
} from '/@/renderer/api/types';

const SEARCH_URL = 'https://music.163.com/api/search/get';
const LYRICS_URL = 'https://music.163.com/api/song/lyric';

// Adapted from https://github.com/NyaomiDEV/Sunamu/blob/master/src/main/lyricproviders/netease.ts

interface NetEaseResponse {
  artist: string;
  id: string;
  name: string;
}

export async function getSearchResults(
  params: LyricSearchQuery,
): Promise<InternetProviderLyricSearchResponse[] | null> {
  let result: AxiosResponse<any, any>;
  try {
    result = await axios.get(SEARCH_URL, {
      params: {
        limit: 5,
        offset: 0,
        s: `${params.artist} ${params.name}`,
        type: '1',
      },
    });
  } catch (e) {
    console.error('NetEase search request got an error!', e);
    return null;
  }

  const songs = result?.data.result?.songs;

  if (!songs) return null;

  return songs.map((song: any) => {
    const artist = song.artists ? song.artists.map((artist: any) => artist.name).join(', ') : '';

    return {
      artist,
      id: song.id,
      name: song.name,
      source: LyricSource.NETEASE,
    };
  });
}

async function getSongId(params: LyricSearchQuery): Promise<NetEaseResponse | undefined> {
  const results = await getSearchResults(params);
  const song = results?.[0];

  if (!song) return undefined;

  return {
    artist: song.artist,
    id: song.id,
    name: song.name,
  };
}

async function getLyricsFromSongId(songId: string): Promise<string | undefined> {
  let result: AxiosResponse<any, any>;
  try {
    result = await axios.get(LYRICS_URL, {
      params: {
        id: songId,
        kv: '-1',
        lv: '-1',
      },
    });
  } catch (e) {
    console.error('NetEase lyrics request got an error!', e);
    return undefined;
  }

  return result.data.klyric?.lyric || result.data.lrc?.lyric;
}

export async function query(
  params: LyricSearchQuery,
): Promise<InternetProviderLyricResponse | null> {
  const response = await getSongId(params);
  if (!response) {
    console.error('Could not find the song on NetEase!');
    return null;
  }

  const lyrics = await getLyricsFromSongId(response.id);
  if (!lyrics) {
    console.error('Could not get lyrics on NetEase!');
    return null;
  }

  return {
    artist: response.artist,
    lyrics,
    name: response.name,
    source: LyricSource.NETEASE,
  };
}
