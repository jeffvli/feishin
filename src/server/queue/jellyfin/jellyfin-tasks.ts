import uniqBy from 'lodash/uniqBy';
import { prisma } from '../../lib';
import { Server, ServerFolder, Task } from '../../types/types';
import { groupByProperty, uniqueArray } from '../../utils';
import { completeTask, q } from '../scanner-queue';
import { jellyfinApi } from './jellyfin-api';
import { JFSong } from './jellyfin-types';

const scanGenres = async (
  server: Server,
  serverFolder: ServerFolder,
  task: Task
) => {
  const taskId = `[${server.name} (${serverFolder.name})] genres`;

  q.push({
    fn: async () => {
      await prisma.task.update({
        data: { message: 'Scanning genres' },
        where: { id: task.id },
      });

      const genres = await jellyfinApi.getGenres(server, {
        parentId: serverFolder.remoteId,
      });

      const genresCreate = genres.Items.map((genre) => {
        return { name: genre.Name };
      });

      await prisma.genre.createMany({
        data: genresCreate,
        skipDuplicates: true,
      });

      return { task };
    },
    id: taskId,
  });
};

const scanAlbumArtists = async (
  server: Server,
  serverFolder: ServerFolder,
  task: Task
) => {
  const taskId = `[${server.name} (${serverFolder.name})] album artists`;

  q.push({
    fn: async () => {
      await prisma.task.update({
        data: { message: 'Scanning album artists' },
        where: { id: task.id },
      });
      const albumArtists = await jellyfinApi.getAlbumArtists(server, {
        fields: 'Genres,DateCreated,ExternalUrls,Overview',
        parentId: serverFolder.remoteId,
      });

      for (const albumArtist of albumArtists.Items) {
        const genresConnectOrCreate = albumArtist.Genres.map((genre) => {
          return { create: { name: genre }, where: { name: genre } };
        });

        const imagesConnectOrCreate = [];
        for (const [key, value] of Object.entries(albumArtist.ImageTags)) {
          imagesConnectOrCreate.push({
            create: { name: key, url: value },
            where: { uniqueImageId: { name: key, url: value } },
          });
        }

        const externalsConnectOrCreate = albumArtist.ExternalUrls.map(
          (external) => {
            return {
              create: { name: external.Name, url: external.Url },
              where: {
                uniqueExternalId: { name: external.Name, url: external.Url },
              },
            };
          }
        );

        await prisma.albumArtist.upsert({
          create: {
            biography: albumArtist.Overview,
            externals: { connectOrCreate: externalsConnectOrCreate },
            genres: { connectOrCreate: genresConnectOrCreate },
            images: { connectOrCreate: imagesConnectOrCreate },
            name: albumArtist.Name,
            remoteCreatedAt: albumArtist.DateCreated,
            remoteId: albumArtist.Id,
            serverFolders: { connect: { id: serverFolder.id } },
            serverId: server.id,
          },
          update: {
            biography: albumArtist.Overview,
            deleted: false,
            externals: { connectOrCreate: externalsConnectOrCreate },
            genres: { connectOrCreate: genresConnectOrCreate },
            images: { connectOrCreate: imagesConnectOrCreate },
            name: albumArtist.Name,
            remoteCreatedAt: albumArtist.DateCreated,
            remoteId: albumArtist.Id,
            serverFolders: { connect: { id: serverFolder.id } },
            serverId: server.id,
          },
          where: {
            uniqueAlbumArtistId: {
              remoteId: albumArtist.Id,
              serverId: server.id,
            },
          },
        });
      }

      return { task };
    },
    id: taskId,
  });
};

