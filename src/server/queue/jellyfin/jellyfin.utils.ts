import {
  ExternalSource,
  ExternalType,
  ImageType,
  Prisma,
  Server,
  ServerFolder,
} from '@prisma/client';
import uniqBy from 'lodash/uniqBy';
import { prisma } from '../../lib';
import { uniqueArray } from '../../utils';
import {
  JFAlbum,
  JFAlbumArtist,
  JFExternalType,
  JFImageType,
  JFSong,
} from './jellyfin.types';

const insertGenres = async (items: JFSong[] | JFAlbum[] | JFAlbumArtist[]) => {
  const genresCreateMany = items
    .flatMap((item) => item.GenreItems)
    .map((genre) => ({ name: genre.Name }));

  await prisma.genre.createMany({
    data: genresCreateMany,
    skipDuplicates: true,
  });
};

const insertArtists = async (
  server: Server,
  serverFolder: ServerFolder,
  items: JFSong[] | JFAlbum[]
) => {
  const artistItems = uniqBy(
    items.flatMap((item) => item.ArtistItems),
    'Id'
  );

  const createMany = artistItems.map((artist) => ({
    name: artist.Name,
    remoteId: artist.Id,
    serverId: server.id,
    sortName: artist.Name,
  }));

  await prisma.artist.createMany({
    data: createMany,
    skipDuplicates: true,
  });

  for (const artist of artistItems) {
    await prisma.artist.update({
      data: { serverFolders: { connect: { id: serverFolder.id } } },
      where: {
        uniqueArtistId: {
          remoteId: artist.Id,
          serverId: server.id,
        },
      },
    });
  }
};

const insertImages = async (items: JFSong[] | JFAlbum[] | JFAlbumArtist[]) => {
  const imageItems = uniqBy(
    items.flatMap((item) => item.ImageTags),
    'Id'
  );

  const createMany: Prisma.ImageCreateManyInput[] = [];

  for (const image of imageItems) {
    if (image.Logo) {
      createMany.push({
        remoteUrl: image.Logo,
        type: ImageType.LOGO,
      });
    }
    if (image.Primary) {
      createMany.push({
        remoteUrl: image.Primary,
        type: ImageType.PRIMARY,
      });
    }
  }

  await prisma.image.createMany({
    data: createMany,
    skipDuplicates: true,
  });
};

const insertExternals = async (
  items: JFSong[] | JFAlbum[] | JFAlbumArtist[]
) => {
  const externalItems = uniqBy(
    items.flatMap((item) => item.ExternalUrls),
    'Url'
  );
  const createMany: Prisma.ExternalCreateManyInput[] = [];

  for (const external of externalItems) {
    if (
      external.Name === JFExternalType.MUSICBRAINZ ||
      external.Name === JFExternalType.THEAUDIODB
    ) {
      const source =
        external.Name === JFExternalType.MUSICBRAINZ
          ? ExternalSource.MUSICBRAINZ
          : ExternalSource.THEAUDIODB;

      const value = external.Url.split('/').pop() || '';

      createMany.push({ source, type: ExternalType.ID, value });
    }
  }

  await prisma.external.createMany({
    data: createMany,
    skipDuplicates: true,
  });
};

