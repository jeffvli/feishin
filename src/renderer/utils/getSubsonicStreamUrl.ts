import { Song } from 'renderer/api/types';
// import { ServerFolderAuth } from 'renderer/features/servers';

export const getSubsonicStreamUrl = (
  auth: any,
  song: Song,
  deviceId: string
) => {
  return (
    `${auth.url}/rest/stream.view` +
    `?id=${song.remoteId}` +
    `&${auth.token}` +
    `&v=1.13.0` +
    `&c=sonixd_${deviceId}`
  );
};
