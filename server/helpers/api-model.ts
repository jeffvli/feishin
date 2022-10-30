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
  Task,
  User,
  UserServerUrl,
} from '@prisma/client';

const getSubsonicStreamUrl = (options: {
  deviceId: string;
  remoteId: string;
  token?: string;
  url: string;
}) => {
  const { deviceId, remoteId, token, url } = options;
  return (
    `${url}/rest/stream.view` +
    `?id=${remoteId}` +
    `&v=1.13.0` +
    `&c=Feishin_${deviceId}` +
    `&${token ? `${token}` : ''}`
  );
};

const getJellyfinStreamUrl = (options: {
  deviceId: string;
  remoteId: string;
  token?: string;
  url: string;
  userId: string;
}) => {
  const { deviceId, remoteId, token, url, userId } = options;
  return (
    `${url}/audio` +
    `/${remoteId}/universal` +
    `?userId=${userId}` +
    `&audioCodec=aac` +
    `&container=opus,mp3,aac,m4a,m4b,flac,wav,ogg` +
    `&transcodingContainer=ts` +
    `&transcodingProtocol=hls` +
    `&deviceId=Feishin_${deviceId}` +
    `&playSessionId=${deviceId}` +
    `&api_key=${token ? `${token}` : ''}`
  );
};

const buildStreamUrl = (
  type: ServerType,
  options: {
    deviceId: string;
    noCredential: boolean;
    remoteId: string;
    token: string;
    url: string;
    userId?: string;
  }
) => {
  if (type === ServerType.JELLYFIN) {
    return getJellyfinStreamUrl({
      deviceId: options.deviceId,
      remoteId: options.remoteId,
      token: options.noCredential ? undefined : options.token,
      url: options.url,
      userId: options.userId || '',
    });
  }

  if (type === ServerType.SUBSONIC) {
    return getSubsonicStreamUrl({
      deviceId: options.deviceId,
      remoteId: options.remoteId,
      token: options.noCredential ? undefined : options.token,
      url: options.url,
    });
  }

  if (type === ServerType.NAVIDROME) {
    const [_ndToken, ssToken] = options.token.split('||');

    if (options.noCredential) {
      return getSubsonicStreamUrl({
        deviceId: options.deviceId,
        remoteId: options.remoteId,
        url: options.url,
      });
    }

    return getSubsonicStreamUrl({
      deviceId: options.deviceId,
      remoteId: options.remoteId,
      token: ssToken,
      url: options.url,
    });
  }

  return null;
};

