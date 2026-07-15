import Kuroshiro from 'kuroshiro';
import KuromojiAnalyzer from 'kuroshiro-analyzer-kuromoji';
import { hasJapanese, kanaToRomaji, patchTokens } from 'kuroshiro/lib/util';

// doc: https://kuroshiro.org

export type LyricTextToken = {
    endChar: number;
    startChar: number;
    text: string;
};

export type RomajiToken = LyricTextToken & {
    romaji: string;
};

let kuroshiroInstance: any = null;
let initPromise: null | Promise<void> = null;

const getDictionaryPath = (): string | undefined => {
    if (typeof document === 'undefined') {
        return undefined;
    }

    return new URL('./assets/kuromoji/', document.baseURI).href;
};

const getKuroshiro = async () => {
    if (initPromise) {
        await initPromise;
        return kuroshiroInstance;
    }

    if (kuroshiroInstance) return kuroshiroInstance;

    const KuroshiroClass = (Kuroshiro as any).default || Kuroshiro;
    const dictionaryPath = getDictionaryPath();
    const analyzer = dictionaryPath
        ? new KuromojiAnalyzer({ dictPath: dictionaryPath })
        : new KuromojiAnalyzer();

    kuroshiroInstance = new KuroshiroClass();
    initPromise = kuroshiroInstance.init(analyzer);
    await initPromise;

    initPromise = null;
    return kuroshiroInstance;
};

export const convertFurigana = async (text: string): Promise<string> => {
    if (typeof text !== 'string' || !text) {
        return text;
    }

    const KuroshiroClass = (Kuroshiro as any).default || Kuroshiro;

    // check if the text contains any Japanese kana (to distinguish Japanese from Chinese text, which shares Kanji)
    // If no Japanese kana is detected, skip processing
    if (!KuroshiroClass.Util.hasKana(text)) return text;

    try {
        const kuroshiro = await getKuroshiro();
        return await kuroshiro.convert(text, { mode: 'furigana', to: 'hiragana' });
    } catch (e) {
        console.error('Furigana conversion error: ', e);
        return text;
    }
};

export const convertFuriganaFragment = async (text: string): Promise<string> => {
    if (typeof text !== 'string' || !text) {
        return text;
    }

    if (!hasJapanese(text)) {
        return text;
    }

    try {
        const kuroshiro = await getKuroshiro();
        return await kuroshiro.convert(text, { mode: 'furigana', to: 'hiragana' });
    } catch (e) {
        console.error('Furigana fragment conversion error: ', e);
        return text;
    }
};

export const convertRomaji = async (text: string): Promise<string> => {
    if (typeof text !== 'string' || !text) {
        return text;
    }

    const KuroshiroClass = (Kuroshiro as any).default || Kuroshiro;

    if (!KuroshiroClass.Util.hasKana(text)) return '';

    try {
        const kuroshiro = await getKuroshiro();
        return await kuroshiro.convert(text, { mode: 'spaced', to: 'romaji' });
    } catch (e) {
        console.error('Romaji conversion error: ', e);
        return '';
    }
};

export const parseLyricsTextTokens = async (text: string): Promise<LyricTextToken[]> => {
    if (typeof text !== 'string' || !text || !hasJapanese(text)) {
        return [];
    }

    try {
        const kuroshiro = await getKuroshiro();
        const rawTokens = await kuroshiro._analyzer.parse(text);
        const tokens = patchTokens(rawTokens);

        let cursor = 0;

        return tokens.map((token: { surface_form: string }) => {
            const surface = token.surface_form;
            const startChar = cursor;
            cursor += surface.length;

            return {
                endChar: cursor,
                startChar,
                text: surface,
            };
        });
    } catch (e) {
        console.error('Lyrics token parse error: ', e);
        return [];
    }
};

export const convertRomajiTokens = async (text: string): Promise<RomajiToken[]> => {
    if (typeof text !== 'string' || !text) {
        return [];
    }

    const KuroshiroClass = (Kuroshiro as any).default || Kuroshiro;

    if (!KuroshiroClass.Util.hasKana(text)) {
        return [];
    }

    try {
        const kuroshiro = await getKuroshiro();
        const rawTokens = await kuroshiro._analyzer.parse(text);
        const tokens = patchTokens(rawTokens);

        let cursor = 0;

        return tokens.map(
            (token: { pronunciation?: string; reading: string; surface_form: string }) => {
                const surface = token.surface_form;
                const startChar = cursor;
                cursor += surface.length;

                const romaji = hasJapanese(surface)
                    ? kanaToRomaji(token.pronunciation || token.reading)
                    : surface;

                return {
                    endChar: cursor,
                    romaji,
                    startChar,
                    text: surface,
                };
            },
        );
    } catch (e) {
        console.error('Romaji token conversion error: ', e);
        return [];
    }
};
