/* eslint-disable no-await-in-loop */
import { Server, ServerFolder, Task } from '@prisma/client';
import { prisma, throttle } from '../../lib';
import { groupByProperty, uniqueArray } from '../../utils';
import { subsonicApi } from './subsonic.api';
import { SSAlbumListEntry } from './subsonic.types';

export const scanGenres = async (
  server: Server,
  serverFolder: ServerFolder
) => {
  const res = await subsonicApi.getGenres(server);

  const genres = res.genres.genre.map((genre) => {
    return { name: genre.value };
  });

  const createdGenres = await prisma.genre.createMany({
    data: genres,
    skipDuplicates: true,
  });

  const message = `Imported ${createdGenres.count} new genres.`;
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
        serverId: server.id,
      },
      update: {
        name: artist.name,
        remoteId: artist.id,
        serverId: server.id,
      },
      where: {
        uniqueAlbumArtistId: {
          remoteId: artist.id,
          serverId: server.id,
        },
      },
    });

    await prisma.artist.upsert({
      create: {
        name: artist.name,
        remoteId: artist.id,
        serverId: server.id,
      },
      update: {
        name: artist.name,
        remoteId: artist.id,
        serverId: server.id,
      },
      where: {
        uniqueArtistId: {
          remoteId: artist.id,
          serverId: server.id,
        },
      },
    });
  }

  const message = `Scanned ${artists.length} album artists.`;
};

export const scanAlbums = async (
  server: Server,
  serverFolder: ServerFolder
) => {
  const promises: any[] = [];
  const albums = await subsonicApi.getAlbums(server, {
    musicFolderId: serverFolder.id,
    offset: 0,
    size: 500,
    type: 'newest',
  });

  const albumArtistGroups = groupByProperty(albums, 'artistId');

  const addAlbums = async (
    a: SSAlbumListEntry[],
    albumArtistRemoteId: string
  ) => {
    const albumArtist = await prisma.albumArtist.findUnique({
      where: {
        uniqueAlbumArtistId: {
          remoteId: albumArtistRemoteId,
          serverId: server.id,
        },
      },
    });

    if (albumArtist) {
      a.forEach(async (album) => {
        const imagesConnectOrCreate = album.coverArt
          ? {
              create: { name: 'Primary', url: album.coverArt },
              where: {
                uniqueImageId: { name: 'Primary', url: album.coverArt },
              },
            }
          : [];

        await prisma.album.upsert({
          create: {
            albumArtistId: albumArtist.id,
            images: { connectOrCreate: imagesConnectOrCreate },
            name: album.title,
            remoteCreatedAt: album.created,
            remoteId: album.id,
            serverId: server.id,
            year: album.year,
          },
          update: {
            albumArtistId: albumArtist.id,
            images: { connectOrCreate: imagesConnectOrCreate },
            name: album.title,
            remoteCreatedAt: album.created,
            remoteId: album.id,
            serverId: server.id,
            year: album.year,
          },
          where: {
            uniqueAlbumId: {
              remoteId: album.id,
              serverId: server.id,
            },
          },
        });
      });
    }
  };

  Object.keys(albumArtistGroups).forEach((key) => {
    promises.push(addAlbums(albumArtistGroups[key], key));
  });

  await Promise.all(promises);

  const message = `Scanned ${albums.length} albums.`;
};

