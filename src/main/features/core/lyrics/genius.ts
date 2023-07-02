import axios, { AxiosResponse } from 'axios';
import { load } from 'cheerio';
import {
    LyricSource,
    InternetProviderLyricResponse,
    InternetProviderLyricSearchResponse,
    LyricSearchQuery,
} from '../../../../renderer/api/types';
import { orderSearchResults } from './shared';

const SEARCH_URL = 'https://genius.com/api/search/song';

// Adapted from https://github.com/NyaomiDEV/Sunamu/blob/master/src/main/lyricproviders/genius.ts

export interface GeniusResponse {
    meta: Meta;
    response: Response;
}

export interface Meta {
    status: number;
}

export interface Response {
    next_page: number;
    sections: Section[];
}

export interface Section {
    hits: Hit[];
    type: string;
}

export interface Hit {
    highlights: any[];
    index: string;
    result: Result;
    type: string;
}

export interface Result {
    _type: string;
    annotation_count: number;
    api_path: string;
    artist_names: string;
    featured_artists: any[];
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
    primary_artist: PrimaryArtist;
    pyongs_count: null;
    relationships_index_url: string;
    release_date_components: ReleaseDateComponents;
    release_date_for_display: string;
    release_date_with_abbreviated_month_for_display: string;
    song_art_image_thumbnail_url: string;
    song_art_image_url: string;
    stats: Stats;
    title: string;
    title_with_featured: string;
    updated_by_human_at: number;
    url: string;
}

export interface PrimaryArtist {
    _type: string;
    api_path: string;
    header_image_url: string;
    id: number;
    image_url: string;
    index_character: string;
    is_meme_verified: boolean;
    is_verified: boolean;
    name: string;
    slug: string;
    url: string;
}

export interface ReleaseDateComponents {
    day: number;
    month: number;
    year: number;
}

export interface Stats {
    hot: boolean;
    unreviewed_annotations: number;
}

export async function getSearchResults(
    params: LyricSearchQuery,
): Promise<InternetProviderLyricSearchResponse[] | null> {
    let result: AxiosResponse<GeniusResponse>;

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

    const rawSongsResult = result.data.response?.sections?.[0]?.hits?.map((hit) => hit.result);

    if (!rawSongsResult) return null;

    const songResults: InternetProviderLyricSearchResponse[] = rawSongsResult.map((song) => {
        return {
            artist: song.artist_names,
            id: song.url,
            name: song.full_title,
            source: LyricSource.GENIUS,
        };
    });

    return orderSearchResults({ params, results: songResults });
}

async function getSongId(
    params: LyricSearchQuery,
): Promise<Omit<InternetProviderLyricResponse, 'lyrics'> | null> {
    let result: AxiosResponse<GeniusResponse>;
    try {
        result = await axios.get(SEARCH_URL, {
            params: {
                per_page: '1',
                q: `${params.artist} ${params.name}`,
            },
        });
    } catch (e) {
        console.error('Genius search request got an error!', e);
        return null;
    }

    const hit = result.data.response?.sections?.[0]?.hits?.[0]?.result;

    if (!hit) {
        return null;
    }

    return {
        artist: hit.artist_names,
        id: hit.url,
        name: hit.full_title,
        source: LyricSource.GENIUS,
    };
}

export async function getLyricsBySongId(url: string): Promise<string | null> {
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
    const response = await getSongId(params);
    if (!response) {
        console.error('Could not find the song on Genius!');
        return null;
    }

    const lyrics = await getLyricsBySongId(response.id);
    if (!lyrics) {
        console.error('Could not get lyrics on Genius!');
        return null;
    }

    return {
        artist: response.artist,
        id: response.id,
        lyrics,
        name: response.name,
        source: LyricSource.GENIUS,
    };
}
