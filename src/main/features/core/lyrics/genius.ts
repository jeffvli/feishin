import axios, { AxiosResponse } from 'axios';
import { load } from 'cheerio';
import type {
  InternetProviderLyricResponse,
  InternetProviderLyricSearchResponse,
  LyricSearchQuery,
} from '/@/renderer/api/types';
import { LyricSource } from '../../../../renderer/api/types';

const SEARCH_URL = 'https://genius.com/api/search/song';

// Adapted from https://github.com/NyaomiDEV/Sunamu/blob/master/src/main/lyricproviders/genius.ts

interface GeniusResponse {
  artist: string;
  name: string;
  url: string;
}

interface GeniusSearchResponse {
  response: {
    sections: {
      hits: {
        highlights: any[];
        index: string;
        result: {
          _type: string;
          annotation_count: number;
          api_path: string;
          artist_names: string;
          featured_artits: any[];
          full_title: string;
          header_image_thumbnail_url: string;
          header_image_url: string;
          id: number;
          instrumental: boolean;
          language: string;
          lyrics_owner_id: number;
          lyrics_state: string;
          lyrics_updated_at: number;
          path: string;
          primary_artist: Record<any, any>;
          pyongs_count: number;
          relationships_index_url: string;
          release_date_components: Record<any, any>;
          release_date_for_display: string;
          release_date_with_abbreviated_month_for_display: string;
          song_art_image_thumbnail_url: string;
          song_art_image_url: string;
          stats: Record<any, any>;
          title: string;
          title_with_featured: string;
          updated_by_human_at: number;
          url: string;
        };
        type: string;
      }[];
      type: string;
    }[];
  };
}

export async function getSearchResults(
  params: LyricSearchQuery,
): Promise<InternetProviderLyricSearchResponse[] | null> {
  let result: AxiosResponse<GeniusSearchResponse>;

  const searchQuery = [params.artist, params.name].join(' ');

  if (!searchQuery) {
    return null;
  }

  try {
    result = await axios.get(SEARCH_URL, {
      params: {
        per_page: '5',
        q: searchQuery,
      },
    });
  } catch (e) {
    console.error('Genius search request got an error!', e);
    return null;
  }

  const songs = result.data.response?.sections?.[0]?.hits?.map((hit) => hit.result);

  if (!songs) return null;

  return songs.map((song: any) => {
    return {
      artist: song.artist_names,
      id: song.url,
      name: song.full_title,
      source: LyricSource.GENIUS,
    };
  });
}

async function getSongURL(params: LyricSearchQuery): Promise<GeniusResponse | undefined> {
  let result: AxiosResponse<GeniusSearchResponse>;
  try {
    result = await axios.get(SEARCH_URL, {
      params: {
        per_page: '1',
        q: `${params.artist} ${params.name}`,
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
    name: hit.full_title,
    url: hit.url,
  };
}

export async function getLyricsByURL(url: string): Promise<string | null> {
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

export async function query(
  params: LyricSearchQuery,
): Promise<InternetProviderLyricResponse | null> {
  const response = await getSongURL(params);
  if (!response) {
    console.error('Could not find the song on Genius!');
    return null;
  }

  const lyrics = await getLyricsByURL(response.url);
  if (!lyrics) {
    console.error('Could not get lyrics on Genius!');
    return null;
  }

  return {
    artist: response.artist,
    lyrics,
    name: response.name,
    source: LyricSource.GENIUS,
  };
}
