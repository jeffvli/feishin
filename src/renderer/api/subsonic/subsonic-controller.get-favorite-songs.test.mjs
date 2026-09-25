/**
 * Regression for jeffvli/feishin#2415 — Subsonic artist Favorite Songs.
 *
 * Without favorite:true, getFavoriteSongs album-scrapes via getArtist+getAlbum and
 * can omit starred tracks that getStarred still returns. Run:
 *   node src/renderer/api/subsonic/subsonic-controller.get-favorite-songs.test.mjs
 */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const controllerSrc = readFileSync(join(__dirname, 'subsonic-controller.ts'), 'utf8');

// --- Source contract: favorites branch must request the getStarred path ---
const favoritesBlock = controllerSrc.split("else if user selects 'favorites'")[1]?.slice(0, 600);
assert.ok(favoritesBlock, 'favorites branch missing');
assert.match(
    favoritesBlock,
    /favorite:\s*true/,
    'getFavoriteSongs favorites branch must pass favorite:true so getSongList uses getStarred',
);
assert.match(favoritesBlock, /artistIds:\s*\[\s*query\.artistId\s*\]/);

// --- Behavioral model of the two getSongList strategies ---
function albumScrapeFavoriteSongs({ artistAlbumsSongs, starredSongIds }) {
    // Old path: only songs present on getArtist albums, then filter userFavorite
    return artistAlbumsSongs.filter((s) => starredSongIds.has(s.id) || s.userFavorite);
}

function getStarredFavoriteSongs({ artistId, starredSongs }) {
    // New path: getStarred universe, filter by albumArtists (mirrors getSongList favorite:true)
    return starredSongs.filter((song) => song.albumArtists?.some((aa) => aa.id === artistId));
}

const artistId = 'artist-1';
const onAlbum = {
    albumArtists: [{ id: artistId }],
    id: 'song-on-album',
    userFavorite: true,
};
const starredMissingFromAlbums = {
    albumArtists: [{ id: artistId }],
    id: 'song-starred-missing',
    userFavorite: true,
};
const otherArtistStar = {
    albumArtists: [{ id: 'artist-2' }],
    id: 'song-other',
    userFavorite: true,
};

const starredSongs = [onAlbum, starredMissingFromAlbums, otherArtistStar];
const artistAlbumsSongs = [onAlbum]; // album scrape never saw song-starred-missing
const starredSongIds = new Set(starredSongs.map((s) => s.id));

const oldResult = albumScrapeFavoriteSongs({
    artistAlbumsSongs: artistAlbumsSongs.map((s) => ({
        ...s,
        userFavorite: starredSongIds.has(s.id),
    })),
    starredSongIds,
});
const newResult = getStarredFavoriteSongs({ artistId, starredSongs });

assert.deepEqual(
    oldResult.map((s) => s.id),
    ['song-on-album'],
    'precondition: album-scrape omits starred track not on artist albums',
);
assert.deepEqual(
    newResult.map((s) => s.id).sort(),
    ['song-on-album', 'song-starred-missing'],
    'getStarred+artist filter must include starred track missing from album scrape',
);
assert.ok(!newResult.some((s) => s.id === 'song-other'));

console.log('ok - subsonic getFavoriteSongs #2415');
