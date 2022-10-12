import {
  ExternalSource,
  ExternalType,
  ImageType,
  Prisma,
  Server,
  ServerFolder,
} from '@prisma/client';
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
  const artistItems = items.flatMap((item) => item.ArtistItems);

  const createMany = artistItems.map((artist) => ({
    name: artist.Name,
    remoteId: artist.Id,
    serverId: server.id,
    sortName: '',
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
  const imageItems = items.flatMap((item) => item.ImageTags);

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
  const externalItems = items.flatMap((item) => item.ExternalUrls);
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

      const imagesConnect = [];
      for (const [key, value] of Object.entries(song.ImageTags)) {
        if (key === JFImageType.PRIMARY) {
          imagesConnect.push({
            uniqueImageId: { remoteUrl: value, type: ImageType.PRIMARY },
          });
        }
        if (key === JFImageType.LOGO) {
          imagesConnect.push({
            uniqueImageId: { remoteUrl: value, type: ImageType.LOGO },
          });
        }
      }

      const pathSplit = song.MediaSources[0].Path.split('/');
      const parentPath = pathSplit.slice(0, pathSplit.length - 1).join('/');

      return {
        create: {
          artists: { connect: artistsConnect },
          bitRate: Math.floor(song.MediaSources[0].Bitrate / 1e3),
          container: song.MediaSources[0].Container,
          discNumber: song.ParentIndexNumber,
          duration: Math.floor(song.MediaSources[0].RunTimeTicks / 1e7),
          externals: { connect: externalsConnect },
          folders: {
            connect: {
              uniqueFolderId: { path: parentPath, serverId: server.id },
            },
          },
          genres: { connect: genresConnect },
          images: { connect: imagesConnect },
          name: song.Name,
          releaseDate: song.PremiereDate,
          releaseYear: song.ProductionYear,
          remoteCreatedAt: song.DateCreated,
          remoteId: song.Id,
          serverFolders: { connect: { id: serverFolder.id } },
          serverId: server.id,
          size: String(song.MediaSources[0].Size),
          sortName: song.Name,
          trackNumber: song.IndexNumber,
        },
        update: {
          artists: { connect: artistsConnect },
          bitRate: Math.floor(song.MediaSources[0].Bitrate / 1e3),
          container: song.MediaSources[0].Container,
          discNumber: song.ParentIndexNumber,
          duration: Math.floor(song.MediaSources[0].RunTimeTicks / 1e7),
          externals: { connect: externalsConnect },
          folders: {
            connect: {
              uniqueFolderId: { path: parentPath, serverId: server.id },
            },
          },
          genres: { connect: genresConnect },
          images: { connect: imagesConnect },
          name: song.Name,
          releaseDate: song.PremiereDate,
          releaseYear: song.ProductionYear,
          remoteCreatedAt: song.DateCreated,
          remoteId: song.Id,
          serverFolders: { connect: { id: serverFolder.id } },
          serverId: server.id,
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

  // const artists = uniqBy(
  //   songs.flatMap((song) => {
  //     return song.ArtistItems.map((artist) => ({
  //       deleted: false,
  //       name: artist.Name,
  //       remoteId: artist.Id,
  //       serverFolders: { connect: { id: serverFolder.id } },
  //       serverId: server.id,
  //       sortName: '',
  //     }));
  //   }),
  //   'remoteId'
  // );

  // for (const artist of artists) {
  //   await prisma.artist.upsert({
  //     create: artist,
  //     update: artist,
  //     where: {
  //       uniqueArtistId: {
  //         remoteId: artist.remoteId,
  //         serverId: server.id,
  //       },
  //     },
  //   });
  // }

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
