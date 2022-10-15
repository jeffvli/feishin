import {
  ExternalSource,
  Folder,
  ImageType,
  Server,
  ServerFolder,
  Task,
} from '@prisma/client';
import uniqBy from 'lodash/uniqBy';
import { prisma } from '../../lib';
import { groupByProperty } from '../../utils';
import { queue } from '../queues';
import { jellyfinApi } from './jellyfin.api';
import { JFExternalType, JFImageType, JFItemType } from './jellyfin.types';
import { jellyfinUtils } from './jellyfin.utils';

const scanGenres = async (options: {
  server: Server;
  serverFolder: ServerFolder;
  task: Task;
}) => {
  await prisma.task.update({
    data: { message: 'Scanning genres' },
    where: { id: options.task.id },
  });

  const genres = await jellyfinApi.getGenres(options.server, {
    parentId: options.serverFolder.remoteId,
  });

  const genresCreate = genres.Items.map((genre) => {
    return { name: genre.Name };
  });

  await prisma.genre.createMany({
    data: genresCreate,
    skipDuplicates: true,
  });
};

const scanAlbumArtists = async (
  server: Server,
  serverFolder: ServerFolder,
  task: Task
) => {
  await prisma.task.update({
    data: { message: 'Scanning album artists' },
    where: { id: task.id },
  });

  // TODO: Possibly need to scan without the parentId to get all artists, since Jellyfin may link an album to an artist of a different folder
  const albumArtists = await jellyfinApi.getAlbumArtists(server, {
    fields: 'Genres,DateCreated,ExternalUrls,Overview',
    parentId: serverFolder.remoteId,
  });

  await jellyfinUtils.insertGenres(albumArtists.Items);
  await jellyfinUtils.insertImages(albumArtists.Items);
  await jellyfinUtils.insertExternals(albumArtists.Items);

  for (const albumArtist of albumArtists.Items) {
    const genresConnect = albumArtist.Genres.map((genre) => ({ name: genre }));

    const imagesConnectOrCreate = [];
    for (const backdrop of albumArtist.BackdropImageTags) {
      imagesConnectOrCreate.push({
        create: { remoteUrl: backdrop, type: ImageType.BACKDROP },
        where: {
          uniqueImageId: { remoteUrl: backdrop, type: ImageType.BACKDROP },
        },
      });
    }

    for (const [key, value] of Object.entries(albumArtist.ImageTags)) {
      if (key === JFImageType.PRIMARY) {
        imagesConnectOrCreate.push({
          create: { remoteUrl: value, type: ImageType.PRIMARY },
          where: {
            uniqueImageId: { remoteUrl: value, type: ImageType.PRIMARY },
          },
        });
      }
      if (key === JFImageType.LOGO) {
        imagesConnectOrCreate.push({
          create: { remoteUrl: value, type: ImageType.LOGO },
          where: {
            uniqueImageId: { remoteUrl: value, type: ImageType.LOGO },
          },
        });
      }
    }

    const externalsConnect = albumArtist.ExternalUrls.map((external) => ({
      uniqueExternalId: {
        source:
          external.Name === JFExternalType.MUSICBRAINZ
            ? ExternalSource.MUSICBRAINZ
            : ExternalSource.THEAUDIODB,
        value: external.Url.split('/').pop() || '',
      },
    }));

    await prisma.albumArtist.upsert({
      create: {
        biography: albumArtist.Overview,
        externals: { connect: externalsConnect },
        genres: { connect: genresConnect },
        images: {
          connectOrCreate: imagesConnectOrCreate,
        },
        name: albumArtist.Name,
        remoteCreatedAt: albumArtist.DateCreated,
        remoteId: albumArtist.Id,
        serverFolders: { connect: { id: serverFolder.id } },
        serverId: server.id,
        sortName: albumArtist.Name,
      },
      update: {
        biography: albumArtist.Overview,
        deleted: false,
        externals: { connect: externalsConnect },
        genres: { connect: genresConnect },
        images: {
          connectOrCreate: imagesConnectOrCreate,
        },
        name: albumArtist.Name,
        remoteCreatedAt: albumArtist.DateCreated,
        remoteId: albumArtist.Id,
        serverFolders: { connect: { id: serverFolder.id } },
        serverId: server.id,
        sortName: albumArtist.Name,
      },
      where: {
        uniqueAlbumArtistId: {
          remoteId: albumArtist.Id,
          serverId: server.id,
        },
      },
    });
  }
};