const scanAlbums = async (
  server: Server,
  serverFolder: ServerFolder,
  task: Task
) => {
  const check = await jellyfinApi.getAlbums(server, {
    enableUserData: false,
    includeItemTypes: 'MusicAlbum',
    limit: 1,
    parentId: serverFolder.remoteId,
    recursive: true,
  });

  const albumCount = check.TotalRecordCount;
  const chunkSize = 5000;
  const albumChunkCount = Math.ceil(albumCount / chunkSize);

  const taskId = `(${task.id}) [${server.name} (${serverFolder.name})] albums`;

  q.push({
    fn: async () => {
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

        for (const album of albums.Items) {
          const genresConnectOrCreate = album.Genres.map((genre) => {
            return { create: { name: genre }, where: { name: genre } };
          });

          const imagesConnectOrCreate = [];
          for (const [key, value] of Object.entries(album.ImageTags)) {
            imagesConnectOrCreate.push({
              create: { name: key, url: value },
              where: { uniqueImageId: { name: key, url: value } },
            });
          }

          const externalsConnectOrCreate = album.ExternalUrls.map(
            (external) => {
              return {
                create: { name: external.Name, url: external.Url },
                where: {
                  uniqueExternalId: { name: external.Name, url: external.Url },
                },
              };
            }
          );

          const albumArtist =
            album.AlbumArtists.length > 0
              ? await prisma.albumArtist.findUnique({
                  where: {
                    uniqueAlbumArtistId: {
                      remoteId: album.AlbumArtists && album.AlbumArtists[0].Id,
                      serverId: server.id,
                    },
                  },
                })
              : undefined;

          await prisma.album.upsert({
            create: {
              albumArtistId: albumArtist?.id,
              date: album.PremiereDate,
              externals: { connectOrCreate: externalsConnectOrCreate },
              genres: { connectOrCreate: genresConnectOrCreate },
              images: { connectOrCreate: imagesConnectOrCreate },
              name: album.Name,
              remoteCreatedAt: album.DateCreated,
              remoteId: album.Id,
              serverFolders: { connect: { id: serverFolder.id } },
              serverId: server.id,
              year: album.ProductionYear,
            },
            update: {
              albumArtistId: albumArtist?.id,
              date: album.PremiereDate,
              deleted: false,
              externals: { connectOrCreate: externalsConnectOrCreate },
              genres: { connectOrCreate: genresConnectOrCreate },
              images: { connectOrCreate: imagesConnectOrCreate },
              name: album.Name,
              remoteCreatedAt: album.DateCreated,
              remoteId: album.Id,
              serverFolders: { connect: { id: serverFolder.id } },
              serverId: server.id,
              year: album.ProductionYear,
            },
            where: {
              uniqueAlbumId: {
                remoteId: album.Id,
                serverId: server.id,
              },
            },
          });
        }

        const currentTask = await prisma.task.findUnique({
          where: { id: task.id },
        });

        const newCount =
          Number(currentTask?.progress || 0) + Number(albums.Items.length);

        await prisma.task.update({
          data: { progress: String(newCount) },
          where: { id: task.id },
        });
      }

      return { task };
    },
    id: taskId,
  });
};

