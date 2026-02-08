import { MediaRendererClient } from '/@/main/features/core/dlna/renderer';
import { DlnaQueueItem } from '/@/shared/types/types';

const ERR_NOT_INITIALIZED = Error('DLNA client not initialized');

let client: MediaRendererClient | null = null;

export const createClient = (deviceUrl: string) => {
    client = new MediaRendererClient(deviceUrl);
    return client;
};

const getClient = () => {
    if (!client) {
        console.error(ERR_NOT_INITIALIZED);
        return null;
    }
    return client;
};

export const load = (item: DlnaQueueItem) =>
    new Promise<number>((resolve, reject) => {
        const client = getClient();
        if (!client) return reject(ERR_NOT_INITIALIZED);

        client.load(
            item.url,
            {
                contentType: item.mimeType,
                metadata: item.metadata,
            },
            (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            },
        );
    });

export const enqueue = (item: DlnaQueueItem) =>
    new Promise<number>((resolve, reject) => {
        const client = getClient();
        if (!client) return reject(ERR_NOT_INITIALIZED);

        client.load(
            item.url,
            {
                contentType: item.mimeType,
                isNext: true,
                metadata: item.metadata,
            },
            (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            },
        );
    });

export const play = (opts?: { speed?: number }) =>
    getClient()?.play(opts, (error) => {
        if (error) console.error('DLNA play:', error);
    });

export const pause = () =>
    getClient()?.pause((error) => {
        if (error) console.error('DLNA pause:', error);
    });

export const stop = () =>
    getClient()?.stop((error) => {
        if (error) console.error('DLNA stop:', error);
    });

export const getTime = async () =>
    new Promise<number>((resolve, reject) => {
        const client = getClient();
        if (!client) return reject(ERR_NOT_INITIALIZED);

        client.getPosition((err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });

export const seekTo = (seconds: number) =>
    getClient()?.seek(seconds, (error) => {
        if (error) console.error('DLNA seekTo:', error);
    });

export const setVolume = (volume: number) =>
    getClient()?.setVolume(volume, (error) => {
        if (error) console.error('DLNA setVolume:', error);
    });

export const setMute = (isMuted: boolean) =>
    getClient()?.setMute(isMuted, (error) => {
        if (error) console.error('DLNA setMute:', error);
    });
