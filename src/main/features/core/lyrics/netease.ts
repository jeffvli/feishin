import axios, { AxiosResponse } from 'axios';
import type { InternetProviderLyricResponse, QueueSong } from '/@/renderer/api/types';

const SEARCH_URL = 'https://music.163.com/api/search/get';
const LYRICS_URL = 'https://music.163.com/api/song/lyric';

// Adapted from https://github.com/NyaomiDEV/Sunamu/blob/master/src/main/lyricproviders/netease.ts

interface NetEaseResponse {
  artist: string;
  id: string;
  title: string;
}

async function getSongId(metadata: QueueSong): Promise<NetEaseResponse | undefined> {
  let result: AxiosResponse<any, any>;
  try {
    result = await axios.get(SEARCH_URL, {
      params: {
        limit: 10,
        offset: 0,
        s: `${metadata.artistName} ${metadata.name}`,
        type: '1',
      },
    });
  } catch (e) {
    console.error('NetEase search request got an error!', e);
    return undefined;
  }

  const song = result?.data.result?.songs?.[0];

  if (!song) return undefined;

  const artist = song.artists ? song.artists.map((artist: any) => artist.name).join(', ') : '';

  return {
    artist,
    id: song.id,
    title: song.name,
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

export async function query(metadata: QueueSong): Promise<InternetProviderLyricResponse | null> {
  const response = await getSongId(metadata);
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
    title: response.title,
  };
}