const insertSongGroup = async (
  server: Server,
  serverFolder: ServerFolder,
  songs: JFSong[],
  remoteAlbumId: string
) => {
  const songsUpsert = songs.map((song) => {
    const artistsConnectOrCreate = song.ArtistItems.map((artist) => {
      return {
        create: {
          name: artist.Name,
          remoteId: artist.Id,
          serverFolders: { connect: { id: serverFolder.id } },
          serverId: server.id,
        },
        where: {
          uniqueArtistId: {
            remoteId: artist.Id,
            serverId: server.id,
          },
        },
      };
    });

    const genresConnectOrCreate = song.Genres.map((genre) => {
      return { create: { name: genre }, where: { name: genre } };
    });

    const imagesConnectOrCreate = [];
    for (const [key, value] of Object.entries(song.ImageTags)) {
      imagesConnectOrCreate.push({
        create: { name: key, url: value },
        where: { uniqueImageId: { name: key, url: value } },
      });
    }

    const externalsConnectOrCreate = song.ExternalUrls.map((external) => {
      return {
        create: { name: external.Name, url: external.Url },
        where: {
          uniqueExternalId: { name: external.Name, url: external.Url },
        },
      };
    });

    const pathSplit = song.MediaSources[0].Path.split('/');
    const parentPath = pathSplit.slice(0, pathSplit.length - 1).join('/');

    return {
      create: {
        artists: { connectOrCreate: artistsConnectOrCreate },
        bitRate: Math.floor(song.MediaSources[0].Bitrate / 1000),
        container: song.MediaSources[0].Container,
        date: song.PremiereDate,
        disc: song.ParentIndexNumber,
        duration: Math.floor(song.MediaSources[0].RunTimeTicks / 1e7),
        externals: { connectOrCreate: externalsConnectOrCreate },
        folders: {
          connect: {
            uniqueFolderId: { path: parentPath, serverId: server.id },
          },
        },
        genres: { connectOrCreate: genresConnectOrCreate },
        images: { connectOrCreate: imagesConnectOrCreate },
        name: song.Name,
        remoteCreatedAt: song.DateCreated,
        remoteId: song.Id,
        serverFolders: { connect: { id: serverFolder.id } },
        serverId: server.id,
        track: song.IndexNumber,
        year: song.ProductionYear,
      },
      update: {
        artists: { connectOrCreate: artistsConnectOrCreate },
        bitRate: Math.floor(song.MediaSources[0].Bitrate / 1000),
        container: song.MediaSources[0].Container,
        date: song.PremiereDate,
        disc: song.ParentIndexNumber,
        duration: Math.floor(song.MediaSources[0].RunTimeTicks / 1e7),
        externals: { connectOrCreate: externalsConnectOrCreate },
        folders: {
          connect: {
            uniqueFolderId: { path: parentPath, serverId: server.id },
          },
        },
        genres: { connectOrCreate: genresConnectOrCreate },
        images: { connectOrCreate: imagesConnectOrCreate },
        name: song.Name,
        remoteCreatedAt: song.DateCreated,
        remoteId: song.Id,
        serverFolders: { connect: { id: serverFolder.id } },
        serverId: server.id,
        track: song.IndexNumber,
        year: song.ProductionYear,
      },
      where: {
        uniqueSongId: {
          remoteId: song.Id,
          serverId: server.id,
        },
      },
    };
  });

  const artists = uniqBy(
    songs.flatMap((song) => {
      return song.ArtistItems.map((artist) => ({
        name: artist.Name,
        remoteId: artist.Id,
        serverFolders: { connect: { id: serverFolder.id } },
        serverId: server.id,
      }));
    }),
    'remoteId'
  );

  const uniqueArtistIds = songs
    .flatMap((song) => {
      return song.ArtistItems.flatMap((artist) => artist.Id);
    })
    .filter(uniqueArray);

  const artistsConnect = uniqueArtistIds.map((artistId) => {
    return {
      uniqueArtistId: {
        remoteId: artistId!,
        serverId: server.id,
      },
    };
  });

  artists.forEach(async (artist) => {
    await prisma.artist.upsert({
      create: artist,
      update: artist,
      where: {
        uniqueArtistId: {
          remoteId: artist.remoteId,
          serverId: server.id,
        },
      },
    });
  });

  await prisma.$transaction([
    prisma.artist.updateMany({
      data: { deleted: false },
      where: {
        remoteId: { in: uniqueArtistIds },
        serverId: server.id,
      },
    }),
    prisma.album.update({
      data: {
        artists: { connect: artistsConnect },
        deleted: false,
        songs: { upsert: songsUpsert },
      },
      where: {
        uniqueAlbumId: {
          remoteId: remoteAlbumId,
          serverId: server.id,
        },
      },
    }),
  ]);
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

  // Fetch in chunks
  const songCount = check.TotalRecordCount;
  const chunkSize = 10000;
  const songChunkCount = Math.ceil(songCount / chunkSize);
  const taskId = `[${server.name} (${serverFolder.name})] songs`;

  q.push({
    fn: async () => {
      await prisma.task.update({
        data: { message: 'Scanning songs' },
        where: { id: task.id },
      });

      for (let i = 0; i < songChunkCount; i += 1) {
        const songs = await jellyfinApi.getSongs(server, {
          enableImageTypes: 'Primary,Logo,Backdrop',
          enableUserData: false,
          fields: 'Genres,DateCreated,ExternalUrls,MediaSources',
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

        const folderSave: any[] = [];

        for (let f = 0; f < uniqueFolders.length; f += 1) {
          const t = await prisma.folder.upsert({
            create: {
              name: uniqueFolders[f].name,
              path: uniqueFolders[f].path,
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
              name: uniqueFolders[f].name,
              path: uniqueFolders[f].path,
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
                path: uniqueFolders[f].path,
                serverId: server.id,
              },
            },
          });

          folderSave.push(t);
        }

        folderSave.forEach(async (f) => {
          if (f.parentId) return;

          const pathSplit = f.path.split('/');
          const parentPath = pathSplit.slice(0, pathSplit.length - 1).join('/');

          const parentPathData = folderSave.find(
            (save) => save.path === parentPath
          );

          if (parentPathData) {
            await prisma.folder.update({
              data: {
                parentId: parentPathData.id,
              },
              where: { id: f.id },
            });
          }
        });

        const albumSongGroups = groupByProperty(songs.Items, 'AlbumId');

        const keys = Object.keys(albumSongGroups);

        for (let b = 0; b < keys.length; b += 1) {
          const songGroup = albumSongGroups[keys[b]];
          await insertSongGroup(server, serverFolder, songGroup, keys[b]);

          const currentTask = await prisma.task.findUnique({
            where: { id: task.id },
          });

          const newCount =
            Number(currentTask?.progress || 0) + Number(songGroup.length);

          await prisma.task.update({
            data: { progress: String(newCount) },
            where: { id: task.id },
          });
        }
      }

      return { completed: true, task };
    },
    id: taskId,
  });
};

const checkDeleted = async (
  server: Server,
  serverFolder: ServerFolder,
  task: Task
) => {
  q.push({
    fn: async () => {
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
    },
    id: `${task.id}-difference`,
  });
};

const scanAll = async (
  server: Server,
  serverFolder: ServerFolder,
  task: Task
) => {
  await scanGenres(server, serverFolder, task);
  await scanAlbumArtists(server, serverFolder, task);
  await scanAlbums(server, serverFolder, task);
  await scanSongs(server, serverFolder, task);
  await checkDeleted(server, serverFolder, task);
  await completeTask(task);
};

export const jellyfinTasks = {
  scanAlbumArtists,
  scanAlbums,
  scanAll,
  scanGenres,
  scanSongs,
};
