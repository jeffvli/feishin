/**
 * KatiesAmp product-level feature restrictions.
 *
 * Keep the underlying integrations available for easier upstream merges, while
 * removing unsupported actions and navigation from the shipped interface.
 */
export const PRODUCT_FEATURES = {
    favoriteChanges: false,
    playlistEditing: false,
    privateMode: false,
    radioStations: false,
    sleepTimer: false,
} as const;
