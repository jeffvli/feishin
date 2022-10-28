import { useAuthStore } from '@/renderer/store';
import { ServerType } from '@/renderer/types';

export const useServerCredential = () => {
  const serverId = useAuthStore((state) => state.currentServer?.id) || '';
  const serverType = useAuthStore((state) => state.currentServer?.type);
  const serverCredential = useAuthStore(
    (state) => state.serverCredentials
  ).find((c) => c.serverId === serverId && c.enabled)?.token;

  const isImageTokenRequired =
    serverCredential &&
    (serverType === ServerType.SUBSONIC || serverType === ServerType.NAVIDROME);

  return {
    isImageTokenRequired,
    serverToken: serverCredential,
  };
};
