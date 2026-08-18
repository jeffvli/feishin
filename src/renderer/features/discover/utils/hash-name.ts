/**
 * FNV-1a over a whole string.
 *
 * The whole value rather than a prefix, which is the point: two inputs that agree on their
 * first few characters have to land on different results, and seeding from anything a prefix
 * already tells you would guarantee the collision instead of avoiding it.
 *
 * Shared rather than defined per caller. `ListenerChip` uses it to pick an avatar colour from a
 * username; the phrase-variety picker uses the same primitive to pick a wording variant from a
 * card's id. Both are the same problem, deterministic selection from an arbitrary string, and a
 * second hash living a few files away would be one more implementation to keep in step with no
 * reason for the two to ever disagree.
 */
export function hashName(value: string): number {
    let hash = 0x811c9dc5;

    for (let index = 0; index < value.length; index += 1) {
        hash ^= value.charCodeAt(index);
        hash = Math.imul(hash, 0x01000193) >>> 0;
    }

    return hash >>> 0;
}
