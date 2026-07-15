import { SyncedWordCue } from '/@/shared/types/domain-types';

export type LyricTextToken = {
    endChar: number;
    startChar: number;
    text: string;
};

export type RomajiToken = LyricTextToken & {
    romaji: string;
};

const rangesOverlap = (aStart: number, aEnd: number, bStart: number, bEnd: number): boolean =>
    aStart < bEnd && bStart < aEnd;

const sliceRomajiForOverlap = (
    token: RomajiToken,
    overlapStart: number,
    overlapEnd: number,
): string => {
    const tokenLen = token.endChar - token.startChar;
    if (tokenLen <= 0 || overlapEnd <= overlapStart || !token.romaji.length) {
        return '';
    }

    const relStart = Math.max(0, overlapStart - token.startChar);
    const relEnd = Math.min(tokenLen, overlapEnd - token.startChar);
    if (relEnd <= relStart) {
        return '';
    }

    const startIdx = Math.floor((relStart / tokenLen) * token.romaji.length);
    const endIdx =
        relEnd >= tokenLen
            ? token.romaji.length
            : Math.floor((relEnd / tokenLen) * token.romaji.length);

    if (endIdx <= startIdx) {
        return token.romaji.slice(startIdx, Math.min(startIdx + 1, token.romaji.length));
    }

    return token.romaji.slice(startIdx, endIdx);
};

const findWordCueEndingToken = (
    token: RomajiToken,
    wordRanges: { end: number; start: number }[],
): number => {
    let bestIndex = -1;
    let bestEnd = -1;

    for (let index = 0; index < wordRanges.length; index += 1) {
        const range = wordRanges[index];
        const overlaps =
            range.start < token.endChar &&
            range.end > token.startChar &&
            range.end <= token.endChar;

        if (overlaps && range.end > bestEnd) {
            bestEnd = range.end;
            bestIndex = index;
        }
    }

    return bestIndex;
};

const isWhitespaceToken = (token: RomajiToken): boolean => /^\s+$/u.test(token.text);

type FuriganaToken = LyricTextToken & {
    furigana: string;
};

const KANJI_RE = /[\u4e00-\u9fff]/u;
const RUBY_BLOCK_RE = /^<ruby>([^<]*)<rp>[^<]*<\/rp><rt>([^<]*)<\/rt><rp>[^<]*<\/rp><\/ruby>$/;

const sliceReadingByProportion = (
    reading: string,
    relStart: number,
    relEnd: number,
    tokenLen: number,
): string => {
    if (tokenLen <= 0 || relEnd <= relStart || !reading.length) {
        return '';
    }

    const startIdx = Math.floor((relStart / tokenLen) * reading.length);
    const endIdx =
        relEnd >= tokenLen ? reading.length : Math.floor((relEnd / tokenLen) * reading.length);

    if (endIdx <= startIdx) {
        return reading.slice(startIdx, Math.min(startIdx + 1, reading.length));
    }

    return reading.slice(startIdx, endIdx);
};

const wrapRuby = (base: string, reading: string): string =>
    `<ruby>${base}<rp>(</rp><rt>${reading}</rt><rp>)</rp></ruby>`;

const buildPerCharFuriganaSegments = (tokenText: string, furiganaHtml: string): string[] => {
    const segments: string[] = [];
    let htmlCursor = 0;

    while (htmlCursor < furiganaHtml.length && segments.length < tokenText.length) {
        const rubyStart = furiganaHtml.indexOf('<ruby>', htmlCursor);

        if (rubyStart === -1 || rubyStart > htmlCursor) {
            const plainEnd = rubyStart === -1 ? furiganaHtml.length : rubyStart;
            const plain = furiganaHtml.slice(htmlCursor, plainEnd);
            for (const char of plain) {
                segments.push(char);
            }
            htmlCursor = plainEnd;
            continue;
        }

        const rubyEnd = furiganaHtml.indexOf('</ruby>', rubyStart);
        if (rubyEnd === -1) {
            break;
        }

        const rubyBlock = furiganaHtml.slice(rubyStart, rubyEnd + 7);
        const baseMatch = rubyBlock.match(RUBY_BLOCK_RE);
        if (!baseMatch) {
            htmlCursor = rubyEnd + 7;
            continue;
        }

        const [, base, reading] = baseMatch;
        if (base.length === 1) {
            segments.push(rubyBlock);
        } else {
            for (let index = 0; index < base.length; index += 1) {
                const char = base[index];
                const charReading = sliceReadingByProportion(
                    reading,
                    index,
                    index + 1,
                    base.length,
                );
                segments.push(KANJI_RE.test(char) ? wrapRuby(char, charReading) : char);
            }
        }

        htmlCursor = rubyEnd + 7;
    }

    if (segments.length === tokenText.length) {
        return segments;
    }

    return [...tokenText].map((char, index) => {
        if (!KANJI_RE.test(char)) {
            return char;
        }

        const singleRuby = furiganaHtml.match(RUBY_BLOCK_RE);
        if (singleRuby && singleRuby[1] === tokenText) {
            const charReading = sliceReadingByProportion(
                singleRuby[2],
                index,
                index + 1,
                tokenText.length,
            );
            return wrapRuby(char, charReading);
        }

        return char;
    });
};

