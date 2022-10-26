import { Song } from '@/renderer/api/types';

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
    `&c=Feishin_${deviceId}`
  );
};
