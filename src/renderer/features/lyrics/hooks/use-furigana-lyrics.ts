import { useQuery } from '@tanstack/react-query';
import isElectron from 'is-electron';

import { LyricsResponse, SynchronizedLyricsArray } from '/@/shared/types/domain-types';

const lyricsApi = isElectron() ? window.api.lyrics : null;

export const useFuriganaLyrics = (lyrics: LyricsResponse | null | undefined, enabled: boolean) => {
    return useQuery({
        enabled: enabled && !!lyrics && !!lyricsApi,
        queryFn: async () => {
            if (!lyrics || !lyricsApi || !enabled) return lyrics;

            if (typeof lyrics === 'string') {
                return await lyricsApi.convertFurigana(lyrics);
            } else if (Array.isArray(lyrics)) {
                const converted = await Promise.all(
                    lyrics.map(async ([time, line]) => [
                        time,
                        await lyricsApi.convertFurigana(line),
                    ]),
                );
                return converted as SynchronizedLyricsArray;
            }
            return lyrics;
        },
        queryKey: ['furigana', lyrics],
        staleTime: Infinity,
    });
};

export const useRomajiLyrics = (lyrics: LyricsResponse | null | undefined, enabled: boolean) => {
    return useQuery({
        enabled: enabled && !!lyrics && !!lyricsApi,
        queryFn: async () => {
            if (!lyrics || !lyricsApi || !enabled) return lyrics;

            if (typeof lyrics === 'string') {
                return await lyricsApi.convertRomaji(lyrics);
            } else if (Array.isArray(lyrics)) {
                const converted = await Promise.all(
                    lyrics.map(async ([time, line]) => [time, await lyricsApi.convertRomaji(line)]),
                );
                return converted as SynchronizedLyricsArray;
            }
            return lyrics;
        },
        queryKey: ['romaji', lyrics],
        staleTime: Infinity,
    });
};
