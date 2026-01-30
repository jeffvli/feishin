import axios from 'axios';
import * as dgram from 'dgram';
import { XMLParser } from 'fast-xml-parser';
import z from 'zod';
import { DlnaDevice } from '/@/shared/types/types';

const parser = new XMLParser();

const dlnaDeviceSchema = z.object({
    root: z.object({
        device: z.object({
            friendlyName: z.string(),
        }),
    }),
});

export const discoverDlnaDevices = async () => {
    const devices: Map<string, DlnaDevice> = new Map();

    for await (const deviceUrl of discoverDeviceUrls()) {
        const device = await getDlnaDevice(deviceUrl);
        if (!device) continue;

        devices.set(device.url, device);
    }

    return Array.from(devices.values());
}

async function* discoverDeviceUrls(): AsyncGenerator<string, void, unknown> {
    const socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });

    const discoveredDevices = new Set<string>();
    const deviceQueue: string[] = [];

    let done = false;
    let resolver: (() => void) | null = null;

    const resolve = () => {
        if (!resolver) return;
        resolver();
        resolver = null;
    };

    socket.on('message', (msg) => {
        const location = getLocationFromSsdpResponse(msg);
        if (!location || discoveredDevices.has(location)) return;

        deviceQueue.push(location);
        console.log('SSDP discovered device:', location);
        resolve();
    });

    socket.on('error', (err) => {
        console.error('SSDP socket error:', err);
        socket.close();
        done = true;
        resolve();
    });

    socket.bind(() => {
        sendSsdpBroadcast(socket);

        setTimeout(() => {
            socket.close();
            done = true;
            resolve();
        }, 5000);
    });

    while (!done || deviceQueue.length > 0) {
        if (deviceQueue.length > 0) {
            yield deviceQueue.shift()!;
        } else if (!done) {
            await new Promise<void>((resolve) => (resolver = resolve));
        }
    }
}

const sendSsdpBroadcast = (socket: dgram.Socket) => {
    const SSDP_PORT = 1900;
    const SSDP_ADDRESS = '239.255.255.250';
    const SSDP_SEARCH_TARGET = 'urn:schemas-upnp-org:device:MediaRenderer:1';

    const ssdpSearchMessage = Buffer.from(
        `M-SEARCH * HTTP/1.1\r\n` +
            `HOST: ${SSDP_ADDRESS}:${SSDP_PORT}\r\n` +
            `MAN: "ssdp:discover"\r\n` +
            `MX: 3\r\n` +
            `ST: ${SSDP_SEARCH_TARGET}\r\n` +
            `\r\n`,
    );
    socket.send(ssdpSearchMessage, 0, ssdpSearchMessage.length, SSDP_PORT, SSDP_ADDRESS, (err) => {
        if (err) console.error('Failed to send SSDP search:', err);
    });
};

const getLocationFromSsdpResponse = (message: Buffer<ArrayBuffer>) => {
    const response = message.toString();

    const locationMatch = response.match(/LOCATION:\s*(.+)/i);
    if (!locationMatch) return;

    return locationMatch[1].trim();
};

const getDlnaDevice = async (deviceUrl: string) => {
    try {
        const { data } = await axios.get(deviceUrl, { timeout: 2000 });
        const parsed = parser.parse(data);

        const dlnaResult = await dlnaDeviceSchema.safeParseAsync(parsed);
        if (!dlnaResult.success) {
            console.log('Unable to parse device description XML', { deviceUrl });
            return null;
        }

        const device = {
            name: dlnaResult.data.root.device.friendlyName,
            url: deviceUrl,
        };
        return device;
    } catch (error) {
        console.error(`Failed to get device info from ${deviceUrl}:`, error);
        return null;
    }
};
