import isElectron from 'is-electron';
import { getServerById, PlayerData, useSettingsStore } from '/@/renderer/store';
import type { QueueSong } from '/@/renderer/api/types';
import { api } from '/@/renderer/api';

const mpvPlayer = isElectron() ? window.electron.mpvPlayer : null;

const modifyUrl = (song: QueueSong): string => {
    const transcode = useSettingsStore.getState().playback.transcode;
    if (transcode.enabled) {
        const streamUrl = api.controller.getTranscodingUrl({
            apiClientProps: {
                server: getServerById(song.serverId),
            },
            query: {
                base: song.streamUrl,
                ...transcode,
            },
        })!;

        return streamUrl;
    }

    return song.streamUrl;
};

export const setQueue = (data: PlayerData, pause?: boolean): void => {
    const current = data.queue.current ? modifyUrl(data.queue.current) : undefined;
    const next = data.queue.next ? modifyUrl(data.queue.next) : undefined;
    mpvPlayer?.setQueue(current, next, pause);
};

export const setQueueNext = (data: PlayerData): void => {
    if (data.queue.next) {
        mpvPlayer?.setQueueNext(modifyUrl(data.queue.next));
    } else {
        mpvPlayer?.setQueueNext(undefined);
    }
};

export const setAutoNext = (data: PlayerData): void => {
    if (data.queue.next) {
        mpvPlayer?.autoNext(modifyUrl(data.queue.next));
    } else {
        mpvPlayer?.autoNext(undefined);
    }
};
