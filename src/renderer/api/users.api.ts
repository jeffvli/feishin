import { FileWithPath } from '@mantine/dropzone';
import { BaseResponse, NullResponse, User } from '@/renderer/api/types';
import { ax } from '@/renderer/lib/axios';

export type UserDetailResponse = BaseResponse<User>;
export type UserListResponse = BaseResponse<User[]>;

const getUserDetail = async (query: { userId: string }) => {
  const { data } = await ax.get<UserDetailResponse>(`/users/${query.userId}`);
  return data;
};

const getUserList = async (signal?: AbortSignal) => {
  const { data } = await ax.get<UserListResponse>('/users', { signal });
  return data;
};

export type CreateUserBody = {
  displayName?: string;
  image?: FileWithPath;
  password: string;
  username: string;
};

const createUser = async (body: CreateUserBody) => {
  const { data } = await ax.post<UserDetailResponse>('/users', body);
  return data;
};

const deleteUser = async (query: { userId: string }) => {
  const { data } = await ax.delete<NullResponse>(`/users/${query.userId}`);
  return data;
};

export type UpdateUserBody = Partial<CreateUserBody>;

const updateUser = async (query: { userId: string }, body: UpdateUserBody) => {
  if (body.image) {
    const formData = new FormData();
    formData.append('image', body.image);
    if (body.username) formData.append('username', body.username);
    if (body.displayName) formData.append('displayName', body.displayName);

    const { data } = await ax.patch<UserDetailResponse>(
      `/users/${query.userId}`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );

    return data;
  }

  const { data } = await ax.patch<UserDetailResponse>(
    `/users/${query.userId}`,
    body,
    {}
  );
  return data;
};

export const usersApi = {
  createUser,
  deleteUser,
  getUserDetail,
  getUserList,
  updateUser,
};
