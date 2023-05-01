import { nanoid } from 'nanoid';
import { z } from 'zod';
import { ssType } from '/@/renderer/api/subsonic/subsonic-types';
import { QueueSong, LibraryItem } from '/@/renderer/api/types';
import { ServerListItem, ServerType } from '/@/renderer/types';

const getCoverArtUrl = (args: {
  baseUrl: string | undefined;
  coverArtId?: string;
  credential: string | undefined;
  size: number;
}) => {
  const size = args.size ? args.size : 150;

  if (!args.coverArtId || args.coverArtId.match('2a96cbd8b46e442fc41c2b86b821562f')) {
    return null;
  }

  return (
    `${args.baseUrl}/rest/getCoverArt.view` +
    `?id=${args.coverArtId}` +
    `&${args.credential}` +
    '&v=1.13.0' +
    '&c=feishin' +
    `&size=${size}`
  );
};

const normalizeSong = (
  item: z.infer<typeof ssType._response.song>,
  server: ServerListItem | null,
  deviceId: string,
): QueueSong => {
  const imageUrl =
    getCoverArtUrl({
      baseUrl: server?.url,
      coverArtId: item.coverArt,
      credential: server?.credential,
      size: 100,
    }) || null;

  const streamUrl = `${server?.url}/rest/stream.view?id=${item.id}&v=1.13.0&c=feishin_${deviceId}&${server?.credential}`;

  return {
    album: item.album || '',
    albumArtists: [
      {
        id: item.artistId || '',
        imageUrl: null,
        name: item.artist || '',
      },
    ],
    albumId: item.albumId || '',
    artistName: item.artist || '',
    artists: [
      {
        id: item.artistId || '',
        imageUrl: null,
        name: item.artist || '',
      },
    ],
    bitRate: item.bitRate || 0,
    bpm: null,
    channels: null,
    comment: null,
    compilation: null,
    container: item.contentType,
    createdAt: item.created,
    discNumber: item.discNumber || 1,
    duration: item.duration || 0,
    genres: item.genre
      ? [
          {
            id: item.genre,
            name: item.genre,
          },
        ]
      : [],
    id: item.id,
    imagePlaceholderUrl: null,
    imageUrl,
    itemType: LibraryItem.SONG,
    lastPlayedAt: null,
    name: item.title,
    path: item.path,
    playCount: item?.playCount || 0,
    releaseDate: null,
    releaseYear: item.year ? String(item.year) : null,
    serverId: server?.id || 'unknown',
    serverType: ServerType.SUBSONIC,
    size: item.size,
    streamUrl,
    trackNumber: item.track || 1,
    uniqueId: nanoid(),
    updatedAt: '',
    userFavorite: item.starred || false,
    userRating: item.userRating || null,
  };
};

export const ssNormalize = {
  song: normalizeSong,
};
