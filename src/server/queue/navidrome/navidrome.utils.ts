import { ExternalSource, Server, ServerFolder } from '@prisma/client';
import { prisma } from '../../lib';
import { NDSong } from './navidrome.types';

const insertSongGroup = async (
  server: Server,
  serverFolder: ServerFolder,
  songs: NDSong[],
  remoteAlbumId: string
) => {
  const songsWithArtistIds = songs.filter((song) => song.artistId);
  const artistId =
    songsWithArtistIds.length > 0 ? songsWithArtistIds[0].artistId : undefined;

  const albumArtist = artistId
    ? await prisma.albumArtist.findUnique({
        where: {
          uniqueAlbumArtistId: {
            remoteId: artistId,
            serverId: server.id,
          },
        },
      })
    : undefined;

  const songsUpsert = songs.map((song) => {
    const genresConnect = song.genres
      ? song.genres.map((genre) => ({ name: genre.name }))
      : undefined;

    const externalsConnect = song.mbzTrackId
      ? {
          uniqueExternalId: {
            source: ExternalSource.MUSICBRAINZ,
            value: song.mbzTrackId,
          },
        }
      : undefined;

    const pathSplit = song.path.split('/');
    const parentPath = pathSplit.slice(0, pathSplit.length - 1).join('/');

    return {
      create: {
        albumArtistId: albumArtist?.id,
        artistName: !song.artistId ? song.artist : undefined,
        bitRate: song.bitRate,
        container: song.suffix,
        deleted: false,
        discNumber: song.discNumber,
        duration: song.duration,
        externals: { connect: externalsConnect },
        folders: {
          connect: {
            uniqueFolderId: { path: parentPath, serverId: server.id },
          },
        },
        genres: { connect: genresConnect },
        name: song.title,
        releaseDate: song?.year
          ? new Date(song.year, 0).toISOString()
          : undefined,
        releaseYear: song?.year,
        remoteCreatedAt: song.createdAt,
        remoteId: song.id,
        serverFolders: { connect: { id: serverFolder.id } },
        serverId: server.id,
        size: song.size,
        sortName: song.title,
        trackNumber: song.trackNumber,
      },
      update: {
        albumArtistId: albumArtist?.id,
        artistName: !song.artistId ? song.artist : undefined,
        bitRate: song.bitRate,
        container: song.suffix,
        deleted: false,
        discNumber: song.discNumber,
        duration: song.duration,
        externals: { connect: externalsConnect },
        folders: {
          connect: {
            uniqueFolderId: { path: parentPath, serverId: server.id },
          },
        },
        genres: { connect: genresConnect },
        name: song.title,
        releaseDate: song?.year
          ? new Date(song.year, 0).toISOString()
          : undefined,
        releaseYear: song?.year,
        remoteCreatedAt: song.createdAt,
        remoteId: song.id,
        serverFolders: { connect: { id: serverFolder.id } },
        serverId: server.id,
        size: song.size,
        sortName: song.title,
        trackNumber: song.trackNumber,
      },
      where: {
        uniqueSongId: {
          remoteId: song.id,
          serverId: server.id,
        },
      },
    };
  });

  await prisma.album.update({
    data: {
      deleted: false,
      songs: { upsert: songsUpsert },
    },
    where: {
      uniqueAlbumId: {
        remoteId: remoteAlbumId,
        serverId: server.id,
      },
    },
  });
};

export const navidromeUtils = {
  insertSongGroup,
};