const sliceFuriganaForOverlap = (
    token: FuriganaToken,
    overlapStart: number,
    overlapEnd: number,
): string => {
    const tokenLen = token.endChar - token.startChar;
    if (tokenLen <= 0 || overlapEnd <= overlapStart) {
        return '';
    }

    const relStart = Math.max(0, overlapStart - token.startChar);
    const relEnd = Math.min(tokenLen, overlapEnd - token.startChar);
    if (relEnd <= relStart) {
        return '';
    }

    if (relStart === 0 && relEnd === tokenLen) {
        return token.furigana;
    }

    const charSegments = buildPerCharFuriganaSegments(token.text, token.furigana);
    return charSegments.slice(relStart, relEnd).join('');
};

export const alignRomajiTokensToWordCues = (
    cueValue: string,
    words: SyncedWordCue[],
    tokens: RomajiToken[],
): null | SyncedWordCue[] => {
    const joined = words.map((word) => word.text).join('');
    if (joined.length !== cueValue.length) {
        return null;
    }

    let charOffset = 0;
    const wordRanges: { end: number; start: number }[] = [];
    const aligned: SyncedWordCue[] = [];

    for (const word of words) {
        const wordStart = charOffset;
        const wordEnd = charOffset + word.text.length;
        charOffset = wordEnd;
        wordRanges.push({ end: wordEnd, start: wordStart });

        const overlapping = tokens.filter((token) =>
            rangesOverlap(wordStart, wordEnd, token.startChar, token.endChar),
        );

        const romajiParts = overlapping
            .map((token) => {
                const overlapStart = Math.max(wordStart, token.startChar);
                const overlapEnd = Math.min(wordEnd, token.endChar);
                return sliceRomajiForOverlap(token, overlapStart, overlapEnd);
            })
            .filter((part) => part.length > 0);

        const romajiText = romajiParts.join(' ');

        aligned.push({
            ...word,
            text: romajiText,
        });
    }

    for (let tokenIndex = 0; tokenIndex < tokens.length - 1; tokenIndex += 1) {
        const token = tokens[tokenIndex];
        const nextToken = tokens[tokenIndex + 1];

        if (isWhitespaceToken(nextToken)) {
            continue;
        }

        const wordIndex = findWordCueEndingToken(token, wordRanges);
        if (wordIndex < 0) {
            continue;
        }

        const currentText = aligned[wordIndex].text;
        if (!currentText || currentText.endsWith(' ')) {
            continue;
        }

        aligned[wordIndex] = {
            ...aligned[wordIndex],
            text: `${currentText} `,
        };
    }

    return aligned;
};

export const alignFuriganaToWordCues = async (
    cueValue: string,
    words: SyncedWordCue[],
    tokens: LyricTextToken[],
    convertFuriganaFragment: (text: string) => Promise<string>,
): Promise<null | SyncedWordCue[]> => {
    const joined = words.map((word) => word.text).join('');
    if (joined.length !== cueValue.length) {
        return null;
    }

    const furiganaTokens: FuriganaToken[] = await Promise.all(
        tokens.map(async (token) => ({
            ...token,
            furigana: await convertFuriganaFragment(token.text),
        })),
    );

    let charOffset = 0;
    const aligned: SyncedWordCue[] = [];

    for (const word of words) {
        const wordStart = charOffset;
        const wordEnd = charOffset + word.text.length;
        charOffset = wordEnd;

        const parts: string[] = [];

        for (const token of furiganaTokens) {
            if (!rangesOverlap(wordStart, wordEnd, token.startChar, token.endChar)) {
                continue;
            }

            const overlapStart = Math.max(wordStart, token.startChar);
            const overlapEnd = Math.min(wordEnd, token.endChar);
            const furiganaPart = sliceFuriganaForOverlap(token, overlapStart, overlapEnd);

            if (!furiganaPart) {
                continue;
            }

            parts.push(furiganaPart);
        }

        aligned.push({
            ...word,
            text: parts.join('') || word.text,
        });
    }

    return aligned;
};
