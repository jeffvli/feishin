import { createSocket } from 'dgram';
import { ipcMain } from 'electron';

import { DiscoveredServerItem, ServerType } from '/@/shared/types/types';

type JellyfinResponse = {
    Address: string;
    Id: string;
    Name: string;
};

function discoverAll(reply: (server: DiscoveredServerItem) => void) {
    return Promise.all([discoverJellyfin(reply)]);
}

function discoverJellyfin(reply: (server: DiscoveredServerItem) => void) {
    const sock = createSocket('udp4');
    sock.on('message', (msg) => {
        try {
            const response: JellyfinResponse = JSON.parse(msg.toString('utf-8'));

            reply({
                name: response.Name,
                type: ServerType.JELLYFIN,
                url: response.Address,
            });
        } catch (e) {
            // Got a spurious response, ignore?
            console.error(e);
        }
    });

    sock.bind(() => {
        sock.setBroadcast(true);
        // Send a broadcast packet to both loopback and default route, allowing discovery of same-machine instances
        sock.send('who is JellyfinServer?', 7359, '127.255.255.255');
        sock.send('who is JellyfinServer?', 7359, '255.255.255.255');
    });

    return new Promise<void>((resolve) => {
        setTimeout(() => {
            sock.close();
            resolve();
        }, 3000);
    });
}

ipcMain.on('autodiscover-ping', (ev) => {
    if (ev.ports.length === 0) throw new Error('Expected a port to stream autodiscovery results');
    const port = ev.ports[0];

    discoverAll((result) => port.postMessage(result))
        .then(() => port.close())
        .catch((err) => console.error(err));
});
