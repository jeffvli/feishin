import { SyncedWordCue } from '/@/shared/types/domain-types';

// eslint-disable-next-line no-irregular-whitespace
const BREAK_CHAR_RE = /[\s​­\p{Dash_Punctuation}]/u;
const TRAILING_WS_RE = /\s+$/;
const SEGMENT_LENGTH_THRESHOLD = 5;
const GRAPHEME_WRAP_RE =
    /[\p{sc=Han}\p{sc=Hiragana}\p{sc=Katakana}\p{sc=Hangul}\p{sc=Thai}\p{sc=Lao}\p{sc=Khmer}\p{sc=Myanmar}]/u;

export type SplitWordCue = SyncedWordCue & {
    isWrapAfter?: boolean;
};

const shouldSplit = (text: string): boolean => {
    const core = text.replace(TRAILING_WS_RE, '');
    if (core.length <= SEGMENT_LENGTH_THRESHOLD) {
        return false;
    }

    return !BREAK_CHAR_RE.test(core);
};

const segment = (text: string): string[] => {
    try {
        const wordSeg = new Intl.Segmenter(undefined, { granularity: 'word' });
        const words = Array.from(wordSeg.segment(text), (entry) => entry.segment);
        if (words.length > 1) {
            return words;
        }

        if (!GRAPHEME_WRAP_RE.test(text)) {
            return [text];
        }

        const graphSeg = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
        return Array.from(graphSeg.segment(text), (entry) => entry.segment);
    } catch {
        return Array.from(text);
    }
};

export const splitWordCue = (word: SyncedWordCue): SplitWordCue[] => {
    if (!shouldSplit(word.text)) {
        return [{ ...word, isWrapAfter: false }];
    }

    const segments = segment(word.text);
    if (segments.length <= 1) {
        return [{ ...word, isWrapAfter: false }];
    }

    const duration = word.endMs - word.startMs;
    const perDuration = duration / segments.length;

    return segments.map((seg, index) => ({
        endMs: word.startMs + (index + 1) * perDuration,
        isWrapAfter: index < segments.length - 1,
        startMs: word.startMs + index * perDuration,
        text: seg,
    }));
};

export const splitWordCues = (words: SyncedWordCue[]): SplitWordCue[] =>
    words.flatMap((word) => splitWordCue(word));
