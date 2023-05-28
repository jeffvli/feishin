import axios, { AxiosResponse } from 'axios';
import type { QueueSong } from '/@/renderer/api/types';

const SEARCH_URL = 'https://music.163.com/api/search/get';
const LYRICS_URL = 'https://music.163.com/api/song/lyric';

async function getSongId(metadata: QueueSong) {
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

  return result?.data.result?.songs?.[0].id;
}

async function getLyricsFromSongId(songId: string) {
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

export async function query(metadata: QueueSong): Promise<string | null> {
  const songId = await getSongId(metadata);
  if (!songId) {
    console.error('Could not find the song on NetEase!');
    return null;
  }

  const lyrics = await getLyricsFromSongId(songId);
  if (!lyrics) {
    console.error('Could not get lyrics on NetEase!');
    return null;
  }

  return lyrics;
}
