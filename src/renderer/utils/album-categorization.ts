import { Album } from '/@/shared/types/domain-types';

/**
 * Album categorization based on track count and duration
 * Used for organizing artist discographies into Singles, EPs, and LPs
 */

export enum AlbumCategory {
    /** Single releases (1-3 tracks) */
    SINGLE = 'single',
    /** Extended Play (4-7 tracks, or <30 minutes) */
    EP = 'ep',
    /** Long Play / Full Album (8+ tracks, or 30+ minutes) */
    LP = 'lp',
}

/**
 * Thresholds for album categorization
 * These follow industry-standard definitions:
 * - Single: 1-3 tracks
 * - EP: 4-7 tracks and under 30 minutes
 * - LP: 8+ tracks or 30+ minutes
 */
const CATEGORIZATION_THRESHOLDS = {
    MAX_SINGLE_TRACKS: 3,
    MAX_EP_TRACKS: 7,
    MIN_LP_DURATION_SECONDS: 30 * 60, // 30 minutes
} as const;

/**
 * Categorizes an album as Single, EP, or LP based on track count and duration
 *
 * @param album - The album to categorize
 * @returns The album category (SINGLE, EP, or LP)
 *
 * @example
 * ```ts
 * const album = { songCount: 2, duration: 420 };
 * const category = categorizeAlbum(album); // AlbumCategory.SINGLE
 * ```
 */
export function categorizeAlbum(album: Album): AlbumCategory {
    const trackCount = album.songCount ?? 0;
    const durationSeconds = album.duration ?? 0;

    // Singles: 1-3 tracks
    if (trackCount > 0 && trackCount <= CATEGORIZATION_THRESHOLDS.MAX_SINGLE_TRACKS) {
        return AlbumCategory.SINGLE;
    }

    // EPs: 4-7 tracks and under 30 minutes
    if (
        trackCount <= CATEGORIZATION_THRESHOLDS.MAX_EP_TRACKS &&
        durationSeconds < CATEGORIZATION_THRESHOLDS.MIN_LP_DURATION_SECONDS
    ) {
        return AlbumCategory.EP;
    }

    // LPs: Everything else (8+ tracks or 30+ minutes)
    return AlbumCategory.LP;
}

/**
 * Filters albums by category
 *
 * @param albums - Array of albums to filter
 * @param category - Category to filter by
 * @returns Filtered array of albums matching the category
 *
 * @example
 * ```ts
 * const singles = filterAlbumsByCategory(allAlbums, AlbumCategory.SINGLE);
 * ```
 */
export function filterAlbumsByCategory(
    albums: Album[] | undefined,
    category: AlbumCategory,
): Album[] {
    if (!albums) return [];
    return albums.filter((album) => categorizeAlbum(album) === category);
}

/**
 * Checks if an album is a single (1-3 tracks)
 *
 * @param album - The album to check
 * @returns True if the album is a single
 */
export function isSingle(album: Album): boolean {
    return categorizeAlbum(album) === AlbumCategory.SINGLE;
}

/**
 * Checks if an album is an EP or LP (4+ tracks)
 *
 * @param album - The album to check
 * @returns True if the album is an EP or LP
 */
export function isAlbum(album: Album): boolean {
    const category = categorizeAlbum(album);
    return category === AlbumCategory.EP || category === AlbumCategory.LP;
}

/**
 * Filters albums into singles (1-3 tracks)
 *
 * @param albums - Array of albums to filter
 * @returns Array of singles only
 */
export function filterSingles(albums: Album[] | undefined): Album[] {
    return filterAlbumsByCategory(albums, AlbumCategory.SINGLE);
}

/**
 * Filters albums into EPs and LPs (4+ tracks)
 *
 * @param albums - Array of albums to filter
 * @returns Array of EPs and LPs
 */
export function filterAlbums(albums: Album[] | undefined): Album[] {
    if (!albums) return [];
    return albums.filter(isAlbum);
}

