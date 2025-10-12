import { ipcRenderer } from 'electron';

import { DiscoveredServerItem } from '../shared/types/types';

const discover = (onReply: (server: DiscoveredServerItem) => void): Promise<void> => {
    const { port1: local, port2: remote } = new MessageChannel();

    ipcRenderer.postMessage('autodiscover-ping', {}, [remote]);

    local.onmessage = (ev) => {
        onReply(ev.data);
    };

    return new Promise<void>((resolve) => {
        local.addEventListener('close', () => resolve());
    });
};

export const autodiscover = {
    discover,
};

export type AutoDiscover = typeof autodiscover;
