import { useQuery } from '@tanstack/react-query';

import * as lyricsApi from '/@/lyrics-conversion-api';
import {
    alignFuriganaToWordCues,
    alignRomajiTokensToWordCues,
    LyricTextToken,
    RomajiToken,
} from '/@/renderer/features/lyrics/api/lyric-conversion';
import { normalizeLyrics } from '/@/renderer/features/lyrics/api/lyrics-utils';
import { LyricsResponse, SyncedCueLine, SynchronizedLyrics } from '/@/shared/types/domain-types';

const convertSyncedLyricsFurigana = async (
    lyrics: SynchronizedLyrics,
): Promise<SynchronizedLyrics> => {
    return Promise.all(
        normalizeLyrics(lyrics).map(async (line) => ({
            ...line,
            cueLines: line.cueLines
                ? await Promise.all(
                      line.cueLines.map(async (cueLine) => {
                          const tokens = (await lyricsApi.parseLyricsTextTokens(
                              cueLine.value,
                          )) as LyricTextToken[];
                          const alignedWords = cueLine.words.length
                              ? await alignFuriganaToWordCues(
                                    cueLine.value,
                                    cueLine.words,
                                    tokens,
                                    (text) => lyricsApi.convertFuriganaFragment(text),
                                )
                              : cueLine.words;
                          return {
                              ...cueLine,
                              value: await lyricsApi.convertFurigana(cueLine.value),
                              words: alignedWords ?? cueLine.words,
                          };
                      }),
                  )
                : undefined,
            text: await lyricsApi.convertFurigana(line.text),
        })),
    );
};

const convertSyncedLyricsRomaji = async (
    lyrics: SynchronizedLyrics,
    convert: (text: string) => Promise<string>,
): Promise<SynchronizedLyrics> =>
    Promise.all(
        normalizeLyrics(lyrics).map(async (line) => ({
            ...line,
            cueLines: line.cueLines
                ? await Promise.all(
                      line.cueLines.map(async (cueLine) => ({
                          ...cueLine,
                          value: await convert(cueLine.value),
                          words: await Promise.all(
                              cueLine.words.map(async (word) => ({
                                  ...word,
                                  text: await convert(word.text),
                              })),
                          ),
                      })),
                  )
                : undefined,
            text: await convert(line.text),
        })),
    );

export const useFuriganaLyrics = (lyrics: LyricsResponse | null | undefined, enabled: boolean) => {
    return useQuery({
        enabled: enabled && !!lyrics,
        queryFn: async () => {
            if (!lyrics || !enabled) return lyrics;

            if (typeof lyrics === 'string') {
                return await lyricsApi.convertFurigana(lyrics);
            }

            if (Array.isArray(lyrics)) {
                return convertSyncedLyricsFurigana(lyrics);
            }

            return lyrics;
        },
        queryKey: ['furigana', lyrics],
        staleTime: Infinity,
    });
};

export const useRomajiLyrics = (lyrics: LyricsResponse | null | undefined, enabled: boolean) => {
    return useQuery({
        enabled: enabled && !!lyrics,
        queryFn: async () => {
            if (!lyrics || !enabled) return lyrics;

            if (typeof lyrics === 'string') {
                return await lyricsApi.convertRomaji(lyrics);
            }

            if (Array.isArray(lyrics)) {
                return convertSyncedLyricsRomaji(lyrics, (text) => lyricsApi.convertRomaji(text));
            }

            return lyrics;
        },
        queryKey: ['romaji', lyrics],
        staleTime: Infinity,
    });
};

export type SyncedRomajiLyrics = ((null | SyncedCueLine)[] | null)[];

const buildSyncedRomajiLine = async (
    cueLines: SyncedCueLine[],
): Promise<(null | SyncedCueLine)[]> => {
    const romajiCueLines: (null | SyncedCueLine)[] = [];

    for (const cueLine of cueLines) {
        if (!cueLine.words.length) {
            romajiCueLines.push(null);
            continue;
        }

        const tokens = (await lyricsApi.convertRomajiTokens(cueLine.value)) as RomajiToken[];
        if (!tokens.length) {
            romajiCueLines.push(null);
            continue;
        }

        const alignedWords = alignRomajiTokensToWordCues(cueLine.value, cueLine.words, tokens);

        if (!alignedWords) {
            romajiCueLines.push(null);
            continue;
        }

        romajiCueLines.push({
            ...cueLine,
            words: alignedWords,
        });
    }

    return romajiCueLines;
};

export const useSyncedRomajiLyrics = (
    lyrics: null | SynchronizedLyrics | undefined,
    enabled: boolean,
) => {
    return useQuery({
        enabled: enabled && !!lyrics,
        queryFn: async (): Promise<null | SyncedRomajiLyrics> => {
            if (!lyrics || !enabled) {
                return null;
            }

            const result: SyncedRomajiLyrics = [];

            for (const line of lyrics) {
                if (
                    !line.cueLines?.length ||
                    !line.cueLines.some((cueLine) => cueLine.words.length)
                ) {
                    result.push(null);
                    continue;
                }

                const romajiCueLines = await buildSyncedRomajiLine(line.cueLines);
                result.push(romajiCueLines.some((entry) => entry !== null) ? romajiCueLines : null);
            }

            return result;
        },
        queryKey: ['romaji-synced', lyrics],
        staleTime: Infinity,
    });
};
