import Kuroshiro from 'kuroshiro';
import KuromojiAnalyzer from 'kuroshiro-analyzer-kuromoji';

// doc: https://kuroshiro.org

let kuroshiroInstance: any = null;
let initPromise: null | Promise<void> = null;

const getKuroshiro = async () => {
    if (initPromise) {
        await initPromise;
        return kuroshiroInstance;
    }

    if (kuroshiroInstance) return kuroshiroInstance;

    const KuroshiroClass = (Kuroshiro as any).default || Kuroshiro;
    kuroshiroInstance = new KuroshiroClass();
    initPromise = kuroshiroInstance.init(new KuromojiAnalyzer());
    await initPromise;

    initPromise = null;
    return kuroshiroInstance;
};

export const convertFurigana = async (text: string): Promise<string> => {
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

export const convertRomaji = async (text: string): Promise<string> => {
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
