import { ipcRenderer } from 'electron';

const getAnimatedCoverUrl = (
    albumName: string,
    artistName: string,
    apiBase?: string,
): Promise<null | string> => {
    const result = ipcRenderer.invoke('animated-cover-url', albumName, artistName, apiBase);
    return result;
};

export const animatedCovers = {
    getAnimatedCoverUrl,
};

export type AnimatedCovers = typeof animatedCovers;
