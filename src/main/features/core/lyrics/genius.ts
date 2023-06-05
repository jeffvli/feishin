import axios, { AxiosResponse } from 'axios';
import { load } from 'cheerio';
import type { InternetProviderLyricResponse, QueueSong } from '/@/renderer/api/types';

const SEARCH_URL = 'https://genius.com/api/search/song';

// Adapted from https://github.com/NyaomiDEV/Sunamu/blob/master/src/main/lyricproviders/genius.ts

interface GeniusResponse {
  artist: string;
  title: string;
  url: string;
}

async function getSongURL(metadata: QueueSong): Promise<GeniusResponse | undefined> {
  let result: AxiosResponse<any, any>;
  try {
    result = await axios.get(SEARCH_URL, {
      params: {
        per_page: '1',
        q: `${metadata.artistName} ${metadata.name}`,
      },
    });
  } catch (e) {
    console.error('Genius search request got an error!', e);
    return undefined;
  }

  const hit = result.data.response?.sections?.[0]?.hits?.[0]?.result;

  if (!hit) {
    return undefined;
  }

  return {
    artist: hit.artist_names,
    title: hit.full_title,
    url: hit.url,
  };
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

export async function query(metadata: QueueSong): Promise<InternetProviderLyricResponse | null> {
  const response = await getSongURL(metadata);
  if (!response) {
    console.error('Could not find the song on Genius!');
    return null;
  }

  const lyrics = await getLyricsFromGenius(response.url);
  if (!lyrics) {
    console.error('Could not get lyrics on Genius!');
    return null;
  }

  return {
    artist: response.artist,
    lyrics,
    title: response.title,
  };
}
