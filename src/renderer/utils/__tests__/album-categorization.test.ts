import { Album, LibraryItem, ServerType } from '/@/shared/types/domain-types';
import {
    AlbumCategory,
    categorizeAlbum,
    filterAlbums,
    filterAlbumsByCategory,
    filterSingles,
    getUniqueSongCount,
    isAlbum,
    isSingle,
} from '../album-categorization';

// Helper to create mock albums
const createMockAlbum = (songCount: number, duration: number, songs?: Array<{ name: string }>): Album => ({
    albumArtist: 'Test Artist',
    albumArtists: [],
    artists: [],
    backdropImageUrl: null,
    comment: null,
    createdAt: '2024-01-01',
    duration,
    genres: [],
    id: `album-${songCount}-${duration}`,
    imagePlaceholderUrl: null,
    imageUrl: null,
    isCompilation: false,
    itemType: LibraryItem.ALBUM,
    lastPlayedAt: null,
    mbzId: null,
    name: `Test Album`,
    originalDate: null,
    participants: null,
    playCount: null,
    releaseDate: '2024-01-01',
    releaseYear: 2024,
    serverId: 'test-server',
    serverType: ServerType.JELLYFIN,
    size: null,
    songCount,
    songs: songs as any, // Cast to match Song type structure
    tags: null,
    uniqueId: `unique-${songCount}-${duration}`,
    updatedAt: '2024-01-01',
    userFavorite: false,
    userRating: null,
});