const throttledAlbumFetch = throttle(
  async (server: Server, serverFolder: ServerFolder, album: any, i: number) => {
    const albumRes = await subsonicApi.getAlbum(server, album.remoteId);

    console.log('fetch', i);

    if (albumRes) {
      const songsUpsert = albumRes.album.song.map((song) => {
        const genresConnectOrCreate = song.genre
          ? {
              create: { name: song.genre },
              where: { name: song.genre },
            }
          : [];

        const imagesConnectOrCreate = song.coverArt
          ? {
              create: { name: 'Primary', url: song.coverArt },
              where: { uniqueImageId: { name: 'Primary', url: song.coverArt } },
            }
          : [];

        const artistsConnect = song.artistId
          ? {
              uniqueArtistId: {
                remoteId: song.artistId,
                serverId: server.id,
              },
            }
          : [];

        return {
          create: {
            artistName: !song.artistId ? song.artist : undefined,
            artists: { connect: artistsConnect },
            bitRate: song.bitRate,
            container: song.suffix,
            disc: song.discNumber,
            duration: song.duration,
            genres: { connectOrCreate: genresConnectOrCreate },
            images: { connectOrCreate: imagesConnectOrCreate },
            name: song.title,
            remoteCreatedAt: song.created,
            remoteId: song.id,
            serverId: server.id,
            track: song.track,
            year: song.year,
          },
          update: {
            artistName: !song.artistId ? song.artist : undefined,
            artists: { connect: artistsConnect },
            bitRate: song.bitRate,
            container: song.suffix,
            disc: song.discNumber,
            duration: song.duration,
            genres: { connectOrCreate: genresConnectOrCreate },
            images: { connectOrCreate: imagesConnectOrCreate },
            name: song.title,
            remoteCreatedAt: song.created,
            remoteId: song.id,
            track: song.track,
            year: song.year,
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

      try {
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
      } catch (err) {
        console.log(err);
      }
    }
  }
);

export const scanAlbumDetail = async (
  server: Server,
  serverFolder: ServerFolder
) => {
  const taskId = `[${server.name} (${serverFolder.name})] albums detail`;

  const promises = [];
  const dbAlbums = await prisma.album.findMany({
    where: {
      serverId: server.id,
    },
  });

  for (let i = 0; i < dbAlbums.length; i += 1) {
    promises.push(throttledAlbumFetch(server, serverFolder, dbAlbums[i], i));
  }

  await Promise.all(promises);
  const message = `Scanned ${dbAlbums.length} albums.`;
};

const throttledArtistDetailFetch = throttle(
  async (
    server: Server,
    artistId: number,
    artistRemoteId: string,
    i: number
  ) => {
    console.log('artisdetail', i);

    const artistInfo = await subsonicApi.getArtistInfo(server, artistRemoteId);

    const externalsConnectOrCreate = [];
    if (artistInfo.artistInfo2.lastFmUrl) {
      externalsConnectOrCreate.push({
        create: {
          name: 'Last.fm',
          url: artistInfo.artistInfo2.lastFmUrl,
        },
        where: {
          uniqueExternalId: {
            name: 'Last.fm',
            url: artistInfo.artistInfo2.lastFmUrl,
          },
        },
      });
    }

    if (artistInfo.artistInfo2.musicBrainzId) {
      externalsConnectOrCreate.push({
        create: {
          name: 'MusicBrainz',
          url: `https://musicbrainz.org/artist/${artistInfo.artistInfo2.musicBrainzId}`,
        },
        where: {
          uniqueExternalId: {
            name: 'MusicBrainz',
            url: `https://musicbrainz.org/artist/${artistInfo.artistInfo2.musicBrainzId}`,
          },
        },
      });
    }

    try {
      await prisma.albumArtist.update({
        data: {
          biography: artistInfo.artistInfo2.biography,
          externals: { connectOrCreate: externalsConnectOrCreate },
        },
        where: { id: artistId },
      });
    } catch (err) {
      console.log(err);
    }
  }
);

export const scanAlbumArtistDetail = async (
  server: Server,
  serverFolder: ServerFolder
) => {
  const taskId = `[${server.name} (${serverFolder.name})] artists detail`;

  const promises = [];
  const dbArtists = await prisma.albumArtist.findMany({
    where: {
      serverId: server.id,
    },
  });

  for (let i = 0; i < dbArtists.length; i += 1) {
    promises.push(
      throttledArtistDetailFetch(
        server,
        dbArtists[i].id,
        dbArtists[i].remoteId,
        i
      )
    );
  }
};

const scanAll = async (
  server: Server,
  serverFolder: ServerFolder,
  task: Task
) => {
  await scanGenres(server, serverFolder);
  await scanAlbumArtists(server, serverFolder);
  await scanAlbumArtistDetail(server, serverFolder);
  await scanAlbums(server, serverFolder);
  await scanAlbumDetail(server, serverFolder);
};

export const subsonicScanner = {
  scanAll,
  scanGenres,
};
