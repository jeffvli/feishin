export function shuffle<T>(array: T[]): T[] {
    return shuffleInPlace(array.slice());
}

export function shuffleInPlace<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(cryptoRandom() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

const randomBuffer = new Uint32Array(1);

// Smart shuffle: random, but the same artist doesn't play twice in a row when it can be avoided
// (plain shuffling often clumps an artist's songs together)
export function spreadShuffle<T>(items: T[], artistOf: (item: T) => string): T[] {
    const pool = shuffleInPlace([...items]);
    const out: T[] = [];
    while (pool.length) {
        const last = out.length ? artistOf(out[out.length - 1]) : null;
        const before = out.length > 1 ? artistOf(out[out.length - 2]) : null;
        // the first song by someone else (and, if possible, not the one before that either)
        let pick = pool.findIndex((x) => artistOf(x) !== last && artistOf(x) !== before);
        if (pick === -1) pick = pool.findIndex((x) => artistOf(x) !== last);
        out.push(pool.splice(pick === -1 ? 0 : pick, 1)[0]);
    }
    return out;
}

/**
 * Returns a cryptographically secure random float in [0, 1),
 * matching the contract of Math.random().
 */
function cryptoRandom(): number {
    crypto.getRandomValues(randomBuffer);
    return randomBuffer[0] / 0x100000000;
}
