import axios, { AxiosResponse } from 'axios';
import { LyricSource } from '../../../../renderer/api/types';
import { orderSearchResults } from './shared';
import type {
  InternetProviderLyricResponse,
  InternetProviderLyricSearchResponse,
  LyricSearchQuery,
} from '/@/renderer/api/types';

const SEARCH_URL = 'https://music.163.com/api/search/get';
const LYRICS_URL = 'https://music.163.com/api/song/lyric';

// Adapted from https://github.com/NyaomiDEV/Sunamu/blob/master/src/main/lyricproviders/netease.ts

export interface NetEaseResponse {
  code: number;
  result: Result;
}

export interface Result {
  hasMore: boolean;
  songCount: number;
  songs: Song[];
}

export interface Song {
  album: Album;
  alias: string[];
  artists: Artist[];
  copyrightId: number;
  duration: number;
  fee: number;
  ftype: number;
  id: number;
  mark: number;
  mvid: number;
  name: string;
  rUrl: null;
  rtype: number;
  status: number;
  transNames?: string[];
}

export interface Album {
  artist: Artist;
  copyrightId: number;
  id: number;
  mark: number;
  name: string;
  picId: number;
  publishTime: number;
  size: number;
  status: number;
  transNames?: string[];
}

export interface Artist {
  albumSize: number;
  alias: any[];
  fansGroup: null;
  id: number;
  img1v1: number;
  img1v1Url: string;
  name: string;
  picId: number;
  picUrl: null;
  trans: null;
}

export async function getSearchResults(
  params: LyricSearchQuery,
): Promise<InternetProviderLyricSearchResponse[] | null> {
  let result: AxiosResponse<NetEaseResponse>;

  const searchQuery = [params.artist, params.name].join(' ');

  if (!searchQuery) {
    return null;
  }

  try {
    result = await axios.get(SEARCH_URL, {
      params: {
        limit: 5,
        offset: 0,
        s: searchQuery,
        type: '1',
      },
    });
  } catch (e) {
    console.error('NetEase search request got an error!', e);
    return null;
  }

  const rawSongsResult = result?.data.result?.songs;

  if (!rawSongsResult) return null;

  const songResults: InternetProviderLyricSearchResponse[] = rawSongsResult.map((song) => {
    const artist = song.artists ? song.artists.map((artist) => artist.name).join(', ') : '';

    return {
      artist,
      id: String(song.id),
      name: song.name,
      source: LyricSource.NETEASE,
    };
  });

  return orderSearchResults({ params, results: songResults });
}

async function getMatchedLyrics(
  params: LyricSearchQuery,
): Promise<Omit<InternetProviderLyricResponse, 'lyrics'> | null> {
  const results = await getSearchResults(params);

  const firstMatch = results?.[0];

  if (!firstMatch || (firstMatch?.score && firstMatch.score > 0.5)) {
    return null;
  }

  return firstMatch;
}

export async function getLyricsBySongId(songId: string): Promise<string | null> {
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
    return null;
  }

  return result.data.klyric?.lyric || result.data.lrc?.lyric;
}

export async function query(
  params: LyricSearchQuery,
): Promise<InternetProviderLyricResponse | null> {
  const lyricsMatch = await getMatchedLyrics(params);
  if (!lyricsMatch) {
    console.error('Could not find the song on NetEase!');
    return null;
  }

  const lyrics = await getLyricsBySongId(lyricsMatch.id);
  if (!lyrics) {
    console.error('Could not get lyrics on NetEase!');
    return null;
  }

  return {
    artist: lyricsMatch.artist,
    id: lyricsMatch.id,
    lyrics,
    name: lyricsMatch.name,
    source: LyricSource.NETEASE,
  };
}