const scanAlbums = async (
  server: Server,
  serverFolder: ServerFolder,
  task: Task
) => {
  const check = await jellyfinApi.getAlbums(server, {
    enableUserData: false,
    includeItemTypes: JFItemType.MUSICALBUM,
    limit: 1,
    parentId: serverFolder.remoteId,
    recursive: true,
  });

  const albumCount = check.TotalRecordCount;
  const chunkSize = 5000;
  const albumChunkCount = Math.ceil(albumCount / chunkSize);

  await prisma.task.update({
    data: { message: 'Scanning albums' },
    where: { id: task.id },
  });

  for (let i = 0; i < albumChunkCount; i += 1) {
    const albums = await jellyfinApi.getAlbums(server, {
      enableImageTypes: 'Primary,Logo,Backdrop',
      enableUserData: false,
      fields: 'Genres,DateCreated,ExternalUrls,Overview',
      imageTypeLimit: 1,
      limit: chunkSize,
      parentId: serverFolder.remoteId,
      recursive: true,
      startIndex: i * chunkSize,
    });

    await jellyfinUtils.insertGenres(albums.Items);
    await jellyfinUtils.insertImages(albums.Items);
    await jellyfinUtils.insertExternals(albums.Items);

    for (const album of albums.Items) {
      const genresConnect = album.Genres.map((genre) => ({ name: genre }));

      const imagesConnectOrCreate = [];
      for (const [key, value] of Object.entries(album.ImageTags)) {
        if (key === JFImageType.PRIMARY) {
          imagesConnectOrCreate.push({
            create: { remoteUrl: value, type: ImageType.PRIMARY },
            where: {
              uniqueImageId: { remoteUrl: value, type: ImageType.PRIMARY },
            },
          });
        }
        if (key === JFImageType.LOGO) {
          imagesConnectOrCreate.push({
            create: { remoteUrl: value, type: ImageType.LOGO },
            where: {
              uniqueImageId: { remoteUrl: value, type: ImageType.LOGO },
            },
          });
        }
      }

      const externalsConnect = album.ExternalUrls.map((external) => ({
        uniqueExternalId: {
          source:
            external.Name === JFExternalType.MUSICBRAINZ
              ? ExternalSource.MUSICBRAINZ
              : ExternalSource.THEAUDIODB,
          value: external.Url.split('/').pop() || '',
        },
      }));

      const remoteAlbumArtists = album.AlbumArtists;

      const albumArtists = await prisma.albumArtist.findMany({
        where: {
          remoteId: { in: remoteAlbumArtists.map((artist) => artist.Id) },
        },
      });

      const albumArtistsConnect = [];
      for (const albumArtist of remoteAlbumArtists) {
        const invalid = !albumArtists.find(
          (artist) => artist.remoteId === albumArtist.Id
        );

        if (invalid) {
          // If Jellyfin returns an invalid album artist, we'll just use the first matching one
          const foundAlternate = await prisma.albumArtist.findFirst({
            where: {
              name: albumArtist.Name,
              serverId: server.id,
            },
          });

          if (foundAlternate) {
            albumArtistsConnect.push({
              uniqueAlbumArtistId: {
                remoteId: foundAlternate.remoteId,
                serverId: server.id,
              },
            });
          }
        } else {
          albumArtistsConnect.push({
            uniqueAlbumArtistId: {
              remoteId: albumArtist.Id,
              serverId: server.id,
            },
          });
        }
      }

      await prisma.album.upsert({
        create: {
          albumArtists: { connect: albumArtistsConnect },
          externals: { connect: externalsConnect },
          genres: { connect: genresConnect },
          images: { connectOrCreate: imagesConnectOrCreate },
          name: album.Name,
          releaseDate: album.PremiereDate,
          releaseYear: album.ProductionYear,
          remoteCreatedAt: album.DateCreated,
          remoteId: album.Id,
          serverFolders: { connect: { id: serverFolder.id } },
          serverId: server.id,
          sortName: album.Name,
        },
        update: {
          albumArtists: { connect: albumArtistsConnect },
          deleted: false,
          externals: { connect: externalsConnect },
          genres: { connect: genresConnect },
          images: { connectOrCreate: imagesConnectOrCreate },
          name: album.Name,
          releaseDate: album.PremiereDate,
          releaseYear: album.ProductionYear,
          remoteCreatedAt: album.DateCreated,
          remoteId: album.Id,
          serverFolders: { connect: { id: serverFolder.id } },
          serverId: server.id,
          sortName: album.Name,
        },
        where: {
          uniqueAlbumId: {
            remoteId: album.Id,
            serverId: server.id,
          },
        },
      });
    }
  }
};

