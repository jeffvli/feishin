import { api } from 'renderer/lib';
import { UserResponse } from './types';

const getUsers = async () => {
  const { data } = await api.get<UserResponse>('/users');
  return data;
};

export const usersApi = {
  getUsers,
};
