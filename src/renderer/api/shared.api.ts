import axios from 'axios';
import md5 from 'md5';
import { ServerType } from '@/renderer/api/types';
import { randomString } from '@/renderer/utils';

type JFAuthenticate = {
  AccessToken: string;
  ServerId: string;
  SessionInfo: any;
  User: any;
};

export const jfAuthenticate = async (options: {
  password: string;
  url: string;
  username: string;
}) => {
  const { password, url, username } = options;
  const cleanServerUrl = url.replace(/\/$/, '');

  const { data } = await axios.post<JFAuthenticate>(
    `${cleanServerUrl}/users/authenticatebyname`,
    { pw: password, username },
    {
      headers: {
        'X-Emby-Authorization': `MediaBrowser Client="Sonixd", Device="PC", DeviceId="Sonixd", Version="1.0.0-alpha1"`,
      },
    }
  );

  return data;
};

type NDAuthenticate = {
  id: string;
  isAdmin: boolean;
  name: string;
  subsonicSalt: string;
  subsonicToken: string;
  token: string;
  username: string;
};

const ndAuthenticate = async (options: {
  password: string;
  url: string;
  username: string;
}) => {
  const { password, url, username } = options;
  const cleanServerUrl = url.replace(/\/$/, '');

  const { data } = await axios.post<NDAuthenticate>(
    `${cleanServerUrl}/auth/login`,
    { password, username }
  );

  return data;
};

const ssAuthenticate = async (options: {
  legacy?: boolean;
  password: string;
  url: string;
  username: string;
}) => {
  let token;

  const cleanServerUrl = options.url.replace(/\/$/, '');

  if (options.legacy) {
    token = `u=${options.username}&p=${options.password}`;
  } else {
    const salt = randomString();
    const hash = md5(options.password + salt);
    token = `u=${options.username}&s=${salt}&t=${hash}`;
  }

  const { data } = await axios.get(
    `${cleanServerUrl}/rest/ping.view?v=1.13.0&c=sonixd&f=json&${token}`
  );

  return { token, ...data };
};

export const remoteServerLogin = async (options: {
  legacy?: boolean;
  password: string;
  type: ServerType;
  url: string;
  username: string;
}) => {
  if (options.type === ServerType.JELLYFIN) {
    try {
      const res = await jfAuthenticate({
        password: options.password,
        url: options.url,
        username: options.username,
      });

      return {
        remoteUserId: res.User.Id,
        token: res.AccessToken,
        type: ServerType.JELLYFIN,
        url: options.url,
        username: options.username,
      };
    } catch (err: any) {
      return { message: err.message, type: 'error' };
    }
  }

  if (options.type === ServerType.SUBSONIC) {
    const res = await ssAuthenticate({
      legacy: options.legacy,
      password: options.password,
      url: options.url,
      username: options.username,
    });

    if (res.status === 'failed') {
      return {
        message: 'Could not validate username and password',
        type: 'error',
      };
    }

    return {
      remoteUserId: '',
      token: res.token,
      type: ServerType.SUBSONIC,
      url: options.url,
      username: options.username,
    };
  }

  if (options.type === ServerType.NAVIDROME) {
    try {
      const res = await ndAuthenticate({
        password: options.password,
        url: options.url,
        username: options.username,
      });

      return {
        remoteUserId: res.id,
        token: `u=${res.name}&s=${res.subsonicSalt}&t=${res.subsonicToken}`,
        // token: res.token,
        type: ServerType.NAVIDROME,
        url: options.url,
        username: options.username,
      };
    } catch (err: any) {
      return { message: err.message, type: 'error' };
    }
  }

  return { message: 'Not found', type: 'error' };
};