const insertSongGroup = async (
  server: Server,
  serverFolder: ServerFolder,
  songs: JFSong[],
  remoteAlbumId: string
) => {
  const remoteAlbumArtist =
    songs[0].AlbumArtists.length > 0 ? songs[0].AlbumArtists[0] : undefined;

  let albumArtist = remoteAlbumArtist?.Id
    ? await prisma.albumArtist.findUnique({
        where: {
          uniqueAlbumArtistId: {
            remoteId: remoteAlbumArtist.Id,
            serverId: server.id,
          },
        },
      })
    : undefined;

  // If Jellyfin returns an invalid album artist, we'll just use the first matching one
  if (remoteAlbumArtist && !albumArtist) {
    albumArtist = await prisma.albumArtist.findFirst({
      where: {
        name: remoteAlbumArtist?.Name,
        serverId: server.id,
      },
    });
  }

  const albumArtistId = albumArtist ? albumArtist.id : undefined;

  const songsUpsert: Prisma.SongUpsertWithWhereUniqueWithoutAlbumInput[] =
    songs.map((song) => {
      const genresConnect = song.Genres.map((genre) => ({ name: genre }));

      const artistsConnect = song.ArtistItems.map((artist) => ({
        uniqueArtistId: {
          remoteId: artist.Id,
          serverId: server.id,
        },
      }));

      const externalsConnect = song.ExternalUrls.map((external) => ({
        uniqueExternalId: {
          source:
            external.Name === JFExternalType.MUSICBRAINZ
              ? ExternalSource.MUSICBRAINZ
              : ExternalSource.THEAUDIODB,
          value: external.Url.split('/').pop() || '',
        },
      }));

      const imagesConnectOrCreate = [];
      for (const [key, value] of Object.entries(song.ImageTags)) {
        if (key === JFImageType.PRIMARY) {
          imagesConnectOrCreate.push({
            create: {
              remoteUrl: value,
              type: ImageType.PRIMARY,
            },
            where: {
              uniqueImageId: { remoteUrl: value, type: ImageType.PRIMARY },
            },
          });
        }
        if (key === JFImageType.LOGO) {
          imagesConnectOrCreate.push({
            create: {
              remoteUrl: value,
              type: ImageType.LOGO,
            },
            where: {
              uniqueImageId: { remoteUrl: value, type: ImageType.LOGO },
            },
          });
        }
      }

      const pathSplit = song.MediaSources[0].Path.split('/');
      const parentPath = pathSplit.slice(0, pathSplit.length - 1).join('/');

      return {
        create: {
          albumArtistId,
          artists: { connect: artistsConnect },
          bitRate: Math.floor(song.MediaSources[0].Bitrate / 1e3),
          container: song.MediaSources[0].Container,
          deleted: false,
          discNumber: song.ParentIndexNumber,
          duration: Math.floor(song.MediaSources[0].RunTimeTicks / 1e7),
          externals: { connect: externalsConnect },
          folders: {
            connect: {
              uniqueFolderId: { path: parentPath, serverId: server.id },
            },
          },
          genres: { connect: genresConnect },
          images: { connectOrCreate: imagesConnectOrCreate },
          name: song.Name,
          releaseDate: song.PremiereDate,
          releaseYear: song.ProductionYear,
          remoteCreatedAt: song.DateCreated,
          remoteId: song.Id,
          serverFolders: { connect: { id: serverFolder.id } },
          serverId: server.id,
          size: song.MediaSources[0].Size,
          sortName: song.Name,
          trackNumber: song.IndexNumber,
        },
        update: {
          albumArtistId,
          artists: { connect: artistsConnect },
          bitRate: Math.floor(song.MediaSources[0].Bitrate / 1e3),
          container: song.MediaSources[0].Container,
          deleted: false,
          discNumber: song.ParentIndexNumber,
          duration: Math.floor(song.MediaSources[0].RunTimeTicks / 1e7),
          externals: { connect: externalsConnect },
          folders: {
            connect: {
              uniqueFolderId: { path: parentPath, serverId: server.id },
            },
          },
          genres: { connect: genresConnect },
          images: { connectOrCreate: imagesConnectOrCreate },
          name: song.Name,
          releaseDate: song.PremiereDate,
          releaseYear: song.ProductionYear,
          remoteCreatedAt: song.DateCreated,
          remoteId: song.Id,
          serverFolders: { connect: { id: serverFolder.id } },
          serverId: server.id,
          size: song.MediaSources[0].Size,
          sortName: song.Name,
          trackNumber: song.IndexNumber,
        },
        where: {
          uniqueSongId: {
            remoteId: song.Id,
            serverId: server.id,
          },
        },
      };
    });

  const uniqueArtistIds = songs
    .flatMap((song) => song.ArtistItems.flatMap((artist) => artist.Id))
    .filter(uniqueArray);

  const artistsConnect = uniqueArtistIds.map((artistId) => ({
    uniqueArtistId: {
      remoteId: artistId,
      serverId: server.id,
    },
  }));

  await prisma.album.update({
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
  });
};

export const jellyfinUtils = {
  insertArtists,
  insertExternals,
  insertGenres,
  insertImages,
  insertSongGroup,
};
