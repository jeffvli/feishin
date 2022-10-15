import {
  NormalizedAlbum,
  NormalizedArtist,
  NormalizedGenre,
  NormalizedSong,
} from '../api/types';
import { NDAlbum, NDArtist, NDGenre, NDSong } from './navidrome.types';

const genre = (genre: NDGenre): NormalizedGenre => {
  return {
    id: genre.id,
    name: genre.name,
  };
};

const artist = (artist: NDArtist): NormalizedArtist => {
  return {
    biography: artist.biography,
    genres: artist.genres.map(genre),
    id: artist.id,
    name: artist.name,
  };
};

const album = (album: NDAlbum): NormalizedAlbum => {
  return {
    albumArtistId: album.albumArtistId,
    createdAt: album.createdAt,
    genres: album.genres.map(genre),
    id: album.id,
    name: album.name,
    year: album.minYear,
  };
};

const song = (song: NDSong): NormalizedSong => {
  return {
    albumId: song.albumId,
    artists: [{ id: song.artistId, name: song.artist }],
    bitRate: song.bitRate,
    container: song.suffix,
    createdAt: song.createdAt,
    disc: song.discNumber,
    duration: song.duration,
    genres: song.genres.map(genre),
    id: song.id,
    name: song.title,
    path: song.path,
    track: song.trackNumber,
    year: song.year,
  };
};

export const navidromeNormalize = {
  album,
  artist,
  genre,
  song,
};