const imageUrl = (
  type: ServerType,
  imageType: ImageType,
  baseUrl: string,
  imageId: string,
  token?: string
) => {
  if (type === ServerType.JELLYFIN) {
    if (imageType === ImageType.PRIMARY) {
      return (
        `${baseUrl}/Items` +
        `/${imageId}` +
        `/Images/Primary` +
        '?fillHeight=250' +
        `&fillWidth=250` +
        '&quality=90'
      );
    }

    return (
      `${baseUrl}/Items` +
      `/${imageId}` +
      `/Images/Backdrop` +
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
      `&c=Feishin` +
      `&${token ? `${token}` : ''}`
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
      enabled: item.enabled,
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

const buildImageUrl = (options: {
  imageType: ImageType;
  images: Image[];
  noCredential?: boolean;
  remoteId: string;
  token?: string;
  type: ServerType;
  url: string;
}) => {
  const { imageType, images, remoteId, token, type, url, noCredential } =
    options;

  const image = images.find((i) => i.type === imageType);

  if (!image) return null;

  if (type === ServerType.JELLYFIN) {
    return imageUrl(type, imageType, url, remoteId);
  }

  if (type === ServerType.SUBSONIC) {
    if (noCredential) {
      return imageUrl(type, imageType, url, image.remoteUrl);
    }

    return imageUrl(type, imageType, url, image.remoteUrl, token);
  }

  if (type === ServerType.NAVIDROME) {
    const [_ndToken, ssToken] = token!.split('||');

    if (noCredential) {
      return imageUrl(type, imageType, url, image.remoteUrl);
    }

    return imageUrl(type, imageType, url, image.remoteUrl, ssToken);
  }

  return null;
};

type DbSong = Song & DbSongInclude;

type DbSongInclude = {
  album: Album & { images: Image[] };
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
  },
  noCredential: boolean
) => {
  return (
    items?.map((item) => {
      const customUrl = item.server.serverUrls[0]?.url;
      const baseUrl = customUrl ? customUrl : options.url;

      const streamUrl = buildStreamUrl(options.type, {
        deviceId: options.deviceId,
        noCredential,
        remoteId: item.remoteId,
        token: options.token,
        url: baseUrl,
        userId: options.userId,
      });

      let imageUrl = buildImageUrl({
        imageType: ImageType.PRIMARY,
        images: item.images,
        noCredential,
        remoteId: item.remoteId,
        token: options.token,
        type: options.type,
        url: baseUrl,
      });

      if (!imageUrl) {
        imageUrl = buildImageUrl({
          imageType: ImageType.PRIMARY,
          images: item.album.images,
          noCredential,
          remoteId: item.remoteId,
          token: options.token,
          type: options.type,
          url: baseUrl,
        });
      }

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
        imageUrl,
        releaseDate: item.releaseDate,
        releaseYear: item.releaseYear,
        remoteCreatedAt: item.remoteCreatedAt,
        remoteId: item.remoteId,
        // serverFolderId: item.serverFolderId,
        serverId: item.serverId,
        streamUrl,
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
      const { type, token, remoteUserId, noCredential } = item.server;
      const url = serverUrl || item.server.url;

      // Jellyfin does not require credentials for image url
      const shouldBuildImage = type === ServerType.JELLYFIN || !noCredential;
      const tokenForImage = shouldBuildImage ? token : undefined;

      const imageUrl = buildImageUrl({
        imageType: ImageType.PRIMARY,
        images: item.images,
        noCredential,
        remoteId: item.remoteId,
        token,
        type,
        url,
      });

      const backdropImageUrl = buildImageUrl({
        imageType: ImageType.BACKDROP,
        images: item.images,
        noCredential,
        remoteId: item.remoteId,
        token,
        type,
        url,
      });

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
        imageUrl,
        backdropImageUrl: backdropImageUrl,
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
          songs(
            item?.songs?.map((s: any) => ({
              ...s,
              album: { images: item?.images, ...relatedAlbum(item) },
            })),
            {
              deviceId: user.deviceId,
              token,
              type,
              url,
              userId: remoteUserId,
            },
            noCredential
          ),
        /* eslint-enable sort-keys-fix/sort-keys-fix */
      };
    }) || []
  );
};

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
        noCredential: item.noCredential,
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

const relatedServers = (items: Server[]) => {
  const result = items.map((item) => ({
    id: item.id,
    name: item.name,
    type: item.type,
    url: item.url,
  }));

  return result || [];
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

const relatedUsers = (items: User[]) => {
  const result = items.map((item) => ({
    enabled: item.enabled,
    id: item.id,
    isAdmin: item.isAdmin,
    username: item.username,
  }));

  return result || [];
};

type DbTask = Task & DbTaskInclude;

type DbTaskInclude = {
  server: Server;
  user: User;
};

const tasks = (options: { items: DbTask[] | any[] }) => {
  const { items } = options;

  const result = items.map((item) => ({
    createdAt: item.createdAt,
    id: item.id,
    isCompleted: item.completed,
    isError: item.isError,
    message: item.message,
    server: item.server ? relatedServers([item.server])[0] : null,
    type: item.type,
    updatedAt: item.updatedAt,
    user: item.user ? relatedUsers([item.user])[0] : null,
  }));

  return result;
};

export const toApiModel = {
  albums,
  servers,
  songs,
  tasks,
  users,
};
