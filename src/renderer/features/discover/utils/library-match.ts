/**
 * String matching between what ListenBrainz calls a record and what a music server calls it.
 *
 * Deliberately dependency-free. These are the rules that decide whether a suggestion is hidden
 * as already-owned, they are easy to get subtly wrong, and keeping them out of the hook that
 * fetches the library means they can be exercised on their own.
 */

/**
 * The forms an artist credit might be stored under.
 *
 * A credit can name several people where the library names one, so "J Balvin, Ryan Castro" has
 * to also be tried as "J Balvin". Splitting is one level deep on purpose: matching on any
 * contributor would let a compilation hide an unrelated track.
 */
export function artistVariants(artistName: string): string[] {
    const full = normalizeName(artistName);
    const lead = normalizeName(artistName.split(/,| & | feat\.? | with /i)[0] ?? '');

    return lead && lead !== full ? [full, lead] : [full];
}

/**
 * Case, punctuation, bracketed suffixes and a leading article all vary between what a server
 * stores and what MusicBrainz calls the same record. "Self Esteem (2008 Remaster)" has to match
 * "Self Esteem", and ListenBrainz's "Offspring" has to match a library's "The Offspring".
 */
export function normalizeName(value: string): string {
    return value
        .toLowerCase()
        .replace(/\(.*?\)|\[.*?\]/g, '')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim()
        .replace(/^the\s+/, '');
}
