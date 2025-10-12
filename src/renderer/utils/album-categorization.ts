import { Album, Song } from '/@/shared/types/domain-types';

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
 * These follow common industry definitions using unique-song logic:
 * - Single: 1-3 unique songs (instrumentals are ignored; alternate versions consolidated)
 * - EP: 4-7 unique songs AND under 30 minutes (unique songs take precedence over duration)
 * - LP: 8+ unique songs OR 30+ minutes
 */
const CATEGORIZATION_THRESHOLDS = {
    MAX_EP_UNIQUE_SONGS: 7,
    MAX_SINGLE_UNIQUE_SONGS: 3,
    MIN_LP_DURATION_SECONDS: 30 * 60, // 30 minutes
} as const;

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
 * Hybrid categorization that uses song analysis when available
 * Falls back to metadata estimation for performance
 *
 * @param albums - Array of albums to categorize
 * @param songsFromBatchQuery - Optional songs from batch query (grouped by album)
 * @returns Object with categorized albums
 */
export function categorizeAlbumsHybrid(
    albums: Album[] | undefined,
    songsFromBatchQuery?: Record<string, Song[]>,
): {
    albums: Album[];
    analysisMethod: 'metadata-estimation' | 'mixed' | 'song-analysis';
    singles: Album[];
} {
    if (!albums) {
        return { albums: [], analysisMethod: 'metadata-estimation', singles: [] };
    }

    let songAnalysisCount = 0;
    let metadataEstimationCount = 0;

    const categorizedAlbums = albums.map((album) => {
        const albumSongs = songsFromBatchQuery?.[album.id];
        const hasSongAnalysis = !!albumSongs;

        if (hasSongAnalysis) {
            songAnalysisCount++;
        } else {
            metadataEstimationCount++;
        }

        const uniqueSongCount = countUniqueSongs(album, albumSongs);
        const category = categorizeAlbumWithUniqueCount(album, uniqueSongCount);

        return { album, category };
    });

    const albumsCategory = categorizedAlbums
        .filter(({ category }) => category === AlbumCategory.EP || category === AlbumCategory.LP)
        .map(({ album }) => album);

    const singles = categorizedAlbums
        .filter(({ category }) => category === AlbumCategory.SINGLE)
        .map(({ album }) => album);

    // Determine analysis method used
    let analysisMethod: 'metadata-estimation' | 'mixed' | 'song-analysis';
    if (songAnalysisCount === albums.length) {
        analysisMethod = 'song-analysis';
    } else if (metadataEstimationCount === albums.length) {
        analysisMethod = 'metadata-estimation';
    } else {
        analysisMethod = 'mixed';
    }

    return { albums: albumsCategory, analysisMethod, singles };
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

export function isAlbum(album: Album): boolean {
    const category = categorizeAlbum(album);
    return category === AlbumCategory.EP || category === AlbumCategory.LP;
}

export function isSingle(album: Album): boolean {
    return categorizeAlbum(album) === AlbumCategory.SINGLE;
}

/**
 * Categorizes an album with a pre-calculated unique song count
 * Used internally by hybrid categorization for performance optimization
 *
 * @param album - The album to categorize
 * @param uniqueSongCount - Pre-calculated unique song count
 * @returns The album category
 */
function categorizeAlbumWithUniqueCount(album: Album, uniqueSongCount: number): AlbumCategory {
    const durationSeconds = album.duration ?? 0;

    // Singles: 1-3 unique songs
    if (
        uniqueSongCount > 0 &&
        uniqueSongCount <= CATEGORIZATION_THRESHOLDS.MAX_SINGLE_UNIQUE_SONGS
    ) {
        return AlbumCategory.SINGLE;
    }

    // EPs: 4-7 unique songs AND under 30 minutes
    if (
        uniqueSongCount <= CATEGORIZATION_THRESHOLDS.MAX_EP_UNIQUE_SONGS &&
        durationSeconds < CATEGORIZATION_THRESHOLDS.MIN_LP_DURATION_SECONDS
    ) {
        return AlbumCategory.EP;
    }

    // LPs: 8+ unique songs OR 30+ minutes
    return AlbumCategory.LP;
}

/**
 * Counts unique songs in an album, excluding instrumentals and consolidating alternate versions
 * Uses a hybrid approach: song-level analysis when available, otherwise metadata estimation
 *
 * @param album - The album to analyze
 * @param songsFromQuery - Optional songs array from batch query (for performance optimization)
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
function countUniqueSongs(album: Album, songsFromQuery?: Song[]): number {
    // Use songs from batch query if available (performance optimization)
    const songsToAnalyze = songsFromQuery || album.songs;

    if (!songsToAnalyze || songsToAnalyze.length === 0) {
        // Enhanced fallback: Try to infer from album name and songCount
        const estimatedCount = estimateUniqueSongsFromMetadata(album);
        return estimatedCount;
    }

    // Consolidate alternate versions: strip trailing parenthetical (Remix, Edit, Version, etc.)
    // Skip obvious instrumentals (Instrumental/Inst)
    const baseSongNames = new Set<string>();
    const skippedSongs: string[] = [];

    for (const song of songsToAnalyze) {
        if (!song.name) continue;

        // Only skip if it's clearly an instrumental (no vocals)
        const lowerTitle = song.name.toLowerCase();
        const isInstrumental = /\b(inst(ru?mental)?)\b/i.test(lowerTitle);

        if (isInstrumental) {
            skippedSongs.push(song.name);
            continue;
        }

        // Extract base song name by removing a trailing parenthetical
        // e.g., "Zero (J.I.D Remix)" -> "Zero"
        const baseName = song.name
            .replace(/\s*\([^)]*\)\s*$/g, '')
            .trim()
            .toLowerCase();

        if (baseName) {
            baseSongNames.add(baseName);
        }
    }

    // Safeguard: if all tracks were skipped as instrumentals on a very small release,
    // treat it as a single unique song to avoid false LP categorization.
    if (baseSongNames.size === 0 && songsToAnalyze.length > 0 && songsToAnalyze.length <= 3) {
        return 1;
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

    // For very small releases (1-3 songs), assume they're singles
    if (songCount <= 3) {
        // Most 1-3 track releases are singles, even with variations
        return Math.max(1, songCount);
    }

    // If album name suggests it's a single/EP (contains "single" or "ep")
    if (albumName.includes('single') || albumName.includes('ep')) {
        // For singles/EPs, assume fewer unique songs
        return Math.min(songCount, 3);
    }

    // Heuristic: If track count is 4-6, likely a single/EP with variations
    if (songCount <= 6) {
        // Common patterns for singles with multiple versions:
        // 4 tracks: likely 1-2 unique songs + variations
        // 5-6 tracks: likely 2-3 unique songs + variations
        return Math.max(1, Math.floor(songCount * 0.5));
    }

    // For larger releases, assume more unique content
    // Use a conservative estimate: assume 60-80% are unique songs
    const estimatedUniqueRatio = songCount <= 10 ? 0.7 : 0.8;
    return Math.max(1, Math.floor(songCount * estimatedUniqueRatio));
}
