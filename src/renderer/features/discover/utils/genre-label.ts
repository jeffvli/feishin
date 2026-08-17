/**
 * MusicBrainz genre names, cased for display.
 *
 * The vocabulary is stored entirely lower case, so a genre arrives as "uk garage" or "new
 * orleans r&b". Title case rather than sentence case, because a third of the vocabulary names
 * a place, a language or a people, and sentence case leaves those looking like typos: "New
 * orleans r&b", "Us power metal". Title case is also what the rest of the page's labels use.
 *
 * Checked against all 2,184 genres MusicBrainz publishes at `/ws/2/genre/all`.
 */

/**
 * Tokens whose display form is not their title case.
 *
 * Initialisms, which title case would render "Edm" and "R&b", and the regional pop names, whose
 * own convention is a capital letter and then lower case. Everything not listed is title cased,
 * so this only has to hold the exceptions rather than the vocabulary.
 */
const TOKEN_FORMS: Record<string, string> = {
    aor: 'AOR',
    asmr: 'ASMR',
    bh: 'BH',
    c86: 'C86',
    'c-pop': 'C-pop',
    eai: 'EAI',
    ebm: 'EBM',
    edm: 'EDM',
    fm: 'FM',
    'hi-nrg': 'Hi-NRG',
    idm: 'IDM',
    'j-pop': 'J-pop',
    'k-pop': 'K-pop',
    'lo-fi': 'Lo-fi',
    mpb: 'MPB',
    nrg: 'NRG',
    opm: 'OPM',
    'q-pop': 'Q-pop',
    'r&b': 'R&B',
    rkt: 'RKT',
    't-pop': 'T-pop',
    tbm: 'TBM',
    uk: 'UK',
    uk82: 'UK82',
    us: 'US',
    'v-pop': 'V-pop',
    ytpmv: 'YTPMV',
};

/**
 * Words left lower case when they are not the first.
 *
 * Both English particles and the ones carried by the vocabulary's Portuguese, Spanish, German
 * and Italian entries, which are a real share of it: "funk de bh", "musica popular brasileira".
 */
const MINOR_WORDS = new Set([
    "'n'",
    'a',
    'and',
    'de',
    'degli',
    'del',
    'della',
    'des',
    'di',
    'do',
    'dos',
    'du',
    'e',
    'el',
    'en',
    'et',
    'i',
    'in',
    'la',
    'le',
    'los',
    "n'",
    'na',
    'och',
    'of',
    'om',
    'the',
    'und',
    'y',
]);

export function genreLabel(genre: string): string {
    return genre
        .split(' ')
        .map((token, index) => {
            if (TOKEN_FORMS[token]) {
                return TOKEN_FORMS[token];
            }

            if (index > 0 && MINOR_WORDS.has(token)) {
                return token;
            }

            return token.charAt(0).toUpperCase() + token.slice(1);
        })
        .join(' ');
}
