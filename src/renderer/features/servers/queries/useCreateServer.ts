import axios from 'axios';
import md5 from 'md5';
import { useMutation } from 'react-query';
import { serversApi } from 'renderer/api/serversApi';
import { randomString } from 'renderer/utils';

export const validateServer = async (options: {
  legacyAuth: boolean;
  password: string;
  serverType: string;
  url: string;
  username: string;
}) => {
  const { serverType, url, username, password, legacyAuth } = options;
  const cleanServerUrl = url.replace(/\/$/, '');

  try {
    if (serverType === 'subsonic') {
      let testConnection;
      let token;
      if (legacyAuth) {
        token = `u=${username}&p=${password}`;
        testConnection = await axios.get(
          `${cleanServerUrl}/rest/ping.view?v=1.13.0&c=sonixd&f=json&${token}`
        );
      } else {
        const salt = randomString();
        const hash = md5(password + salt);
        token = `u=${username}&s=${salt}&t=${hash}`;

        testConnection = await axios.get(
          `${cleanServerUrl}/rest/ping.view?v=1.13.0&c=sonixd&f=json&${token}`
        );
      }

      if (testConnection.data['subsonic-response'].status === 'failed') {
        return {
          error: `${testConnection.data['subsonic-response'].error.message}`,
        };
      }
      return { token, userId: '' };
    }

    const { data } = await axios.post(
      `${cleanServerUrl}/users/authenticatebyname`,
      { pw: password, username },
      {
        headers: {
          'X-Emby-Authorization': `MediaBrowser Client="Sonixd", Device="PC", DeviceId="Sonixd", Version="1.0.0-alpha1"`,
        },
      }
    );

    return { token: data.AccessToken, userId: data.User.Id };
  } catch (err) {
    if (err instanceof Error) {
      return { error: err.message };
    }
  }

  return null;
};

export const useCreateServer = () => {
  return useMutation({
    mutationFn: serversApi.createServer,
    onError: (e) => console.log(e),
    onSuccess: (e) => console.log(e),
  });
};
