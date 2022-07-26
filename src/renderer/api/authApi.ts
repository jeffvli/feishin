// import axios from 'axios';
import axios from 'axios';
import { LoginResponse, PingResponse } from './types';

const login = async (
  serverUrl: string,
  body: {
    password: string;
    username: string;
  }
) => {
  const { data } = await axios.post<LoginResponse>(
    `${serverUrl}/api/auth/login`,
    body
  );

  return data;
};

const ping = async (serverUrl: string) => {
  const { data } = await axios.get<PingResponse>(`${serverUrl}/api/auth/ping`, {
    timeout: 2000,
  });

  return data;
};

const refresh = async (serverUrl: string, body: { refreshToken: string }) => {
  const { data } = await axios.post(`${serverUrl}/api/auth/refresh`, body);

  return data;
};

export const authApi = {
  login,
  ping,
  refresh,
};
