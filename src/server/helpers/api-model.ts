/* eslint-disable no-underscore-dangle */
import {
  Album,
  AlbumArtist,
  AlbumArtistRating,
  AlbumRating,
  Artist,
  ArtistRating,
  External,
  Genre,
  Image,
  ImageType,
  Server,
  ServerFolder,
  ServerFolderPermission,
  ServerPermission,
  ServerType,
  ServerUrl,
  Song,
  SongRating,
  User,
  UserServerUrl,
} from '@prisma/client';

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
  type: ServerType,
  args: {
    deviceId: string;
    remoteId: string;
    token: string;
    url: string;
    userId?: string;
  }
) => {
  if (type === ServerType.JELLYFIN) {
    return getJellyfinStreamUrl(
      args.remoteId,
      args.url,
      args.token,
      args.userId || '',
      args.deviceId
    );
  }
  return getSubsonicStreamUrl(
    args.remoteId,
    args.url,
    args.token,
    args.deviceId
  );
};

const imageUrl = (
  type: ServerType,
  baseUrl: string,
  imageId: string,
  token?: string
) => {
  if (type === ServerType.JELLYFIN) {
    return (
      `${baseUrl}/Items` +
      `/${imageId}` +
      `/Images/Primary` +
      '?fillHeight=250' +
      `&fillWidth=250` +
      '&quality=90'
    );
  }

  if (type === ServerType.SUBSONIC || type === ServerType.NAVIDROME) {
    return (
      `${baseUrl}/rest/getCoverArt.view` +
      `?id=${imageId}` +
      `&size=250` +
      `&v=1.13.0` +
      `&c=sonixd` +
      `&${token}`
    );
  }

  return null;
};

const relatedAlbum = (item: Album) => {
  return {
    /* eslint-disable sort-keys-fix/sort-keys-fix */
    id: item.id,
    name: item.name,
    remoteId: item.remoteId,
    deleted: item.deleted,
    /* eslint-enable sort-keys-fix/sort-keys-fix */
  };
};

const relatedArtists = (items: Artist[]) => {
  return (
    items?.map((item) => {
      return {
        /* eslint-disable sort-keys-fix/sort-keys-fix */
        id: item.id,
        name: item.name,
        remoteId: item.remoteId,
        deleted: item.deleted,
        /* eslint-enable sort-keys-fix/sort-keys-fix */
      };
    }) || []
  );
};

const relatedAlbumArtists = (items: AlbumArtist[]) => {
  return (
    items?.map((item) => {
      return {
        /* eslint-disable sort-keys-fix/sort-keys-fix */
        id: item.id,
        name: item.name,
        remoteId: item.remoteId,
        deleted: item.deleted,
        /* eslint-enable sort-keys-fix/sort-keys-fix */
      };
    }) || []
  );
};

const relatedGenres = (items: Genre[]) => {
  return (
    items?.map((item) => {
      return {
        /* eslint-disable sort-keys-fix/sort-keys-fix */
        id: item.id,
        name: item.name,
        /* eslint-enable sort-keys-fix/sort-keys-fix */
      };
    }) || []
  );
};

const relatedServerFolders = (items: ServerFolder[]) => {
  const serverFolders = items?.map((item) => {
    return {
      /* eslint-disable sort-keys-fix/sort-keys-fix */
      id: item.id,
      name: item.name,
      remoteId: item.remoteId,
      lastScannedAt: item.lastScannedAt,
      /* eslint-enable sort-keys-fix/sort-keys-fix */
    };
  });

  return serverFolders || [];
};

const relatedServerUrls = (
  items: (ServerUrl & {
    userServerUrls?: UserServerUrl[];
  })[]
) => {
  const serverUrls = items?.map((item) => {
    const userServerUrlIds = item.userServerUrls?.map(
      (userServerUrl) => userServerUrl.serverUrlId
    );
    const enabled = userServerUrlIds?.some((id) => id === item.id);

    return {
      /* eslint-disable sort-keys-fix/sort-keys-fix */
      id: item.id,
      url: item.url,
      enabled,
      /* eslint-enable sort-keys-fix/sort-keys-fix */
    };
  });

  return serverUrls || [];
};

