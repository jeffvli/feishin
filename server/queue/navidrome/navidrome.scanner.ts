/* eslint-disable no-await-in-loop */
import {
  ExternalSource,
  ExternalType,
  Folder,
  ImageType,
  Server,
  ServerFolder,
  Task,
} from '@prisma/client';
import uniqBy from 'lodash/uniqBy';
import { prisma } from '@lib/prisma';
import { groupByProperty } from '@utils/group-by-property';
import { queue } from '../queues/index';
import { navidromeApi } from './navidrome.api';
import { navidromeUtils } from './navidrome.utils';

const CHUNK_SIZE = 5000;

export const scanGenres = async (server: Server, task: Task) => {
  await prisma.task.update({
    data: { message: 'Scanning genres' },
    where: { id: task.id },
  });

  const res = await navidromeApi.getGenres(server);

  const genres = res.map((genre) => {
    return { name: genre.name };
  });

  await prisma.genre.createMany({
    data: genres,
    skipDuplicates: true,
  });
};

export const scanAlbumArtists = async (
  server: Server,
  serverFolder: ServerFolder,
  task: Task
) => {
  await prisma.task.update({
    data: { message: 'Scanning artists' },
    where: { id: task.id },
  });

  const artists = await navidromeApi.getArtists(server);

  const externalsCreateMany = artists
    .filter((artist) => artist.mbzArtistId)
    .map((artist) => ({
      source: ExternalSource.MUSICBRAINZ,
      type: ExternalType.ID,
      value: artist.mbzArtistId,
    }));

  await prisma.external.createMany({
    data: externalsCreateMany,
    skipDuplicates: true,
  });

  for (const artist of artists) {
    const genresConnect = artist.genres
      ? artist.genres.map((genre) => ({ name: genre.name }))
      : undefined;

    const externalsConnect = artist.mbzArtistId
      ? {
          uniqueExternalId: {
            source: ExternalSource.MUSICBRAINZ,
            value: artist.mbzArtistId,
          },
        }
      : undefined;

    await prisma.albumArtist.upsert({
      create: {
        deleted: false,
        externals: { connect: externalsConnect },
        genres: { connect: genresConnect },
        name: artist.name,
        remoteId: artist.id,
        serverFolders: { connect: { id: serverFolder.id } },
        serverId: server.id,
        sortName: artist.name,
      },
      update: {
        deleted: false,
        externals: { connect: externalsConnect },
        genres: { connect: genresConnect },
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
  serverFolder: ServerFolder,
  task: Task
) => {
  await prisma.task.update({
    data: { message: 'Scanning albums' },
    where: { id: task.id },
  });

  let start = 0;
  let count = 5000;
  do {
    const albums = await navidromeApi.getAlbums(server, {
      _end: start + CHUNK_SIZE,
      _start: start,
    });

    const imagesCreateMany = albums
      .filter((album) => album.coverArtId)
      .map((album) => ({
        remoteUrl: album.coverArtId,
        type: ImageType.PRIMARY,
      }));

    await prisma.image.createMany({
      data: imagesCreateMany,
      skipDuplicates: true,
    });

    const artistIds = (
      await prisma.artist.findMany({
        select: { remoteId: true },
        where: { serverId: server.id },
      })
    ).map((artist) => artist.remoteId);

    for (const album of albums) {
      const imagesConnect = album.coverArtId
        ? {
            uniqueImageId: {
              remoteUrl: album.coverArtId,
              type: ImageType.PRIMARY,
            },
          }
        : undefined;

      const genresConnect = album.genres
        ? album.genres.map((genre) => ({ name: genre.name }))
        : undefined;

      const validArtistIds = [];
      const ndArtistIds = album.allArtistIds.split(' ');

      for (const artistId of ndArtistIds) {
        if (artistIds.includes(artistId)) {
          validArtistIds.push(artistId);
        }
      }

      // const artistsConnect = validArtistIds.map((id) => ({
      //   uniqueArtistId: {
      //     remoteId: id,
      //     serverId: server.id,
      //   },
      // }));

      const aaConnect = [];
      const albumArtistConnect = album.albumArtistId
        ? {
            uniqueAlbumArtistId: {
              remoteId: album.albumArtistId,
              serverId: server.id,
            },
          }
        : undefined;

      aaConnect.push(
        ...validArtistIds.map((id) => ({
          uniqueAlbumArtistId: {
            remoteId: id,
            serverId: server.id,
          },
        }))
      );

      albumArtistConnect && aaConnect.push(albumArtistConnect);

      const year = album.minYear === 0 ? null : album.minYear;

      await prisma.album.upsert({
        create: {
          albumArtists: { connect: aaConnect },
          // artists: { connect: artistsConnect },
          deleted: false,
          genres: { connect: genresConnect },
          images: { connect: imagesConnect },
          name: album.name,
          releaseDate: year ? new Date(year, 0).toISOString() : undefined,
          releaseYear: year,
          remoteCreatedAt: album.createdAt,
          remoteId: album.id,
          serverFolders: { connect: { id: serverFolder.id } },
          serverId: server.id,
          sortName: album.name,
        },
        update: {
          albumArtists: { connect: aaConnect },
          // artists: { connect: artistsConnect },
          deleted: false,
          genres: { connect: genresConnect },
          images: { connect: imagesConnect },
          name: album.name,
          releaseDate: year ? new Date(year, 0).toISOString() : null,
          releaseYear: year,
          remoteCreatedAt: album.createdAt,
          remoteId: album.id,
          serverFolders: { connect: { id: serverFolder.id } },
          serverId: server.id,
          sortName: album.name,
        },
        where: {
          uniqueAlbumId: {
            remoteId: album.id,
            serverId: server.id,
          },
        },
      });
    }

    start += CHUNK_SIZE;
    count = albums.length;
  } while (count === CHUNK_SIZE);
};

const scanSongs = async (
  server: Server,
  serverFolder: ServerFolder,
  task: Task
) => {
  await prisma.task.update({
    data: { message: 'Scanning songs' },
    where: { id: task.id },
  });

  let start = 0;
  let count = 5000;
  do {
    const songs = await navidromeApi.getSongs(server, {
      _end: start + CHUNK_SIZE,
      _start: start,
    });

    const externalsCreateMany = [];
    const genresCreateMany = [];
    for (const song of songs) {
      if (song.mbzTrackId) {
        externalsCreateMany.push({
          source: ExternalSource.MUSICBRAINZ,
          type: ExternalType.ID,
          value: song.mbzTrackId,
        });
      }

      if (song.genres?.length > 0) {
        genresCreateMany.push(
          ...song.genres.map((genre) => ({ name: genre.name }))
        );
      }
    }

    await prisma.external.createMany({
      data: externalsCreateMany,
      skipDuplicates: true,
    });

    await prisma.genre.createMany({
      data: genresCreateMany,
      skipDuplicates: true,
    });

    const folderGroups = songs.map((song) => {
      const songPaths = song.path.split('/');
      const paths = [];
      for (let b = 0; b < songPaths.length - 1; b += 1) {
        paths.push({
          name: songPaths[b],
          path: songPaths.slice(0, b + 1).join('/'),
        });
      }

      return paths;
    });

    const uniqueFolders = uniqBy(
      folderGroups.flatMap((folder) => folder).filter((f) => f.path !== ''),
      'path'
    );

    const createdFolders: Folder[] = [];
    for (const folder of uniqueFolders) {
      const createdFolder = await prisma.folder.upsert({
        create: {
          name: folder.name,
          path: folder.path,
          serverFolders: {
            connect: {
              uniqueServerFolderId: {
                remoteId: serverFolder.remoteId,
                serverId: server.id,
              },
            },
          },
          serverId: server.id,
        },
        update: {
          name: folder.name,
          path: folder.path,
          serverFolders: {
            connect: {
              uniqueServerFolderId: {
                remoteId: serverFolder.remoteId,
                serverId: server.id,
              },
            },
          },
        },
        where: {
          uniqueFolderId: {
            path: folder.path,
            serverId: server.id,
          },
        },
      });

      createdFolders.push(createdFolder);
    }

    for (const folder of createdFolders) {
      if (folder?.parentId || !folder) break;

      const pathSplit = folder.path.split('/');
      const parentPath = pathSplit.slice(0, pathSplit.length - 1).join('/');

      const parentPathData = createdFolders.find(
        (save) => save.path === parentPath
      );

      if (parentPathData) {
        await prisma.folder.update({
          data: {
            parentId: parentPathData.id,
          },
          where: { id: folder.id },
        });
      }
    }

    const albumSongGroups = groupByProperty(songs, 'albumId');
    const albumIds = Object.keys(albumSongGroups);

    for (const id of albumIds) {
      const songGroup = albumSongGroups[id];
      await navidromeUtils.insertSongGroup(server, serverFolder, songGroup, id);
    }

    start += CHUNK_SIZE;
    count = songs.length;
  } while (count === CHUNK_SIZE);
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
        // await scanGenres(server, task);
        // await scanAlbumArtists(server, serverFolder, task);
        await scanAlbums(server, serverFolder, task);
        // await scanSongs(server, serverFolder, task);

        await prisma.serverFolder.update({
          data: { lastScannedAt: new Date() },
          where: { id: serverFolder.id },
        });
      }

      return { task };
    },
    id: task.id,
  });
};

export const navidromeScanner = {
  scanAll,
  scanGenres,
};
