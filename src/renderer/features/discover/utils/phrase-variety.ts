import { hashName } from '/@/renderer/features/discover/utils/hash-name';

/**
 * One of several phrasings for the same fact, chosen once and for good.
 *
 * Several rows say the same thing about every card from a given source: a similar-artist card
 * says it is similar, a peer's pick says a peer plays it. Printing one fixed sentence on every
 * such card reads as a wall of identical text the moment two of them land side by side, which
 * they routinely do since a row's cards from one source are not spread apart.
 *
 * The choice has to be deterministic rather than `Math.random()` or `Date.now()`, because the
 * alternative is a card that reads differently on the next render, the next visit, or between
 * two people looking at the same screen at once. Hashing the card's own id gives a variant that
 * is fixed for that card for as long as the id is, and needs nothing stored to stay fixed.
 */
export function pickVariant(seed: string, pool: readonly string[]): string {
    return pool[hashName(seed) % pool.length];
}