const scanSongs = async (
  server: Server,
  serverFolder: ServerFolder,
  task: Task
) => {
  const check = await jellyfinApi.getSongs(server, {
    enableUserData: false,
    limit: 0,
    parentId: serverFolder.remoteId,
    recursive: true,
  });

  const songCount = check.TotalRecordCount;
  const chunkSize = 5000;
  const songChunkCount = Math.ceil(songCount / chunkSize);

  await prisma.task.update({
    data: { message: 'Scanning songs' },
    where: { id: task.id },
  });

  for (let i = 0; i < songChunkCount; i += 1) {
    const songs = await jellyfinApi.getSongs(server, {
      enableImageTypes: 'Primary,Logo,Backdrop',
      enableUserData: false,
      fields: 'Genres,DateCreated,ExternalUrls,MediaSources,SortName',
      imageTypeLimit: 1,
      limit: chunkSize,
      parentId: serverFolder.remoteId,
      recursive: true,
      sortBy: 'DateCreated,Album',
      sortOrder: 'Descending',
      startIndex: i * chunkSize,
    });

    const folderGroups = songs.Items.map((song) => {
      const songPaths = song.MediaSources[0].Path.split('/');
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
      if (folder.parentId) break;

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

    await jellyfinUtils.insertArtists(server, serverFolder, songs.Items);
    await jellyfinUtils.insertImages(songs.Items);
    await jellyfinUtils.insertExternals(songs.Items);

    const albumSongGroups = groupByProperty(songs.Items, 'AlbumId');
    const keys = Object.keys(albumSongGroups);

    for (const key of keys) {
      const songGroup = albumSongGroups[key];
      await jellyfinUtils.insertSongGroup(server, serverFolder, songGroup, key);
    }
  }
};

const checkDeleted = async (
  server: Server,
  serverFolder: ServerFolder,
  task: Task
) => {
  await prisma.$transaction([
    prisma.albumArtist.updateMany({
      data: { deleted: true },
      where: {
        serverFolders: { some: { id: serverFolder.id } },
        serverId: server.id,
        updatedAt: { lte: task.createdAt },
      },
    }),
    prisma.artist.updateMany({
      data: { deleted: true },
      where: {
        serverFolders: { some: { id: serverFolder.id } },
        serverId: server.id,
        updatedAt: { lte: task.createdAt },
      },
    }),
    prisma.album.updateMany({
      data: { deleted: true },
      where: {
        serverFolders: { some: { id: serverFolder.id } },
        serverId: server.id,
        updatedAt: { lte: task.createdAt },
      },
    }),
    prisma.song.updateMany({
      data: { deleted: true },
      where: {
        serverFolders: { some: { id: serverFolder.id } },
        serverId: server.id,
        updatedAt: { lte: task.createdAt },
      },
    }),
  ]);
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
        await scanGenres({ server, serverFolder, task });
        await scanAlbumArtists(server, serverFolder, task);
        await scanAlbums(server, serverFolder, task);
        await scanSongs(server, serverFolder, task);
        await checkDeleted(server, serverFolder, task);
      }

      return { task };
    },
    id: task.id,
  });
};

export const jellyfinScanner = {
  scanAlbumArtists,
  scanAlbums,
  scanAll,
  scanGenres,
  scanSongs,
};