const rating = (
  items: AlbumRating[] | SongRating[] | ArtistRating[] | AlbumArtistRating[]
) => {
  if (items.length > 0) {
    return items[0].value;
  }

  return null;
};

const image = (
  images: Image[],
  type: ServerType,
  imageType: ImageType,
  url: string,
  remoteId: string,
  token?: string
) => {
  const imageRemoteUrl = images.find((i) => i.type === imageType)?.remoteUrl;

  if (!imageRemoteUrl) return null;
  if (type === ServerType.JELLYFIN) {
    return imageUrl(type, url, remoteId);
  }

  if (type === ServerType.SUBSONIC || type === ServerType.NAVIDROME) {
    return imageUrl(type, url, imageRemoteUrl, token);
  }

  return null;
};

type DbSong = Song & DbSongInclude;

type DbSongInclude = {
  album: Album;
  artists: Artist[];
  externals: External[];
  genres: Genre[];
  images: Image[];
  ratings: SongRating[];
  server: Server & { serverUrls: ServerUrl[] };
};

const songs = (
  items: DbSong[],
  options: {
    deviceId: string;
    imageUrl?: string;
    serverFolderId?: number;
    token: string;
    type: ServerType;
    url: string;
    userId: string;
  }
) => {
  return (
    items?.map((item) => {
      const url = options.url ? options.url : item.server.serverUrls[0].url;

      const stream = streamUrl(options.type, {
        deviceId: options.deviceId,
        remoteId: item.remoteId,
        token: options.token,
        url: options.url,
        userId: options.userId,
      });

      return {
        /* eslint-disable sort-keys-fix/sort-keys-fix */
        id: item.id,
        name: item.name,
        artistName: item.artistName,
        album: item.album && relatedAlbum(item.album),
        artists: relatedArtists(item.artists),
        bitRate: item.bitRate,
        container: item.container,
        createdAt: item.createdAt,
        deleted: item.deleted,
        discNumber: item.discNumber,
        duration: item.duration,
        genres: relatedGenres(item.genres),
        imageUrl: image(
          item.images,
          options.type,
          ImageType.PRIMARY,
          url,
          item.remoteId
        ),
        releaseDate: item.releaseDate,
        releaseYear: item.releaseYear,
        remoteCreatedAt: item.remoteCreatedAt,
        remoteId: item.remoteId,
        // serverFolderId: item.serverFolderId,
        serverId: item.serverId,
        streamUrl: stream,
        trackNumber: item.trackNumber,
        updatedAt: item.updatedAt,
        /* eslint-enable sort-keys-fix/sort-keys-fix */
      };
    }) || []
  );
};

type DbAlbum = Album & DbAlbumInclude;

type DbAlbumInclude = {
  _count: {
    favorites: number;
    songs: number;
  };
  albumArtists: AlbumArtist[];
  genres: Genre[];
  images: Image[];
  ratings: AlbumRating[];
  server: Server;
  serverFolders: ServerFolder[];
  songs?: DbSong[];
};

const albums = (options: {
  items: DbAlbum[] | any[];
  serverUrl?: string;
  user: User;
}) => {
  const { items, serverUrl, user } = options;
  return (
    items?.map((item) => {
      const { type, token, remoteUserId } = item.server;
      const url = serverUrl || item.server.url;

      return {
        /* eslint-disable sort-keys-fix/sort-keys-fix */
        id: item.id,
        name: item.name,
        sortName: item.sortName,
        releaseDate: item.releaseDate,
        releaseYear: item.releaseYear,
        isFavorite: item.favorites.length === 1,
        rating: rating(item.ratings),
        songCount: item._count.songs,
        type,
        imageUrl: image(
          item.images,
          type,
          ImageType.PRIMARY,
          url,
          item.remoteId
        ),
        backdropImageUrl: image(
          item.images,
          type,
          ImageType.BACKDROP,
          url,
          item.remoteId
        ),
        deleted: item.deleted,
        remoteId: item.remoteId,
        remoteCreatedAt: item.remoteCreatedAt,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        genres: item.genres ? relatedGenres(item.genres) : [],
        albumArtists: item.albumArtists
          ? relatedAlbumArtists(item.albumArtists)
          : [],
        artists: item.artists ? relatedArtists(item.artists) : [],
        serverFolders: relatedServerFolders(item.serverFolders),
        songs:
          item.songs &&
          songs(item.songs, {
            deviceId: user.deviceId,
            token,
            type,
            url,
            userId: remoteUserId,
          }),
        /* eslint-enable sort-keys-fix/sort-keys-fix */
      };
    }) || []
  );
};

