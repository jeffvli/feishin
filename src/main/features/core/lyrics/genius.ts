import axios, { AxiosResponse } from 'axios';
import { load } from 'cheerio';
import type { QueueSong } from '/@/renderer/api/types';

const search_url = 'https://genius.com/api/search/song';

async function getSongURL(metadata: QueueSong) {
  let result: AxiosResponse<any, any>;
  try {
    result = await axios.get(search_url, {
      params: {
        per_page: '1',
        q: `${metadata.artistName} ${metadata.name}`,
      },
    });
  } catch (e) {
    console.error('Genius search request got an error!', e);
    return undefined;
  }

  return result.data.response?.sections?.[0]?.hits?.[0]?.result?.url;
}

async function getLyricsFromGenius(url: string): Promise<string | null> {
  let result: AxiosResponse<string, any>;
  try {
    result = await axios.get<string>(url, { responseType: 'text' });
  } catch (e) {
    console.error('Genius lyrics request got an error!', e);
    return null;
  }

  const $ = load(result.data.split('<br/>').join('\n'));
  const lyricsDiv = $('div.lyrics');

  if (lyricsDiv.length > 0) return lyricsDiv.text().trim();

  const lyricSections = $('div[class^=Lyrics__Container]')
    .map((_, e) => $(e).text())
    .toArray()
    .join('\n');
  return lyricSections;
}

export async function query(metadata: QueueSong): Promise<string | null> {
  const songId = await getSongURL(metadata);
  if (!songId) {
    console.error('Could not find the song on Genius!');
    return null;
  }

  const lyrics = await getLyricsFromGenius(songId);
  if (!lyrics) {
    console.error('Could not get lyrics on Genius!');
    return null;
  }

  return lyrics;
}
