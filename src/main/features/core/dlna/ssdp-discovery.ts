import { execFile } from 'child_process';

import { DlnaDevice } from './soap-client';

// Complete discovery script that runs in a child Node process to bypass
// macOS Electron sandbox restrictions on UDP multicast and LAN HTTP requests.
// Returns JSON array of DlnaDevice objects on stdout.
const DISCOVERY_SCRIPT = `
const dgram = require('dgram');
const http = require('http');

const MEDIA_RENDERER_URN = 'urn:schemas-upnp-org:device:MediaRenderer:1';
const AV_TRANSPORT_URN = 'urn:schemas-upnp-org:service:AVTransport:1';
const RENDERING_CONTROL_URN = 'urn:schemas-upnp-org:service:RenderingControl:1';

const locations = [];
const seen = new Set();

const message = Buffer.from(
    'M-SEARCH * HTTP/1.1\\r\\n' +
    'HOST: 239.255.255.250:1900\\r\\n' +
    'MAN: "ssdp:discover"\\r\\n' +
    'MX: 3\\r\\n' +
    'ST: ' + MEDIA_RENDERER_URN + '\\r\\n' +
    '\\r\\n'
);

const socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });
socket.on('message', (msg) => {
    const text = msg.toString();
    const loc = text.match(/LOCATION:\\s*(.+)\\r?\\n/i);
    if (loc) {
        const location = loc[1].trim();
        if (!seen.has(location)) {
            seen.add(location);
            locations.push(location);
        }
    }
});
socket.on('error', () => {});
socket.send(message, 0, message.length, 1900, '239.255.255.250');
setTimeout(() => socket.send(message, 0, message.length, 1900, '239.255.255.250'), 500);
setTimeout(() => socket.send(message, 0, message.length, 1900, '239.255.255.250'), 1500);

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
    // Simple XML parsing without external dependencies
    const friendly = xml.match(/<friendlyName>([^<]+)<\\/friendlyName>/);
    const udn = xml.match(/<UDN>([^<]+)<\\/UDN>/);

    const baseUrl = new URL(location);
    const base = baseUrl.protocol + '//' + baseUrl.host;

    let controlUrl = '';
    let renderingControlUrl = '';

    // Find all service blocks
    const serviceRegex = /<service>(.*?)<\\/service>/gs;
    let match;
    while ((match = serviceRegex.exec(xml)) !== null) {
        const block = match[1];
        const typeMatch = block.match(/<serviceType>([^<]+)<\\/serviceType>/);
        const urlMatch = block.match(/<controlURL>([^<]+)<\\/controlURL>/);
        if (typeMatch && urlMatch) {
            const svcType = typeMatch[1];
            const svcUrl = urlMatch[1];
            const fullUrl = svcUrl.startsWith('http') ? svcUrl : base + (svcUrl.startsWith('/') ? '' : '/') + svcUrl;
            if (svcType === AV_TRANSPORT_URN) controlUrl = fullUrl;
            if (svcType === RENDERING_CONTROL_URN) renderingControlUrl = fullUrl;
        }
    }

    if (!controlUrl) return null;

    return {
        id: udn ? udn[1] : location,
        name: friendly ? friendly[1] : 'Unknown DLNA Device',
        location: location,
        controlUrl: controlUrl,
        renderingControlUrl: renderingControlUrl || controlUrl,
    };
}

setTimeout(async () => {
    socket.close();
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

export async function discoverDevices(timeout: number = 10000): Promise<DlnaDevice[]> {
    return new Promise((resolve) => {
        const nodePath = '/usr/local/bin/node';
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

        child.on('error', () => {
            resolve([]);
        });
    });
}
