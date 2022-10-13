import { ImageType } from '@prisma/client';
import { prisma } from '../../lib';
import { SSAlbumListEntry, SSAlbumResponse } from './subsonic.types';

const insertImages = async (items: SSAlbumListEntry[]) => {
  const createMany = items
    .filter((item) => item.coverArt)
    .map((item) => ({
      remoteUrl: item.coverArt,
      type: ImageType.PRIMARY,
    }));

  await prisma.image.createMany({
    data: createMany,
    skipDuplicates: true,
  });
};

const insertSongImages = async (item: SSAlbumResponse) => {
  const createMany = item.album.song
    .filter((song) => song.coverArt)
    .map((song) => ({
      remoteUrl: song.coverArt,
      type: ImageType.PRIMARY,
    }));

  await prisma.image.createMany({
    data: createMany,
    skipDuplicates: true,
  });
};

export const subsonicUtils = {
  insertImages,
  insertSongImages,
};
