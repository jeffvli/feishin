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
                const text = lyrics.map(([, line]) => line).join('\n');
                const converted = await lyricsApi.convertFurigana(text);
                const convertedLines = converted.split('\n');
                return lyrics.map(([time], i) => [
                    time,
                    convertedLines[i] ?? lyrics[i][1],
                ]) as SynchronizedLyricsArray;
            }
            return lyrics;
        },
        queryKey: ['furigana', lyrics],
        staleTime: Infinity,
    });
};
