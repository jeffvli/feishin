import { DiscoveredServerItem } from '../shared/types/types';
import { ipcRenderer } from 'electron';

const discover = (onReply: (server: DiscoveredServerItem) => void): Promise<void> => {
    const { port1: local, port2: remote } = new MessageChannel();

    ipcRenderer.postMessage('autodiscover-ping', {}, [remote]);

    console.log("discover() called");

    local.onmessage = (ev) => {
        console.log(ev);
        onReply(ev.data);
    }

    return new Promise<void>(resolve => {
        local.addEventListener('close', () => resolve());
    });
}

export const autodiscover = {
    discover,
};

export type AutoDiscover = typeof autodiscover;

