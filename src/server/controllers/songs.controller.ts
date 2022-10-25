import { Request, Response } from 'express';

const getSongList = async (req: Request, res: Response) => {
  const { serverId } = req.params;
  const { take, skip, serverFolderId } = req.query;

  // const songs = await songsService.findMany(req, {
  //   serverFolderIds: String(serverFolderId),
  //   serverId,
  //   skip: Number(skip),
  //   take: Number(take),
  //   user: req.authUser,
  // });

  // const success = ApiSuccess.ok({
  //   // data: toRes.songs(songs.data, req.authUser),
  //   data: songs.data,
  //   paginationItems: {
  //     skip: Number(skip),
  //     take: Number(take),
  //     totalEntries: songs.totalEntries,
  //     url: req.originalUrl,
  //   },
  // });

  return {};

  // return res.status(data.statusCode).json(getSuccessResponse(data));
};

export const songsController = {
  getSongList,
};
