/* eslint-disable no-underscore-dangle */
import Axios from 'axios';
import { useAuthStore } from '/@/store';
import { authApi } from '../api/auth.api';

export const ax = Axios.create({
  headers: { 'Content-Type': 'application/json' },
  withCredentials: false,
});

ax.interceptors.request.use(
  (config) => {
    const { state } = JSON.parse(localStorage.getItem('store_authentication') || '{}');

    config.baseURL = `${state.serverUrl}/api`;
    config.headers = {
      Authorization: `Bearer ${state.accessToken}`,
      'Content-Type': 'application/json',
    };
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

ax.interceptors.response.use(
  (res) => {
    return res;
  },
  async (err) => {
    if (!err.response) {
      return Promise.reject(err);
    }

    if (err.response && err.response.status === 401) {
      const { config } = err;

      const auth = useAuthStore.getState();

      if (err.response.data.error.message === 'jwt expired' && !config.sent) {
        config.sent = true;

        const { accessToken } = (
          await authApi.refresh(auth.serverUrl, {
            refreshToken: auth.refreshToken,
          })
        ).data;

        useAuthStore.setState({ ...auth, accessToken });

        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${accessToken}`,
        };

        return Axios(config);
      }

      // auth.logout();
    }
    return Promise.reject(err);
  },
);
