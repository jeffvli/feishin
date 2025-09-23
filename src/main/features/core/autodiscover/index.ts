import { createSocket } from 'dgram';
import { ipcMain } from 'electron';
import { DiscoveredServerItem, ServerType } from '/@/shared/types/types';

type JellyfinResponse = {
    Address: string;
    Id: string;
    Name: string;
}

function discoverJellyfin(reply: (server: DiscoveredServerItem) => void) {
    const sock = createSocket('udp4');
    sock.on('message', (msg) => {
        try {
            const response: JellyfinResponse = JSON.parse(msg.toString('utf-8'));

            reply({
                type: ServerType.JELLYFIN,
                name: response.Name,
                url: response.Address,
            });
        } catch (e) {
            // Got a spurious response, ignore?
            console.error(e);
        }
    });

    sock.bind(() => {
        sock.setBroadcast(true);
        sock.send('who is JellyfinServer?', 7359, '255.255.255.255');
    });

    return new Promise<void>((resolve) => {
        setTimeout(() => {
            sock.close();
            resolve();
        }, 3000);
    });
}

function discoverAll(reply: (server: DiscoveredServerItem) => void) {
    return Promise.all([
        discoverJellyfin(reply),
    ]);
}

ipcMain.on('autodiscover-ping', (ev) => {
    if (ev.ports.length === 0) throw new Error('Expected a port to stream autodiscovery results');
    const port = ev.ports[0];

    discoverAll(result => port.postMessage(result))
        .then(() => port.close())
        .catch((err) => console.error(err));
});
