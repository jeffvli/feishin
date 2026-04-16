// ssdp-discovery.ts
import { execFile } from 'child_process';
import dgram from 'dgram';
import http from 'http';
import os from 'os';

import { DlnaDevice } from './soap-client';

const MEDIA_RENDERER_URN = 'urn:schemas-upnp-org:device:MediaRenderer:1';
const AV_TRANSPORT_URN = 'urn:schemas-upnp-org:service:AVTransport:1';
const RENDERING_CONTROL_URN = 'urn:schemas-upnp-org:service:RenderingControl:1';
const SSDP_ADDRESS = '239.255.255.250';
const SSDP_PORT = 1900;

async function discoverDirect(timeout: number): Promise<DlnaDevice[]> {
    const locations = new Set<string>();
    const localAddresses = getLocalIpv4Addresses();
    const sockets = await Promise.all(
        localAddresses.map((addr) => createSocketForInterface(addr, locations)),
    );
    await new Promise<void>((r) => setTimeout(r, timeout - 500));

    for (const socket of sockets) {
        try {
            socket.close();
        } catch {
            // Catch
        }
    }
    const devices: DlnaDevice[] = [];
    for (const loc of locations) {
        try {
            const xml = await fetchXml(loc);
            const device = parseDevice(xml, loc);
            if (device) devices.push(device);
        } catch {
            // Catch
        }
    }
    return devices;
}

const DISCOVERY_SCRIPT = `
const dgram = require('dgram');
const http = require('http');
const os = require('os');

const MEDIA_RENDERER_URN = 'urn:schemas-upnp-org:device:MediaRenderer:1';
const AV_TRANSPORT_URN = 'urn:schemas-upnp-org:service:AVTransport:1';
const RENDERING_CONTROL_URN = 'urn:schemas-upnp-org:service:RenderingControl:1';

const locations = new Set();

const message = Buffer.from(
    'M-SEARCH * HTTP/1.1\\r\\n' +
    'HOST: 239.255.255.250:1900\\r\\n' +
    'MAN: "ssdp:discover"\\r\\n' +
    'MX: 3\\r\\n' +
    'ST: ' + MEDIA_RENDERER_URN + '\\r\\n' +
    '\\r\\n'
);

function getLocalAddresses() {
    const addresses = [];
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name] || []) {
            if (iface.family === 'IPv4' && !iface.internal) {
                addresses.push(iface.address);
            }
        }
    }
    return addresses.length > 0 ? addresses : ['0.0.0.0'];
}

const localAddresses = getLocalAddresses();
const sockets = [];

for (const addr of localAddresses) {
    const socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });
    sockets.push(socket);
    socket.on('message', (msg) => {
        const text = msg.toString();
        const loc = text.match(/LOCATION:\\s*(.+)\\r?\\n/i);
        if (loc) locations.add(loc[1].trim());
    });
    socket.on('error', () => {});
    socket.bind(0, addr, () => {
        try {
            socket.setMulticastInterface(addr);
            socket.setMulticastTTL(4);
        } catch {}
        socket.send(message, 0, message.length, 1900, '239.255.255.250');
        setTimeout(() => socket.send(message, 0, message.length, 1900, '239.255.255.250'), 500);
        setTimeout(() => socket.send(message, 0, message.length, 1900, '239.255.255.250'), 1500);
    });
}

function fetchXml(url) {
    return new Promise((resolve, reject) => {
        const req = http.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve(data));
        });
        req.on('error', reject);
        req.setTimeout(3000, () => req.destroy(new Error('timeout')));
    });
}

function parseDevice(xml, location) {
    const udn = xml.match(/<UDN>([^<]+)<\\/UDN>/);
    const baseUrl = new URL(location);
    const base = baseUrl.protocol + '//' + baseUrl.host;
    const roomName = (xml.match(/<roomName>([^<]+)<\\/roomName>/) || [])[1];
    const modelName = (xml.match(/<modelName>([^<]+)<\\/modelName>/) || [])[1];
    const friendlyName = (xml.match(/<friendlyName>([^<]+)<\\/friendlyName>/) || [])[1];
    let name;
    if (roomName && modelName) name = roomName.trim() + ' (' + modelName.trim() + ')';
    else if (roomName) name = roomName.trim();
    else if (friendlyName && !friendlyName.trim().startsWith('RINCON_')) name = friendlyName.trim();
    else if (modelName) name = modelName.trim();
    else name = 'Unknown DLNA Device';
    let controlUrl = '';
    let renderingControlUrl = '';
    const serviceRegex = /<service>(.*?)<\\/service>/gs;
    let match;
    while ((match = serviceRegex.exec(xml)) !== null) {
        const block = match[1];
        const typeMatch = block.match(/<serviceType>([^<]+)<\\/serviceType>/);
        const urlMatch = block.match(/<controlURL>([^<]+)<\\/controlURL>/);
        if (typeMatch && urlMatch) {
            const svcType = typeMatch[1].trim();
            const svcUrl = urlMatch[1].trim();
            const fullUrl = svcUrl.startsWith('http') ? svcUrl : base + (svcUrl.startsWith('/') ? '' : '/') + svcUrl;
            if (svcType === AV_TRANSPORT_URN) controlUrl = fullUrl;
            if (svcType === RENDERING_CONTROL_URN) renderingControlUrl = fullUrl;
        }
    }
    if (!controlUrl) return null;
    return {
        id: udn ? udn[1] : location,
        name: name,
        location: location,
        controlUrl: controlUrl,
        renderingControlUrl: renderingControlUrl || controlUrl,
    };
}

setTimeout(async () => {
    for (const s of sockets) {
        try { s.close(); } catch {}
    }
    const devices = [];
    for (const loc of locations) {
        try {
            const xml = await fetchXml(loc);
            const device = parseDevice(xml, loc);
            if (device) devices.push(device);
        } catch {}
    }
    process.stdout.write(JSON.stringify(devices));
    process.exit(0);
}, 4000);
`;

