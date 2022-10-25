/* eslint-disable no-underscore-dangle */
import Axios from 'axios';
import { authApi } from '../api/auth.api';

export const ax = Axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

ax.interceptors.request.use(
  (config) => {
    const { state } = JSON.parse(
      localStorage.getItem('authentication') || '{}'
    );

    config.baseURL = `${state.serverUrl}/api`;
    config.headers = {
      Authorization: `Bearer ${state.accessToken}`,
      'Content-Type': 'application/json',
    };
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

ax.interceptors.response.use(
  (res) => {
    return res;
  },
  async (err) => {
    if (err.response && err.response.status === 401) {
      const { config } = err;
      const auth = JSON.parse(localStorage.getItem('authentication') || '{}');

      if (err.response.data.error.message === 'jwt expired' && !config.sent) {
        config.sent = true;

        const { accessToken } = (
          await authApi.refresh(auth.state.serverUrl, {
            refreshToken: auth.refreshToken,
          })
        ).data;

        localStorage.setItem(
          'authentication',
          JSON.stringify({ ...auth, state: { ...auth.state, accessToken } })
        );

        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${accessToken}`,
        };

        return Axios(config);
      }

      localStorage.setItem(
        'authentication',
        JSON.stringify({
          ...auth,
          state: { ...auth.state, accessToken: '', refreshToken: '' },
        })
      );

      if (err.response.data.error.message === 'No auth token') {
        localStorage.setItem(
          'authentication',
          JSON.stringify({
            ...auth,
            state: { ...auth.state, accessToken: '', refreshToken: '' },
          })
        );
        // window.location.reload();
      }
    }
    return Promise.reject(err);
  }
);