describe('album-categorization', () => {
    describe('categorizeAlbum', () => {
        it('should categorize 1-track release as SINGLE', () => {
            const album = createMockAlbum(1, 180); // 3 minutes
            expect(categorizeAlbum(album)).toBe(AlbumCategory.SINGLE);
        });

        it('should categorize 2-track release as SINGLE', () => {
            const album = createMockAlbum(2, 360); // 6 minutes
            expect(categorizeAlbum(album)).toBe(AlbumCategory.SINGLE);
        });

        it('should categorize 3-track release as SINGLE', () => {
            const album = createMockAlbum(3, 540); // 9 minutes
            expect(categorizeAlbum(album)).toBe(AlbumCategory.SINGLE);
        });

        it('should categorize 4-track short release as EP', () => {
            const album = createMockAlbum(4, 600); // 10 minutes
            expect(categorizeAlbum(album)).toBe(AlbumCategory.EP);
        });

        it('should categorize 7-track short release as EP', () => {
            const album = createMockAlbum(7, 1500); // 25 minutes
            expect(categorizeAlbum(album)).toBe(AlbumCategory.EP);
        });

        it('should categorize 8-track release as LP', () => {
            const album = createMockAlbum(8, 2400); // 40 minutes
            expect(categorizeAlbum(album)).toBe(AlbumCategory.LP);
        });

        it('should categorize long 5-track release (30+ min) as LP', () => {
            const album = createMockAlbum(5, 1900); // 31.67 minutes
            expect(categorizeAlbum(album)).toBe(AlbumCategory.LP);
        });

        it('should categorize 15-track release as LP', () => {
            const album = createMockAlbum(15, 3600); // 60 minutes
            expect(categorizeAlbum(album)).toBe(AlbumCategory.LP);
        });

        it('should handle albums with missing songCount', () => {
            const album = createMockAlbum(0, 1800);
            album.songCount = null;
            expect(categorizeAlbum(album)).toBe(AlbumCategory.LP);
        });

        it('should handle albums with missing duration', () => {
            const album = createMockAlbum(5, 0);
            album.duration = null;
            expect(categorizeAlbum(album)).toBe(AlbumCategory.EP);
        });
    });

    describe('isSingle', () => {
        it('should return true for single-track release', () => {
            const album = createMockAlbum(1, 180);
            expect(isSingle(album)).toBe(true);
        });

        it('should return false for 8-track album', () => {
            const album = createMockAlbum(8, 2400);
            expect(isSingle(album)).toBe(false);
        });
    });

    describe('isAlbum', () => {
        it('should return true for EP', () => {
            const album = createMockAlbum(5, 900);
            expect(isAlbum(album)).toBe(true);
        });

        it('should return true for LP', () => {
            const album = createMockAlbum(12, 3000);
            expect(isAlbum(album)).toBe(true);
        });

        it('should return false for single', () => {
            const album = createMockAlbum(2, 300);
            expect(isAlbum(album)).toBe(false);
        });
    });

    describe('filterSingles', () => {
        it('should filter only singles from mixed album list', () => {
            const albums = [
                createMockAlbum(1, 180), // Single
                createMockAlbum(8, 2400), // LP
                createMockAlbum(3, 450), // Single
                createMockAlbum(5, 900), // EP
            ];

            const singles = filterSingles(albums);
            expect(singles).toHaveLength(2);
            expect(singles[0].songCount).toBe(1);
            expect(singles[1].songCount).toBe(3);
        });

        it('should return empty array for undefined input', () => {
            const singles = filterSingles(undefined);
            expect(singles).toEqual([]);
        });

        it('should return empty array when no singles present', () => {
            const albums = [
                createMockAlbum(8, 2400), // LP
                createMockAlbum(5, 900), // EP
            ];

            const singles = filterSingles(albums);
            expect(singles).toEqual([]);
        });
    });

    describe('filterAlbums', () => {
        it('should filter EPs and LPs, excluding singles', () => {
            const albums = [
                createMockAlbum(1, 180), // Single
                createMockAlbum(8, 2400), // LP
                createMockAlbum(3, 450), // Single
                createMockAlbum(5, 900), // EP
                createMockAlbum(12, 3600), // LP
            ];

            const filtered = filterAlbums(albums);
            expect(filtered).toHaveLength(3);
            expect(filtered[0].songCount).toBe(8);
            expect(filtered[1].songCount).toBe(5);
            expect(filtered[2].songCount).toBe(12);
        });

        it('should return empty array for undefined input', () => {
            const filtered = filterAlbums(undefined);
            expect(filtered).toEqual([]);
        });
    });

    describe('filterAlbumsByCategory', () => {
        it('should filter albums by SINGLE category', () => {
            const albums = [
                createMockAlbum(1, 180),
                createMockAlbum(8, 2400),
                createMockAlbum(2, 300),
            ];

            const singles = filterAlbumsByCategory(albums, AlbumCategory.SINGLE);
            expect(singles).toHaveLength(2);
        });

        it('should filter albums by EP category', () => {
            const albums = [
                createMockAlbum(1, 180), // Single
                createMockAlbum(5, 900), // EP
                createMockAlbum(12, 3600), // LP
            ];

            const eps = filterAlbumsByCategory(albums, AlbumCategory.EP);
            expect(eps).toHaveLength(1);
            expect(eps[0].songCount).toBe(5);
        });

        it('should filter albums by LP category', () => {
            const albums = [
                createMockAlbum(1, 180), // Single
                createMockAlbum(5, 900), // EP
                createMockAlbum(12, 3600), // LP
                createMockAlbum(10, 2800), // LP
            ];

            const lps = filterAlbumsByCategory(albums, AlbumCategory.LP);
            expect(lps).toHaveLength(2);
        });

        it('should return empty array for undefined input', () => {
            const result = filterAlbumsByCategory(undefined, AlbumCategory.SINGLE);
            expect(result).toEqual([]);
        });
    });

    describe('Enhanced categorization with instrumentals/remixes', () => {
        it('should count song + instrumental as 1 unique song (SINGLE)', () => {
            const album = createMockAlbum(2, 360, [
                { name: 'Original Song' },
                { name: 'Original Song (Instrumental)' }
            ]);
            expect(categorizeAlbum(album)).toBe(AlbumCategory.SINGLE);
            expect(getUniqueSongCount(album)).toBe(1);
        });

        it('should count song + remix as 1 unique song (SINGLE)', () => {
            const album = createMockAlbum(2, 360, [
                { name: 'Original Song' },
                { name: 'Original Song (Remix)' }
            ]);
            expect(categorizeAlbum(album)).toBe(AlbumCategory.SINGLE);
            expect(getUniqueSongCount(album)).toBe(1);
        });

        it('should categorize Pokémon soundtrack correctly as SINGLE', () => {
            const album = createMockAlbum(4, 711, [ // 11:51 duration
                { name: 'We Go' },
                { name: 'By Your Side' },
                { name: 'We Go (Instrumental)' },
                { name: 'By Your Side (Instrumental)' }
            ]);
            expect(categorizeAlbum(album)).toBe(AlbumCategory.SINGLE);
            expect(getUniqueSongCount(album)).toBe(2);
        });

        it('should handle multiple instrumentals of same song', () => {
            const album = createMockAlbum(3, 540, [
                { name: 'Main Song' },
                { name: 'Main Song (Instrumental)' },
                { name: 'Main Song (Inst)' }
            ]);
            expect(categorizeAlbum(album)).toBe(AlbumCategory.SINGLE);
            expect(getUniqueSongCount(album)).toBe(1);
        });

        it('should handle song with featured artist as single song', () => {
            const album = createMockAlbum(2, 360, [
                { name: 'Song Name (feat. Artist)' },
                { name: 'Song Name (Instrumental)' }
            ]);
            expect(categorizeAlbum(album)).toBe(AlbumCategory.SINGLE);
            expect(getUniqueSongCount(album)).toBe(1);
        });

        it('should count 3 unique songs + instrumentals as SINGLE', () => {
            const album = createMockAlbum(6, 900, [
                { name: 'Song One' },
                { name: 'Song One (Instrumental)' },
                { name: 'Song Two' },
                { name: 'Song Two (Remix)' },
                { name: 'Song Three' },
                { name: 'Song Three (Inst)' }
            ]);
            expect(categorizeAlbum(album)).toBe(AlbumCategory.SINGLE);
            expect(getUniqueSongCount(album)).toBe(3);
        });

        it('should count 4 unique songs as EP even with long duration', () => {
            const album = createMockAlbum(6, 1200, [ // 20 minutes
                { name: 'Song One' },
                { name: 'Song One (Instrumental)' },
                { name: 'Song Two' },
                { name: 'Song Two (Remix)' },
                { name: 'Song Three' },
                { name: 'Song Four' }
            ]);
            expect(categorizeAlbum(album)).toBe(AlbumCategory.EP);
            expect(getUniqueSongCount(album)).toBe(4);
        });

        it('should prioritize unique song count over duration for EP classification', () => {
            const album = createMockAlbum(4, 2400, [ // 40 minutes, but only 2 unique songs
                { name: 'Song One' },
                { name: 'Song One (Instrumental)' },
                { name: 'Song Two' },
                { name: 'Song Two (Remix)' }
            ]);
            // Should be SINGLE because only 2 unique songs, despite 40-minute duration
            expect(categorizeAlbum(album)).toBe(AlbumCategory.SINGLE);
            expect(getUniqueSongCount(album)).toBe(2);
        });

        it('should handle various instrumental/remix keywords', () => {
            const keywords = ['instrumental', 'inst', 'remix', 'mix', 'version', 'edit', 'extended'];
            keywords.forEach(keyword => {
                const album = createMockAlbum(2, 360, [
                    { name: 'Original Song' },
                    { name: `Original Song (${keyword})` }
                ]);
                expect(getUniqueSongCount(album)).toBe(1);
            });
        });

        it('should handle case-insensitive keyword matching', () => {
            const album = createMockAlbum(2, 360, [
                { name: 'Original Song' },
                { name: 'Original Song (INSTRUMENTAL)' }
            ]);
            expect(getUniqueSongCount(album)).toBe(1);
        });

        it('should handle aespa Dirty Work scenario without songs array', () => {
            const album = createMockAlbum(4, 720); // 4 tracks, 12 minutes
            album.songs = undefined;
            album.name = 'Dirty Work';
            // Should estimate 2 unique songs (4 tracks / 2), which makes it a Single
            expect(categorizeAlbum(album)).toBe(AlbumCategory.SINGLE);
        });

        it('should handle Pokemon scenario without songs array', () => {
            const album = createMockAlbum(4, 711); // 4 tracks, ~12 minutes
            album.songs = undefined;
            album.name = 'Pokémon Horizons: The Series';
            // Should estimate 2 unique songs (4 tracks / 2), which makes it a Single
            expect(categorizeAlbum(album)).toBe(AlbumCategory.SINGLE);
        });
    });

    describe('getUniqueSongCount', () => {
        it('should return correct count for album with songs array', () => {
            const album = createMockAlbum(4, 720, [
                { name: 'Song One' },
                { name: 'Song One (Instrumental)' },
                { name: 'Song Two' },
                { name: 'Song Three' }
            ]);
            expect(getUniqueSongCount(album)).toBe(3);
        });

        it('should estimate unique songs when songs array is not available', () => {
            const album = createMockAlbum(4, 720);
            album.songs = undefined;
            album.name = 'Test Album';
            // For 4 tracks without songs array, should estimate 2 unique songs
            expect(getUniqueSongCount(album)).toBe(2);
        });

        it('should handle album with "single" in name', () => {
            const album = createMockAlbum(4, 720);
            album.songs = undefined;
            album.name = 'My Song - Single';
            // Should cap at 3 for singles
            expect(getUniqueSongCount(album)).toBe(3);
        });

        it('should handle album with "EP" in name', () => {
            const album = createMockAlbum(6, 900);
            album.songs = undefined;
            album.name = 'My EP';
            // Should cap at 3 for EPs
            expect(getUniqueSongCount(album)).toBe(3);
        });

        it('should handle 2-track releases as single unique song', () => {
            const album = createMockAlbum(2, 360);
            album.songs = undefined;
            album.name = 'Song Name';
            expect(getUniqueSongCount(album)).toBe(1);
        });

        it('should handle 3-track releases as 1-2 unique songs', () => {
            const album = createMockAlbum(3, 540);
            album.songs = undefined;
            album.name = 'Song Name';
            expect(getUniqueSongCount(album)).toBe(1);
        });

        it('should handle empty songs array', () => {
            const album = createMockAlbum(3, 540, []);
            expect(getUniqueSongCount(album)).toBe(1); // Uses metadata estimation
        });
    });

    describe('Edge cases', () => {
        it('should handle exactly 30 minutes duration boundary', () => {
            const album = createMockAlbum(5, 1800); // Exactly 30 minutes
            // Should be EP (under 30 minutes means < 1800 seconds)
            expect(categorizeAlbum(album)).toBe(AlbumCategory.LP);
        });

        it('should handle 29:59 duration as EP', () => {
            const album = createMockAlbum(5, 1799); // 29:59
            expect(categorizeAlbum(album)).toBe(AlbumCategory.EP);
        });

        it('should handle 4-track boundary correctly', () => {
            const album4Tracks = createMockAlbum(4, 1200);
            expect(categorizeAlbum(album4Tracks)).toBe(AlbumCategory.EP);
        });

        it('should handle 7-track boundary correctly', () => {
            const album7Tracks = createMockAlbum(7, 1700);
            expect(categorizeAlbum(album7Tracks)).toBe(AlbumCategory.EP);

            const album8Tracks = createMockAlbum(8, 1700);
            expect(categorizeAlbum(album8Tracks)).toBe(AlbumCategory.LP);
        });
    });
});

