/* eslint-disable no-underscore-dangle */
import Axios from 'axios';
import { authApi } from 'renderer/api/authApi';

export const api = Axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

api.interceptors.request.use(
  (config) => {
    const { serverUrl, accessToken } = JSON.parse(
      localStorage.getItem('authentication') || '{}'
    );

    config.baseURL = `${serverUrl}/api`;
    config.headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
api.interceptors.response.use(
  (res) => {
    return res;
  },
  async (err) => {
    if (err.response && err.response.status === 401) {
      const { config } = err;
      if (err.response.data.error.message === 'jwt expired' && !config.sent) {
        config.sent = true;

        const auth = JSON.parse(localStorage.getItem('authentication') || '{}');

        const { accessToken } = (
          await authApi.refresh(auth.serverUrl, {
            refreshToken: auth.refreshToken,
          })
        ).data;

        localStorage.setItem(
          'authentication',
          JSON.stringify({ ...auth, accessToken })
        );

        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${accessToken}`,
        };

        return Axios(config);
      }

      localStorage.setItem('authentication', '{}');
      window.location.reload();
    }
    return Promise.reject(err);
  }
);