// const relatedServerCredentials = (items: ServerCredential[]) => {
//   return (
//     items.map((item) => {
//       return {
//         /* eslint-disable sort-keys-fix/sort-keys-fix */
//         id: item.id,
//         enabled: item.enabled,
//         username: item.username,
//         credential: item.credential,
//         /* eslint-enable sort-keys-fix/sort-keys-fix */
//       };
//     }) || []
//   );
// };

// const serverCredentials = (items: ServerCredential[]) => {
//   return (
//     items.map((item) => {
//       return {
//         /* eslint-disable sort-keys-fix/sort-keys-fix */
//         id: item.id,
//         username: item.username,
//         enabled: item.enabled,
//         credential: item.credential,
//         createdAt: item.createdAt,
//         updatedAt: item.updatedAt,
//         /* eslint-enable sort-keys-fix/sort-keys-fix */
//       };
//     }) || []
//   );
// };

const servers = (
  items: (Server & {
    serverFolders?: ServerFolder[];
    serverUrls?: (ServerUrl & {
      userServerUrls?: UserServerUrl[];
    })[];
  })[]
) => {
  return (
    items.map((item) => {
      return {
        /* eslint-disable sort-keys-fix/sort-keys-fix */
        id: item.id,
        name: item.name,
        url: item.url,
        type: item.type,
        username: item.username,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        serverFolders:
          item.serverFolders && relatedServerFolders(item.serverFolders),
        serverUrls: item.serverUrls && relatedServerUrls(item.serverUrls),
        /* eslint-enable sort-keys-fix/sort-keys-fix */
      };
    }) || []
  );
};

const relatedServerFolderPermissions = (items: ServerFolderPermission[]) => {
  return items.map((item) => {
    return {
      /* eslint-disable sort-keys-fix/sort-keys-fix */
      id: item.id,
      serverFolderId: item.serverFolderId,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      /* eslint-enable sort-keys-fix/sort-keys-fix */
    };
  });
};

const relatedServerPermissions = (items: ServerPermission[]) => {
  return items.map((item) => {
    return {
      /* eslint-disable sort-keys-fix/sort-keys-fix */
      id: item.id,
      type: item.type,
      serverId: item.serverId,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      /* eslint-enable sort-keys-fix/sort-keys-fix */
    };
  });
};

const users = (
  items: (User & {
    accessToken?: string;
    refreshToken?: string;
    serverFolderPermissions?: ServerFolderPermission[];
    serverPermissions?: ServerPermission[];
  })[]
) => {
  return (
    items.map((item) => {
      return {
        /* eslint-disable sort-keys-fix/sort-keys-fix */
        id: item.id,
        username: item.username,
        accessToken: item.accessToken,
        refreshToken: item.refreshToken,
        enabled: item.enabled,
        isAdmin: item.isAdmin,
        deviceId: item.deviceId,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        flatServerPermissions:
          item.serverPermissions && item.serverPermissions.map((s) => s.id),
        serverFolderPermissions:
          item.serverFolderPermissions &&
          relatedServerFolderPermissions(item.serverFolderPermissions),
        serverPermissions:
          item.serverPermissions &&
          relatedServerPermissions(item.serverPermissions),
        /* eslint-enable sort-keys-fix/sort-keys-fix */
      };
    }) || []
  );
};

export const toApiModel = {
  albums,
  servers,
  songs,
  users,
};
