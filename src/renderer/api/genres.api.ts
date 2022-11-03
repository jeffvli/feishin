import { BaseResponse, Genre } from '@/renderer/api/types';
import { ax } from '@/renderer/lib/axios';

export type GenreListResponse = BaseResponse<Genre[]>;

const getGenreList = async (
  query: { serverId: string },
  signal?: AbortSignal
) => {
  const { data } = await ax.get<GenreListResponse>(
    `/servers/${query.serverId}/genres`,
    {
      signal,
    }
  );

  return data;
};

export const genresApi = {
  getGenreList,
};
