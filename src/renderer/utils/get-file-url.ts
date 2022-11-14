import { ServerFile } from '@/renderer/api/types';

export const getFileUrl = (serverUrl: string, file: ServerFile | null) => {
  if (!file) return undefined;
  return `${serverUrl}/${file.path}`;
};
