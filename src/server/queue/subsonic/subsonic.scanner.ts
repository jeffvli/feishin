/* eslint-disable no-await-in-loop */
import { ImageType, Server, ServerFolder, Task } from '@prisma/client';
import { prisma, throttle } from '@lib/index';
import { uniqueArray } from '@utils/index';
import { queue } from '../queues';
import { subsonicApi } from './subsonic.api';
import { subsonicUtils } from './subsonic.utils';

export const scanGenres = async (server: Server, task: Task) => {
  await prisma.task.update({
    data: { message: 'Scanning genres' },
    where: { id: task.id },
  });

  const res = await subsonicApi.getGenres(server);

  const genres = res.genres.genre.map((genre) => {
    return { name: genre.value };
  });

  await prisma.genre.createMany({
    data: genres,
    skipDuplicates: true,
  });
};

export const scanAlbumArtists = async (
  server: Server,
  serverFolder: ServerFolder
) => {
  const artists = await subsonicApi.getArtists(server, serverFolder.remoteId);

  for (const artist of artists) {
    await prisma.albumArtist.upsert({
      create: {
        name: artist.name,
        remoteId: artist.id,
        serverFolders: { connect: { id: serverFolder.id } },
        serverId: server.id,
        sortName: artist.name,
      },
      update: {
        name: artist.name,
        remoteId: artist.id,
        serverFolders: { connect: { id: serverFolder.id } },
        serverId: server.id,
        sortName: artist.name,
      },
      where: {
        uniqueAlbumArtistId: {
          remoteId: artist.id,
          serverId: server.id,
        },
      },
    });
  }
};

export const scanAlbums = async (
  server: Server,
  serverFolder: ServerFolder
) => {
  const albums = await subsonicApi.getAlbums(server, {
    musicFolderId: serverFolder.id,
    offset: 0,
    size: 500,
    type: 'newest',
  });

  await subsonicUtils.insertImages(albums);

  for (const album of albums) {
    const imagesConnect = album.coverArt
      ? {
          uniqueImageId: {
            remoteUrl: album.coverArt,
            type: ImageType.PRIMARY,
          },
        }
      : undefined;

    const albumArtistConnect = album.artistId
      ? {
          uniqueAlbumArtistId: {
            remoteId: album.artistId,
            serverId: server.id,
          },
        }
      : undefined;

    await prisma.album.upsert({
      create: {
        albumArtists: { connect: albumArtistConnect },
        genres: { connect: album.genre ? { name: album.genre } : undefined },
        images: { connect: imagesConnect },
        name: album.title,
        releaseDate: album?.year
          ? new Date(album.year, 0).toISOString()
          : undefined,
        releaseYear: album.year,
        remoteCreatedAt: album.created,
        remoteId: album.id,
        serverFolders: { connect: { id: serverFolder.id } },
        serverId: server.id,
        sortName: album.title,
      },
      update: {
        albumArtists: { connect: albumArtistConnect },
        genres: { connect: album.genre ? { name: album.genre } : undefined },
        images: { connect: imagesConnect },
        name: album.title,
        releaseDate: album?.year
          ? new Date(album.year, 0).toISOString()
          : undefined,
        releaseYear: album.year,
        remoteCreatedAt: album.created,
        remoteId: album.id,
        serverFolders: { connect: { id: serverFolder.id } },
        serverId: server.id,
        sortName: album.title,
      },
      where: {
        uniqueAlbumId: {
          remoteId: album.id,
          serverId: server.id,
        },
      },
    });
  }
};

const throttledAlbumFetch = throttle(
  async (server: Server, serverFolder: ServerFolder, album: any) => {
    const albumRes = await subsonicApi.getAlbum(server, album.remoteId);

    if (albumRes) {
      await subsonicUtils.insertSongImages(albumRes);
      const songsUpsert = albumRes.album.song.map((song) => {
        const genresConnect = song.genre ? { name: song.genre } : undefined;

        const imagesConnect = song.coverArt
          ? {
              uniqueImageId: {
                remoteUrl: song.coverArt,
                type: ImageType.PRIMARY,
              },
            }
          : undefined;

        const albumArtistsConnect = song.artistId
          ? {
              uniqueAlbumArtistId: {
                remoteId: song.artistId,
                serverId: server.id,
              },
            }
          : undefined;

        return {
          create: {
            albumArtists: { connect: albumArtistsConnect },
            artistName: !song.artistId ? song.artist : undefined,
            bitRate: song.bitRate,
            container: song.suffix,
            discNumber: song.discNumber,
            duration: song.duration,
            genres: { connect: genresConnect },
            images: { connect: imagesConnect },
            name: song.title,
            releaseDate: song?.year
              ? new Date(song.year, 0).toISOString()
              : undefined,
            releaseYear: song.year,
            remoteCreatedAt: song.created,
            remoteId: song.id,
            serverFolders: { connect: { id: serverFolder.id } },
            serverId: server.id,
            size: song.size,
            sortName: song.title,
            trackNumber: song.track,
          },
          update: {
            albumArtists: { connect: albumArtistsConnect },
            artistName: !song.artistId ? song.artist : undefined,
            bitRate: song.bitRate,
            container: song.suffix,
            discNumber: song.discNumber,
            duration: song.duration,
            genres: { connect: genresConnect },
            images: { connect: imagesConnect },
            name: song.title,
            releaseDate: song?.year
              ? new Date(song.year, 0).toISOString()
              : undefined,
            releaseYear: song.year,
            remoteCreatedAt: song.created,
            remoteId: song.id,
            serverFolders: { connect: { id: serverFolder.id } },
            serverId: server.id,
            size: song.size,
            sortName: song.title,
            trackNumber: song.track,
          },
          where: {
            uniqueSongId: {
              remoteId: song.id,
              serverId: server.id,
            },
          },
        };
      });

      const uniqueArtistIds = albumRes.album.song
        .map((song) => song.artistId)
        .filter(uniqueArray);

      const artistsConnect = uniqueArtistIds.map((artistId) => {
        return {
          uniqueArtistId: {
            remoteId: artistId!,
            serverId: server.id,
          },
        };
      });

      await prisma.album.update({
        data: {
          artists: { connect: artistsConnect },
          songs: { upsert: songsUpsert },
        },
        where: {
          uniqueAlbumId: {
            remoteId: albumRes.album.id,
            serverId: server.id,
          },
        },
      });
    }
  }
);

export const scanAlbumDetail = async (
  server: Server,
  serverFolder: ServerFolder
) => {
  const promises = [];
  const dbAlbums = await prisma.album.findMany({
    where: {
      serverId: server.id,
    },
  });

  for (let i = 0; i < dbAlbums.length; i += 1) {
    promises.push(throttledAlbumFetch(server, serverFolder, dbAlbums[i]));
  }

  await Promise.all(promises);
};

const scanAll = async (
  server: Server,
  serverFolders: ServerFolder[],
  task: Task
) => {
  queue.scanner.push({
    fn: async () => {
      await prisma.task.update({
        data: { message: 'Beginning scan...' },
        where: { id: task.id },
      });

      for (const serverFolder of serverFolders) {
        await scanGenres(server, task);
        await scanAlbumArtists(server, serverFolder);
        await scanAlbums(server, serverFolder);
        await scanAlbumDetail(server, serverFolder);
      }

      return { task };
    },
    id: task.id,
  });
};

export const subsonicScanner = {
  scanAll,
  scanGenres,
};