export async function discoverDevices(timeout: number = 5000): Promise<DlnaDevice[]> {
    if (process.platform === 'darwin') {
        return discoverMacOS(timeout);
    }
    return discoverDirect(timeout);
}

function createSocketForInterface(
    localAddress: string,
    locations: Set<string>,
): Promise<dgram.Socket> {
    return new Promise((resolve) => {
        const socket = dgram.createSocket({ reuseAddr: true, type: 'udp4' });
        const message = Buffer.from(
            `M-SEARCH * HTTP/1.1\r\n` +
                `HOST: ${SSDP_ADDRESS}:${SSDP_PORT}\r\n` +
                `MAN: "ssdp:discover"\r\n` +
                `MX: 3\r\n` +
                `ST: ${MEDIA_RENDERER_URN}\r\n` +
                `\r\n`,
        );
        const send = () => {
            socket.send(message, 0, message.length, SSDP_PORT, SSDP_ADDRESS, () => {});
        };
        socket.on('error', () => {});
        socket.on('message', (msg) => {
            const loc = msg.toString().match(/LOCATION:\s*(.+)\r?\n/i);
            if (loc) locations.add(loc[1].trim());
        });
        socket.bind(0, localAddress, () => {
            try {
                socket.setMulticastInterface(localAddress);
                socket.setMulticastTTL(4);
            } catch {
                // Catch
            }
            send();
            setTimeout(send, 500);
            setTimeout(send, 1500);
            resolve(socket);
        });
    });
}

async function discoverMacOS(timeout: number): Promise<DlnaDevice[]> {
    return new Promise((resolve) => {
        const nodePath = process.execPath.includes('node')
            ? process.execPath
            : '/usr/local/bin/node';
        const child = execFile(nodePath, ['-e', DISCOVERY_SCRIPT], { timeout }, (err, stdout) => {
            if (err) {
                resolve([]);
                return;
            }
            try {
                const devices: DlnaDevice[] = JSON.parse(stdout);
                resolve(devices);
            } catch {
                resolve([]);
            }
        });
        child.on('error', () => resolve([]));
    });
}

function fetchXml(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const req = http.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => (data += chunk));
            res.on('end', () => resolve(data));
        });
        req.on('error', reject);
        req.setTimeout(3000, () => req.destroy(new Error('timeout')));
    });
}

function getLocalIpv4Addresses(): string[] {
    const addresses: string[] = [];
    for (const ifaces of Object.values(os.networkInterfaces())) {
        for (const iface of ifaces ?? []) {
            if (iface.family === 'IPv4' && !iface.internal) {
                addresses.push(iface.address);
            }
        }
    }
    return addresses.length > 0 ? addresses : ['0.0.0.0'];
}

function parseDevice(xml: string, location: string): DlnaDevice | null {
    // Simple XML parsing without external dependencies
    const udn = xml.match(/<UDN>([^<]+)<\/UDN>/);
    const baseUrl = new URL(location);
    const base = `${baseUrl.protocol}//${baseUrl.host}`;

    // For Sonos speakers only. I haven't been able to test with other devices, which might need similar name sanitisation.
    const roomName = xml.match(/<roomName>([^<]+)<\/roomName>/)?.[1]?.trim();
    const modelName = xml.match(/<modelName>([^<]+)<\/modelName>/)?.[1]?.trim();
    const friendlyName = xml.match(/<friendlyName>([^<]+)<\/friendlyName>/)?.[1]?.trim();
    let name: string;
    if (roomName && modelName) {
        name = `${roomName} (${modelName})`;
    } else if (roomName) {
        name = roomName;
    } else if (friendlyName && !friendlyName.startsWith('RINCON_')) {
        name = friendlyName;
    } else if (modelName) {
        name = modelName;
    } else {
        name = 'Unknown DLNA Device';
    }
    let controlUrl = '';
    let renderingControlUrl = '';
    // Find all service blocks
    const serviceRegex = /<service>(.*?)<\/service>/gs;
    let match: null | RegExpExecArray;
    while ((match = serviceRegex.exec(xml)) !== null) {
        const block = match[1];
        const typeMatch = block.match(/<serviceType>([^<]+)<\/serviceType>/);
        const urlMatch = block.match(/<controlURL>([^<]+)<\/controlURL>/);
        if (typeMatch && urlMatch) {
            const svcType = typeMatch[1].trim();
            const svcUrl = urlMatch[1].trim();
            const fullUrl = svcUrl.startsWith('http')
                ? svcUrl
                : base + (svcUrl.startsWith('/') ? '' : '/') + svcUrl;
            if (svcType === AV_TRANSPORT_URN) controlUrl = fullUrl;
            if (svcType === RENDERING_CONTROL_URN) renderingControlUrl = fullUrl;
        }
    }
    if (!controlUrl) return null;
    return {
        controlUrl,
        id: udn?.[1] ?? location,
        location,
        name,
        renderingControlUrl: renderingControlUrl || controlUrl,
    };
}
