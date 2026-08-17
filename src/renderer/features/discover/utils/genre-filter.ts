import { LbRecordingMetadataEntry } from '/@/renderer/features/discover/api/listenbrainz-types';

/**
 * Records that are never a recommendation, whoever played them.
 *
 * This is a category exclusion rather than a taste one, and the distinction is what keeps the
 * list short. Peer listening is the only source here that is not derived from the user's own
 * history, which is exactly why it is worth having, but a peer's account is not always one
 * listener: a parent's month of plays contains their child's, and the child's is not a signal
 * about anyone's taste. Observed on a real account, where the top card was a Brazilian nursery
 * rhyme that a peer had played eight times.
 *
 * Deliberately not a genre-preference feature. Nothing here is filtered for being disliked;
 * these are records that are functional for someone else rather than recommendations at all.
 */
const EXCLUDED_GENRES = new Set(["children's music", "children's song", 'nursery rhyme']);

/**
 * Whether a record falls in an excluded category.
 *
 * Only curated genres count, never free-text tags. A genre carries a `genre_mbid` and comes
 * from a controlled vocabulary; a tag is whatever an editor typed, and matching on those would
 * make this a keyword search over user-generated text with all the false positives that
 * implies. Measured over 540 peer recordings, 535 carried at least one curated genre and the
 * rule matched exactly the two nursery rhymes.
 */
export function hasExcludedGenre(entry: LbRecordingMetadataEntry | undefined): boolean {
    if (!entry?.tag) {
        return false;
    }

    for (const scope of [entry.tag.artist, entry.tag.recording, entry.tag.release_group]) {
        for (const tag of scope ?? []) {
            if (tag.genre_mbid && EXCLUDED_GENRES.has(tag.tag.toLowerCase())) {
                return true;
            }
        }
    }

    return false;
}
