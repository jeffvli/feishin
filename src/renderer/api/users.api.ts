import { BaseResponse, User } from '@/renderer/api/types';
import { ax } from '@/renderer/lib/axios';

export type UserDetailResponse = BaseResponse<User>;
export type UserListResponse = BaseResponse<User[]>;

const getUserDetail = async (query: { userId: string }) => {
  const { data } = await ax.get<UserDetailResponse>(`/users/${query.userId}`);
  return data;
};

const getUserList = async () => {
  const { data } = await ax.get<UserListResponse>('/users');
  return data;
};

export const usersApi = {
  getUserDetail,
  getUserList,
};
