import isElectron from 'is-electron';

import * as browserLyricsApi from '../../../../main/features/core/lyrics/furigana';

const lyricsApi = isElectron() ? window.api.lyrics : browserLyricsApi;

export const {
    convertFurigana,
    convertFuriganaFragment,
    convertRomaji,
    convertRomajiTokens,
    parseLyricsTextTokens,
} = lyricsApi;
