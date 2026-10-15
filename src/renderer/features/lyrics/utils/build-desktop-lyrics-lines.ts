import type { DesktopLyricsSnapshot } from '/@/shared/types/desktop-lyrics';
import type { SynchronizedLyrics } from '/@/shared/types/domain-types';

import {
    findOverlayLineByTime,
    normalizeLyrics,
} from '/@/renderer/features/lyrics/api/lyrics-utils';

// Consume the same converted/translated results as the original lyric renderer.
export const buildDesktopLyricsLines = ({
    furiganaLyrics,
    lyrics,
    pronunciationOverlay,
    romajiLyrics,
    translatedLyrics,
    translationOverlay,
}: {
    furiganaLyrics?: SynchronizedLyrics;
    lyrics: SynchronizedLyrics;
    pronunciationOverlay?: SynchronizedLyrics;
    romajiLyrics?: SynchronizedLyrics;
    translatedLyrics?: null | string;
    translationOverlay?: SynchronizedLyrics;
}): Pick<DesktopLyricsSnapshot, 'lines' | 'romajiLines' | 'translationLines'> => {
    const original = normalizeLyrics(lyrics);
    const converted = normalizeLyrics(furiganaLyrics ?? lyrics);
    const translated = translatedLyrics?.split('\n');
    const translationLines = original.flatMap((line, index) => {
        const text = translationOverlay
            ? findOverlayLineByTime(translationOverlay, line.startMs, index)
            : translated?.[index];
        return text && text !== line.text && Number.isFinite(line.startMs)
            ? [{ startMs: line.startMs, text }]
            : [];
    });
    const romanized = romajiLyrics ? normalizeLyrics(romajiLyrics) : undefined;
    const romajiLines =
        romanized || pronunciationOverlay
            ? original
                  .map((line, index) => ({
                      startMs: line.startMs,
                      text:
                          (pronunciationOverlay
                              ? findOverlayLineByTime(pronunciationOverlay, line.startMs, index)
                              : romanized?.[index]?.text
                          )?.replace(/_\s*BREAK\s*_/g, '_BREAK_') ?? '',
                  }))
                  .filter((line) => Number.isFinite(line.startMs))
                  .sort((a, b) => a.startMs - b.startMs)
            : undefined;
    return {
        lines: converted
            .map(({ startMs, text }) => ({ startMs, text: text ?? '' }))
            .filter((line) => Number.isFinite(line.startMs))
            .sort((a, b) => a.startMs - b.startMs),
        romajiLines: romajiLines?.some((line) => line.text) ? romajiLines : undefined,
        translationLines: translationLines.length ? translationLines : undefined,
    };
};
