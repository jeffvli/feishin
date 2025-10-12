import { Album } from '/@/shared/types/domain-types';

/**
 * Album categorization based on track count and duration
 * Used for organizing artist discographies into Singles, EPs, and LPs
 */

export enum AlbumCategory {
    /** Extended Play (4-7 tracks, or <30 minutes) */
    EP = 'ep',
    /** Long Play / Full Album (8+ tracks, or 30+ minutes) */
    LP = 'lp',
    /** Single releases (1-3 tracks) */
    SINGLE = 'single',
}

/**
 * Thresholds for album categorization
 * These follow industry-standard definitions with enhanced logic:
 * - Single: 1-3 unique songs (ignoring instrumentals/remixes)
 * - EP: 4-7 unique songs AND under 30 minutes (unique songs take precedence over duration)
 * - LP: 8+ unique songs OR 30+ minutes
 */
const CATEGORIZATION_THRESHOLDS = {
    MAX_EP_UNIQUE_SONGS: 7,
    MAX_SINGLE_UNIQUE_SONGS: 3,
    MIN_LP_DURATION_SECONDS: 30 * 60, // 30 minutes
} as const;

/**
 * Keywords that indicate instrumental or remix versions
 * Used to identify tracks that shouldn't count as unique songs
 */
const INSTRUMENTAL_REMIX_KEYWORDS = [
    'instrumental',
    'inst',
    'remix',
    'mix',
    'version',
    'radio edit',
    'edit',
    'extended',
    'acapella',
    'dub',
    'club mix',
    'demo',
    'outtake',
    'alternate',
    'live',
    'acoustic',
] as const;

/**
 * Categorizes an album as Single, EP, or LP based on unique song count and duration
 * Enhanced logic that treats releases with instrumentals/remixes as singles
 *
 * @param album - The album to categorize
 * @returns The album category (SINGLE, EP, or LP)
 *
 * @example
 * ```ts
 * const album = { songs: [
 *   { name: "Song Name" },
 *   { name: "Song Name (Instrumental)" }
 * ] };
 * const category = categorizeAlbum(album); // AlbumCategory.SINGLE
 * ```
 */
export function categorizeAlbum(album: Album): AlbumCategory {
    const uniqueSongCount = countUniqueSongs(album);
    const durationSeconds = album.duration ?? 0;

    // Singles: 1-3 unique songs
    if (
        uniqueSongCount > 0 &&
        uniqueSongCount <= CATEGORIZATION_THRESHOLDS.MAX_SINGLE_UNIQUE_SONGS
    ) {
        return AlbumCategory.SINGLE;
    }

    // EPs: 4-7 unique songs AND under 30 minutes
    // Note: Unique song count takes precedence over duration
    if (
        uniqueSongCount <= CATEGORIZATION_THRESHOLDS.MAX_EP_UNIQUE_SONGS &&
        durationSeconds < CATEGORIZATION_THRESHOLDS.MIN_LP_DURATION_SECONDS
    ) {
        return AlbumCategory.EP;
    }

    // LPs: Everything else (8+ unique songs OR 30+ minutes)
    return AlbumCategory.LP;
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
 * Filters albums into singles (1-3 tracks)
 *
 * @param albums - Array of albums to filter
 * @returns Array of singles only
 */
export function filterSingles(albums: Album[] | undefined): Album[] {
    return filterAlbumsByCategory(albums, AlbumCategory.SINGLE);
}

/**
 * Gets the count of unique songs for an album (excluding instrumentals/remixes)
 * Useful for debugging and display purposes
 *
 * @param album - The album to analyze
 * @returns Number of unique songs
 *
 * @example
 * ```ts
 * const uniqueCount = getUniqueSongCount(album);
 * console.log(`Album has ${uniqueCount} unique songs`);
 * ```
 */
export function getUniqueSongCount(album: Album): number {
    return countUniqueSongs(album);
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
 * Checks if an album is a single (1-3 tracks)
 *
 * @param album - The album to check
 * @returns True if the album is a single
 */
export function isSingle(album: Album): boolean {
    return categorizeAlbum(album) === AlbumCategory.SINGLE;
}

/**
 * Checks if a track title indicates it's an instrumental or remix version
 *
 * @param title - The track title to check
 * @returns True if the track appears to be an instrumental or remix
 *
 * @example
 * ```ts
 * isInstrumentalOrRemix("Song Name (Instrumental)"); // true
 * isInstrumentalOrRemix("Song Name (Remix)"); // true
 * isInstrumentalOrRemix("Original Song"); // false
 * ```
 */
/**
 * Counts unique songs in an album, excluding instrumentals and remixes
 * Enhanced to work with album metadata even when songs array is not available
 *
 * @param album - The album to analyze
 * @returns Number of unique songs (excluding instrumentals/remixes)
 *
 * @example
 * ```ts
 * const album = { songs: [
 *   { name: "Original Song" },
 *   { name: "Original Song (Instrumental)" },
 *   { name: "Another Song" }
 * ] };
 * const uniqueCount = countUniqueSongs(album); // 2
 * ```
 */
function countUniqueSongs(album: Album): number {
    if (!album.songs || album.songs.length === 0) {
        // Enhanced fallback: Try to infer from album name and songCount
        return estimateUniqueSongsFromMetadata(album);
    }

    // Extract base song names (remove parenthetical content for comparison)
    const baseSongNames = new Set<string>();

    for (const song of album.songs) {
        if (!song.name) continue;

        // Skip instrumentals and remixes
        if (isInstrumentalOrRemix(song.name)) continue;

        // Extract base song name by removing content in parentheses
        // e.g., "Song Name (feat. Artist)" -> "Song Name"
        const baseName = song.name
            .replace(/\s*\([^)]*\)\s*$/g, '')
            .trim()
            .toLowerCase();

        if (baseName) {
            baseSongNames.add(baseName);
        }
    }

    return baseSongNames.size;
}

/**
 * Estimates unique song count from album metadata when songs array is not available
 * Uses heuristics based on album name patterns and track count
 *
 * @param album - The album to analyze
 * @returns Estimated number of unique songs
 */
function estimateUniqueSongsFromMetadata(album: Album): number {
    const songCount = album.songCount ?? 0;
    const albumName = album.name?.toLowerCase() ?? '';

    // If album name suggests it's a single (contains "single", "ep", etc.)
    if (albumName.includes('single') || albumName.includes('ep')) {
        // For singles/EPs, assume fewer unique songs
        return Math.min(songCount, 3);
    }

    // Heuristic: If track count is 4 or less, likely a single with variations
    if (songCount <= 4) {
        // Common patterns for singles with multiple versions:
        // 2 tracks: likely 1 unique song + instrumental/remix
        // 3 tracks: likely 1-2 unique songs + variations
        // 4 tracks: likely 1-3 unique songs + variations
        return Math.max(1, Math.floor(songCount / 2));
    }

    // For larger releases, assume more unique content
    // Use a conservative estimate: assume 60-80% are unique songs
    const estimatedUniqueRatio = songCount <= 7 ? 0.7 : 0.8;
    return Math.max(1, Math.floor(songCount * estimatedUniqueRatio));
}

function isInstrumentalOrRemix(title: string): boolean {
    if (!title) return false;

    const lowerTitle = title.toLowerCase();
    return INSTRUMENTAL_REMIX_KEYWORDS.some((keyword) => lowerTitle.includes(keyword));
}
