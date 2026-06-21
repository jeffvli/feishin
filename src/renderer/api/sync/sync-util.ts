// Small pure helpers for the sync feature, kept dependency-free so they're easy
// to unit-test in isolation.

/** Order-sensitive equality of two track-id lists. */
export const idsEqual = (a: readonly string[], b: readonly string[]): boolean =>
    a.length === b.length && a.every((id, i) => id === b[i]);
