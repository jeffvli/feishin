import { OffsetPagination } from '../types/types';

export interface SongRequestParams extends OffsetPagination {
  albumIds?: string;
  artistIds?: string;
  serverFolderIds: string;
  serverId: string;
  songIds?: string;
}
