/* eslint-disable no-underscore-dangle */
import meanBy from 'lodash/meanBy';
import { Item, Rating, User } from '../types/types';
import { getImageUrl } from '../utils';

const getSubsonicStreamUrl = (
  remoteId: string,
  url: string,
  token: string,
  deviceId: string
) => {
  return (
    `${url}/rest/stream.view` +
    `?id=${remoteId}` +
    `&${token}` +
    `&v=1.13.0` +
    `&c=sonixd_${deviceId}`
  );
};

const getJellyfinStreamUrl = (
  remoteId: string,
  url: string,
  token: string,
  userId: string,
  deviceId: string
) => {
  return (
    `${url}/audio` +
    `/${remoteId}/universal` +
    `?userId=${userId}` +
    `&audioCodec=aac` +
    `&container=opus,mp3,aac,m4a,m4b,flac,wav,ogg` +
    `&transcodingContainer=ts` +
    `&transcodingProtocol=hls` +
    `&deviceId=sonixd_${deviceId}` +
    `&playSessionId=${deviceId}` +
    `&api_key=${token}`
  );
};

const streamUrl = (
  serverType: string,
  args: {
    deviceId: string;
    remoteId: string;
    token: string;
    url: string;
    userId?: string;
  }
) => {
  if (serverType === 'jellyfin') {
    return getJellyfinStreamUrl(
      args.remoteId,
      args.url,
      args.token,
      args.userId || '',
      args.deviceId
    );
  }

  if (serverType === 'subsonic') {
    return getSubsonicStreamUrl(
      args.remoteId,
      args.url,
      args.token,
      args.deviceId
    );
  }

  return '';
};

const relatedAlbum = (item: any) => {
  return {
    deleted: item.deleted,
    id: item.id,
    itemType: Item.ALBUM,
    name: item.name,
    remoteId: item.remoteId,
  };
};

const relatedArtists = (items: any[]) => {
  return (
    items?.map((item: any) => {
      return {
        deleted: item.deleted,
        id: item.id,
        itemType: Item.ARTIST,
        name: item.name,
        remoteId: item.remoteId,
      };
    }) || []
  );
};

const relatedAlbumArtist = (item: any) => {
  return {
    deleted: item.deleted,
    id: item.id,
    itemType: item.ALBUMARTIST,
    name: item.name,
    remoteId: item.remoteId,
  };
};
const relatedGenres = (genres: any[]) => {
  return (
    genres?.map((genre) => {
      return {
        id: genre.id,
        itemType: Item.GENRE,
        name: genre.name,
      };
    }) || []
  );
};

const primaryImage = (
  images: any[],
  serverType: string,
  url: string,
  remoteId: string
) => {
  const primaryImageId = images.find((i: any) => i.name === 'Primary')?.url;
  const image = !primaryImageId ? '' : getImageUrl(serverType, url, remoteId);

  return image;
};

const songs = (
  items: any[],
  options: {
    deviceId: string;
    imageUrl?: string;
    serverFolderId?: number;
    serverType?: string;
    token: string;
    url?: string;
    userId: string;
  }
) => {
  return (
    items?.map((item: any) => {
      const serverType = options.serverType
        ? options?.serverType
        : item.server.serverType;

      const url = options.url ? options.url : item.server.serverUrls[0];

      return {
        album: item.album && relatedAlbum(item.album),
        artistName: item.artistName,
        artists: relatedArtists(item.artists),
        bitRate: item.bitRate,
        container: item.container,
        createdAt: item.createdAt,
        date: item.date,
        deleted: item.deleted,
        disc: item.disc,
        duration: item.duration,
        genres: relatedGenres(item.genres),
        id: item.id,
        imageUrl:
          primaryImage(item.images, serverType, url, item.remoteId) ||
          options.imageUrl,
        itemType: Item.SONG,
        name: item.name,
        remoteCreatedAt: item.remoteCreatedAt,
        remoteId: item.remoteId,
        serverFolderId: item.serverFolderId,
        serverId: item.serverId,
        streamUrl: streamUrl(serverType, {
          deviceId: options.deviceId,
          remoteId: item.remoteId,
          token: options.token,
          url,
          userId: options.userId,
        }),
        track: item.track,
        updatedAt: item.updatedAt,
        year: item.year,
      };
    }) || []
  );
};

const albums = (items: any[], user: User) => {
  return (
    items?.map((item: any) => {
      const { serverType, token, remoteUserId } = item.server;
      const { url } = item.server.serverUrls[0];
      const rating = item.ratings.find(
        (r: Rating) => r.userId === user.id
      )?.value;
      const averageRating = meanBy(item.ratings, 'value');
      const imageUrl = primaryImage(
        item.images,
        serverType,
        url,
        item.remoteId
      );

      return {
        albumArtist: item.albumArtist && relatedAlbumArtist(item.albumArtist),
        averageRating,
        createdAt: item.createdAt,
        date: item.date,
        deleted: item.deleted,
        genres: relatedGenres(item.genres),
        id: item.id,
        imageUrl,
        itemType: Item.ALBUM,
        name: item.name,
        rating,
        remoteCreatedAt: item.remoteCreatedAt,
        remoteId: item.remoteId,
        serverFolderId: item.serverFolderId,
        serverType,
        songCount: item._count.songs,
        songs: songs(item.songs, {
          deviceId: user.deviceId,
          imageUrl,
          serverFolderId: item.serverFolderId,
          serverType,
          token,
          url,
          userId: remoteUserId,
        }),
        updatedAt: item.updatedAt,
        year: item.year,
      };
    }) || []
  );
};

export const toRes = {
  albums,
  songs,
};
