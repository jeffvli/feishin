import { Song } from 'renderer/api/types';
// import { ServerFolderAuth } from 'renderer/features/servers';

export const getJellyfinStreamUrl = (
  auth: any,
  song: Song,
  deviceId: string
) => {
  return (
    `${auth.url}/audio` +
    `/${song.remoteId}/universal` +
    `?userId=${auth.userId}` +
    `&deviceId=sonixd_${deviceId}` +
    `&audioCodec=aac` +
    `&api_key=${auth.token}` +
    `&playSessionId=${deviceId}` +
    `&container=opus,mp3,aac,m4a,m4b,flac,wav,ogg` +
    `&transcodingContainer=ts` +
    `&transcodingProtocol=hls`
  );
};
