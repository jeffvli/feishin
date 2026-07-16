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

/**
 * Returns a cryptographically secure random float in [0, 1),
 * matching the contract of Math.random().
 */
function cryptoRandom(): number {
    crypto.getRandomValues(randomBuffer);
    return randomBuffer[0] / 0x100000000;
}
