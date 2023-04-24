import { z } from 'zod';

const baseResponse = z.object({
  'subsonic-response': z.object({
    status: z.string(),
    version: z.string(),
  }),
});

const authenticate = z.null();

const authenticateParameters = z.object({
  c: z.string(),
  f: z.string(),
  p: z.string().optional(),
  s: z.string().optional(),
  t: z.string().optional(),
  u: z.string(),
  v: z.string(),
});

const createFavoriteParameters = z.object({
  albumId: z.array(z.string()).optional(),
  artistId: z.array(z.string()).optional(),
  id: z.array(z.string()).optional(),
});

const createFavorite = z.null();

const removeFavoriteParameters = z.object({
  albumId: z.array(z.string()).optional(),
  artistId: z.array(z.string()).optional(),
  id: z.array(z.string()).optional(),
});

const removeFavorite = z.null();

const setRatingParameters = z.object({
  id: z.string(),
  rating: z.number(),
});

const setRating = z.null();

const musicFolder = z.object({
  id: z.string(),
  name: z.string(),
});

const musicFolderList = z.object({
  musicFolders: z.object({
    musicFolder: z.array(musicFolder),
  }),
});

const song = z.object({
  album: z.string().optional(),
  albumId: z.string().optional(),
  artist: z.string().optional(),
  artistId: z.string().optional(),
  averageRating: z.number().optional(),
  bitRate: z.number().optional(),
  contentType: z.string(),
  coverArt: z.string().optional(),
  created: z.string(),
  discNumber: z.number(),
  duration: z.number().optional(),
  genre: z.string().optional(),
  id: z.string(),
  isDir: z.boolean(),
  isVideo: z.boolean(),
  parent: z.string(),
  path: z.string(),
  playCount: z.number().optional(),
  size: z.number(),
  starred: z.boolean().optional(),
  suffix: z.string(),
  title: z.string(),
  track: z.number().optional(),
  type: z.string(),
  userRating: z.number().optional(),
  year: z.number().optional(),
});

const album = z.object({
  album: z.string(),
  artist: z.string(),
  artistId: z.string(),
  coverArt: z.string(),
  created: z.string(),
  duration: z.number(),
  genre: z.string().optional(),
  id: z.string(),
  isDir: z.boolean(),
  isVideo: z.boolean(),
  name: z.string(),
  parent: z.string(),
  song: z.array(song),
  songCount: z.number(),
  starred: z.boolean().optional(),
  title: z.string(),
  userRating: z.number().optional(),
  year: z.number().optional(),
});

const albumListParameters = z.object({
  fromYear: z.number().optional(),
  genre: z.string().optional(),
  musicFolderId: z.string().optional(),
  offset: z.number().optional(),
  size: z.number().optional(),
  toYear: z.number().optional(),
  type: z.string().optional(),
});

const albumList = z.array(album.omit({ song: true }));

const albumArtist = z.object({
  albumCount: z.string(),
  artistImageUrl: z.string().optional(),
  coverArt: z.string().optional(),
  id: z.string(),
  name: z.string(),
});

const albumArtistList = z.object({
  artist: z.array(albumArtist),
  name: z.string(),
});

const artistInfoParameters = z.object({
  count: z.number().optional(),
  id: z.string(),
  includeNotPresent: z.boolean().optional(),
});

const artistInfo = z.object({
  artistInfo2: z.object({
    biography: z.string().optional(),
    largeImageUrl: z.string().optional(),
    lastFmUrl: z.string().optional(),
    mediumImageUrl: z.string().optional(),
    musicBrainzId: z.string().optional(),
    similarArtist: z.array(
      z.object({
        albumCount: z.string(),
        artistImageUrl: z.string().optional(),
        coverArt: z.string().optional(),
        id: z.string(),
        name: z.string(),
      }),
    ),
    smallImageUrl: z.string().optional(),
  }),
});

const topSongsListParameters = z.object({
  artist: z.string(), // The name of the artist, not the artist ID
  count: z.number().optional(),
});

const topSongsList = z.object({
  topSongs: z.object({
    song: z.array(song),
  }),
});

const scrobbleParameters = z.object({
  id: z.string(),
  submission: z.boolean().optional(),
  time: z.number().optional(), // The time (in milliseconds since 1 Jan 1970) at which the song was listened to.
});

const scrobble = z.null();

export const ssType = {
  _parameters: {
    albumList: albumListParameters,
    artistInfo: artistInfoParameters,
    authenticate: authenticateParameters,
    createFavorite: createFavoriteParameters,
    removeFavorite: removeFavoriteParameters,
    scrobble: scrobbleParameters,
    setRating: setRatingParameters,
    topSongsList: topSongsListParameters,
  },
  _response: {
    albumArtistList,
    albumList,
    artistInfo,
    authenticate,
    baseResponse,
    createFavorite,
    musicFolderList,
    removeFavorite,
    scrobble,
    setRating,
    song,
    topSongsList,
  },
};
