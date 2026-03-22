import { ipcMain } from 'electron';
import http from 'http';
import os from 'os';
import { getMainWindow } from '../../../index';
import { createLog } from '../../../utils';
import {
    DlnaDevice,
    getPositionInfo,
    getTransportInfo,
    getVolume,
    pause,
    play,
    seek,
    setAVTransportURI,
    setMute,
    setNextAVTransportURI,
    setVolume,
    stop,
    TrackMetadata,
} from './soap-client';
import { discoverDevices } from './ssdp-discovery';

let connectedDevice: DlnaDevice | null = null;
let positionPollingInterval: NodeJS.Timeout | null = null;
let lastKnownPosition = 0;
let hasStartedPlaying = false;
let trackLoadedAt = 0;
let lastKnownTransportState = '';
let lastKnownDeviceVolume = -1;
let lastCommandedUri = '';
let lastQueuedNextUri = '';
let lastAppSeekAt = 0;
let eventServer: http.Server | null = null;
let eventServerPort = 0;
let subscriptionSid: string | null = null;
let subscriptionRenewalTimeout: NodeJS.Timeout | null = null;

function getLanIp(): null | string {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name] || []) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return null;
}

function rewriteUrlForLan(url: string): string {
    const lanIp = getLanIp();
    if (!lanIp) return url;
    return url
        .replace(/http:\/\/localhost(:\d+)/, `http://${lanIp}$1`)
        .replace(/http:\/\/127\.0\.0\.1(:\d+)/, `http://${lanIp}$1`)
        .replace(/http:\/\/\[::1\](:\d+)/, `http://${lanIp}$1`)
        .replace(/http:\/\/\[::\](:\d+)/, `http://${lanIp}$1`);
}

const dlnaLog = (action: string, err?: unknown) => {
    const message = `[DLNA] ${action}`;
    createLog({ message, type: err ? 'error' : 'info' });
    if (err) {
        console.error(message, err);
    }
};
function getEventUrl(device: DlnaDevice): string {
    return device.controlUrl.replace(/\/Control$/, '/Event');
}

async function waitForTransportState(
    device: DlnaDevice,
    states: string[],
    maxWaitMs: number,
): Promise<void> {
    const interval = 150;
    const attempts = Math.ceil(maxWaitMs / interval);
    for (let i = 0; i < attempts; i++) {
        await new Promise((r) => setTimeout(r, interval));
        try {
            const state = await getTransportInfo(device);
            if (states.includes(state)) return;
        } catch {
        }
    }
}

function handleEventNotify(body: string): void {
    const lastChangeMatch = body.match(/<LastChange>([\s\S]*?)<\/LastChange>/);
    if (!lastChangeMatch) return;
    const innerXml = lastChangeMatch[1]
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&apos;/g, "'")
        .replace(/&quot;/g, '"');
    const uriMatch = innerXml.match(/<AVTransportURI[^>]+\bval="([^"]*)"/);
    if (!uriMatch) return;
    const newUri = uriMatch[1]
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&apos;/g, "'")
        .replace(/&quot;/g, '"');
    if (!newUri || newUri === lastCommandedUri) return;
    if (!lastCommandedUri) return;
    if (lastQueuedNextUri && newUri === lastQueuedNextUri) {
        dlnaLog('Event: advanced to next track');
        lastCommandedUri = newUri;
        lastQueuedNextUri = '';
        hasStartedPlaying = true;
        trackLoadedAt = Date.now();
        lastKnownPosition = 0;
        getMainWindow()?.webContents.send('renderer-dlna-track-ended');
    } else {
        dlnaLog('Event: device went to previous track');
        lastCommandedUri = newUri;
        lastQueuedNextUri = '';
        hasStartedPlaying = true;
        trackLoadedAt = Date.now();
        lastKnownPosition = 0;
        getMainWindow()?.webContents.send('renderer-dlna-prev-track');
    }
}

async function startEventSubscription(device: DlnaDevice): Promise<void> {
    const lanIp = getLanIp();
    if (!lanIp) {
        dlnaLog('Cannot subscribe to events: no LAN IP found');
        return;
    }
    if (!eventServer) {
        eventServer = http.createServer((req, res) => {
            if (req.method === 'NOTIFY') {
                let body = '';
                req.on('data', (chunk) => (body += chunk.toString()));
                req.on('end', () => {
                    res.writeHead(200);
                    res.end();
                    handleEventNotify(body);
                });
            } else {
                res.writeHead(405);
                res.end();
            }
        });
        await new Promise<void>((resolve) => {
            eventServer!.listen(0, '0.0.0.0', () => {
                const addr = eventServer!.address();
                eventServerPort = typeof addr === 'object' && addr ? addr.port : 0;
                dlnaLog(`Event callback server started on port ${eventServerPort}`);
                resolve();
            });
        });
    }
    const eventUrl = getEventUrl(device);
    const callbackUrl = `http://${lanIp}:${eventServerPort}/notify`;
    try {
        const parsedUrl = new URL(eventUrl);
        const sid = await new Promise<string>((resolve, reject) => {
            const reqOptions: http.RequestOptions = {
                hostname: parsedUrl.hostname,
                method: 'SUBSCRIBE',
                path: parsedUrl.pathname,
                port: parsedUrl.port || '1400',
                headers: {
                    CALLBACK: `<${callbackUrl}>`,
                    NT: 'upnp:event',
                    TIMEOUT: 'Second-1800',
                },
            };
            const req = http.request(reqOptions, (res) => {
                const sid = res.headers['sid'] as string | undefined;
                res.resume();
                if (sid) {
                    resolve(sid);
                } else {
                    reject(new Error('No SID in SUBSCRIBE response'));
                }
            });
            req.on('error', reject);
            req.setTimeout(5000, () => req.destroy(new Error('SUBSCRIBE timed out')));
            req.end();
        });
        subscriptionSid = sid;
        dlnaLog(`Subscribed to AVTransport events (SID: ${sid})`);
        subscriptionRenewalTimeout = setTimeout(
            () => renewEventSubscription(device),
            25 * 60 * 1000,
        );
    } catch (err) {
        dlnaLog('Failed to subscribe to AVTransport events prev/next detection unavailable', err);
    }
}

async function renewEventSubscription(device: DlnaDevice): Promise<void> {
    if (!subscriptionSid) return;
    const eventUrl = getEventUrl(device);
    try {
        const parsedUrl = new URL(eventUrl);
        await new Promise<void>((resolve, reject) => {
            const reqOptions: http.RequestOptions = {
                hostname: parsedUrl.hostname,
                method: 'SUBSCRIBE',
                path: parsedUrl.pathname,
                port: parsedUrl.port || '1400',
                headers: {
                    SID: subscriptionSid!,
                    TIMEOUT: 'Second-1800',
                },
            };
            const req = http.request(reqOptions, (res) => {
                res.resume();
                resolve();
            });
            req.on('error', reject);
            req.setTimeout(5000, () => req.destroy(new Error('Renewal timed out')));
            req.end();
        });
        dlnaLog('Renewed AVTransport event subscription');
        subscriptionRenewalTimeout = setTimeout(
            () => renewEventSubscription(device),
            25 * 60 * 1000,
        );
    } catch (err) {
        dlnaLog('Failed to renew event subscription', err);
    }
}
async function stopEventSubscription(device: DlnaDevice): Promise<void> {
    if (subscriptionRenewalTimeout) {
        clearTimeout(subscriptionRenewalTimeout);
        subscriptionRenewalTimeout = null;
    }
    if (subscriptionSid) {
        const eventUrl = getEventUrl(device);
        try {
            const parsedUrl = new URL(eventUrl);
            await new Promise<void>((resolve) => {
                const reqOptions: http.RequestOptions = {
                    hostname: parsedUrl.hostname,
                    method: 'UNSUBSCRIBE',
                    path: parsedUrl.pathname,
                    port: parsedUrl.port || '1400',
                    headers: { SID: subscriptionSid! },
                };
                const req = http.request(reqOptions, (res) => {
                    res.resume();
                    resolve();
                });
                req.on('error', () => resolve()); // best-effort
                req.setTimeout(3000, () => {
                    req.destroy();
                    resolve();
                });
                req.end();
            });
            dlnaLog('Unsubscribed from AVTransport events');
        } catch {
        }
        subscriptionSid = null;
    }
    if (eventServer) {
        eventServer.close();
        eventServer = null;
        eventServerPort = 0;
    }
}

function startPositionPolling() {
    stopPositionPolling();
    positionPollingInterval = setInterval(async () => {
        if (!connectedDevice) return;
        // Don't poll during the first few seconds after loading a track
        const timeSinceLoad = Date.now() - trackLoadedAt;
        if (timeSinceLoad < 2000) return;
        try {
            const [posInfo, transportState] = await Promise.all([
                getPositionInfo(connectedDevice),
                getTransportInfo(connectedDevice),
            ]);
            getMainWindow()?.webContents.send('renderer-dlna-current-time', posInfo.position);
            // Track that playback has started
            if (transportState === 'PLAYING' || transportState === 'TRANSITIONING') {
                hasStartedPlaying = true;
            }
            const previousPosition = lastKnownPosition;
            lastKnownPosition = posInfo.position;
            const uriReportedByDevice =
                !!posInfo.trackUri && posInfo.trackUri !== 'NOT_IMPLEMENTED';
            const recentAppSeek = Date.now() - lastAppSeekAt < 3000;
            // Detect gapless transition: position jumped backward significantly
            if (
                hasStartedPlaying &&
                uriReportedByDevice &&
                posInfo.trackUri === lastCommandedUri &&
                previousPosition > 2 &&
                posInfo.position < 3 &&
                posInfo.position < previousPosition - 2 &&
                !recentAppSeek
            ) {
                dlnaLog(
                    `Position-based prev detected: ${previousPosition}s -> ${posInfo.position}s`,
                );
                trackLoadedAt = Date.now();
                lastKnownPosition = 0;
                getMainWindow()?.webContents.send('renderer-dlna-prev-track');
            }
            // Detect track ended via STOPPED state (non-gapless / end of queue)
            if (hasStartedPlaying && transportState === 'STOPPED') {
                dlnaLog('Track ended (stopped), advancing queue');
                hasStartedPlaying = false;
                getMainWindow()?.webContents.send('renderer-dlna-track-ended');
            }
            if (
                transportState !== lastKnownTransportState &&
                transportState !== 'TRANSITIONING'
            ) {
                lastKnownTransportState = transportState;
                getMainWindow()?.webContents.send(
                    'renderer-dlna-transport-state',
                    transportState,
                );
            }
            try {
                const deviceVolume = await getVolume(connectedDevice);
                if (deviceVolume !== lastKnownDeviceVolume) {
                    lastKnownDeviceVolume = deviceVolume;
                    getMainWindow()?.webContents.send('renderer-dlna-volume', deviceVolume);
                }
            } catch {
            }
        } catch {
            // Polling errors are expected during track transitions
        }
    }, 1000);
}

function stopPositionPolling() {
    if (positionPollingInterval) {
        clearInterval(positionPollingInterval);
        positionPollingInterval = null;
    }
}

// Discover DLNA devices on the network
ipcMain.handle('dlna-discover', async () => {
    try {
        dlnaLog('Discovering devices...');
        const devices = await discoverDevices(5000);
        dlnaLog(`Found ${devices.length} device(s): ${JSON.stringify(devices.map((d) => d.name))}`);
        return devices;
    } catch (err) {
        dlnaLog('Discovery failed', err);
        return [];
    }
});

// Connect to a specific DLNA device
ipcMain.handle('dlna-connect', async (_event, device: DlnaDevice) => {
    try {
        if (connectedDevice) {
            await stopEventSubscription(connectedDevice);
        }
        connectedDevice = device;
        lastKnownPosition = 0;
        hasStartedPlaying = false;
        trackLoadedAt = Date.now();
        lastKnownTransportState = '';
        lastKnownDeviceVolume = -1;
        lastCommandedUri = '';
        lastQueuedNextUri = '';
        startPositionPolling();
        await startEventSubscription(device);
        dlnaLog(`Connected to ${device.name}`);
        // Get current volume from device to sync UI
        let deviceVolume = 50;
        try {
            deviceVolume = await getVolume(device);
            lastKnownDeviceVolume = deviceVolume;
            dlnaLog(`Device volume: ${deviceVolume}`);
        } catch {
            // Use default
        }
        return { success: true, volume: deviceVolume };
    } catch (err) {
        dlnaLog(`Failed to connect to ${device.name}`, err);
        return { success: false, volume: 50 };
    }
});

// Disconnect from the current device
ipcMain.handle('dlna-disconnect', async () => {
    try {
        if (connectedDevice) {
            try {
                await stop(connectedDevice);
            } catch {
                // Ignore stop errors during disconnect
            }
            await stopEventSubscription(connectedDevice);
            dlnaLog(`Disconnected from ${connectedDevice.name}`);
        }
        connectedDevice = null;
        stopPositionPolling();
        return true;
    } catch (err) {
        dlnaLog('Failed to disconnect', err);
        if (connectedDevice) {
            await stopEventSubscription(connectedDevice).catch(() => {});
        }
        connectedDevice = null;
        stopPositionPolling();
        return false;
    }
});

// Play a track on the connected device
ipcMain.on('dlna-play-url', async (_event, data: { metadata: TrackMetadata; url: string }) => {
    if (!connectedDevice) return;
    const device = connectedDevice;
    try {
        hasStartedPlaying = false;
        lastKnownPosition = 0;
        lastAppSeekAt = 0;
        trackLoadedAt = Date.now();
        const lanUrl = rewriteUrlForLan(data.url);
        lastCommandedUri = lanUrl;
        lastQueuedNextUri = '';
        const lanArtUrl = data.metadata.albumArtUrl
            ? rewriteUrlForLan(data.metadata.albumArtUrl)
            : undefined;
        const metadata = { ...data.metadata, albumArtUrl: lanArtUrl };
        await setAVTransportURI(device, lanUrl, metadata);
        await waitForTransportState(device, ['STOPPED', 'PAUSED_PLAYBACK'], 1500);
        await play(device);
        dlnaLog(`Playing: ${data.metadata.title}`);
    } catch (err) {
        dlnaLog(`Failed to play ${data.metadata.title}`, err);
    }
});

// Set the next track for gapless playback
ipcMain.on('dlna-set-next-url', async (_event, data: { metadata: TrackMetadata; url: string }) => {
    if (!connectedDevice) return;
    try {
        const lanUrl = rewriteUrlForLan(data.url);
        lastQueuedNextUri = lanUrl;
        const lanArtUrl = data.metadata.albumArtUrl
            ? rewriteUrlForLan(data.metadata.albumArtUrl)
            : undefined;
        const metadata = { ...data.metadata, albumArtUrl: lanArtUrl };
        await setNextAVTransportURI(connectedDevice, lanUrl, metadata);
        dlnaLog(`Set next track: ${data.metadata.title}`);
    } catch (err) {
        dlnaLog(`Failed to set next track ${data.metadata.title}`, err);
    }
});

// Resume playback
ipcMain.on('dlna-play', async () => {
    if (!connectedDevice) return;
    try {
        await play(connectedDevice);
    } catch (err) {
        dlnaLog('Failed to resume playback', err);
    }
});

// Pause playback
ipcMain.on('dlna-pause', async () => {
    if (!connectedDevice) return;
    try {
        await pause(connectedDevice);
    } catch (err) {
        dlnaLog('Failed to pause', err);
    }
});

// Stop playback
ipcMain.on('dlna-stop', async () => {
    if (!connectedDevice) return;
    try {
        await stop(connectedDevice);
    } catch (err) {
        dlnaLog('Failed to stop', err);
    }
});

// Seek to position
ipcMain.on('dlna-seek', async (_event, seconds: number) => {
    if (!connectedDevice) return;
    try {
        lastAppSeekAt = Date.now();
        await seek(connectedDevice, seconds);
    } catch (err) {
        dlnaLog(`Failed to seek to ${seconds}`, err);
    }
});

// Set volume (0-100)
ipcMain.on('dlna-volume', async (_event, value: number) => {
    if (!connectedDevice) return;
    try {
        await setVolume(connectedDevice, value);
        lastKnownDeviceVolume = value;
    } catch (err) {
        dlnaLog(`Failed to set volume to ${value}`, err);
    }
});

// Set mute
ipcMain.on('dlna-mute', async (_event, muted: boolean) => {
    if (!connectedDevice) return;
    try {
        await setMute(connectedDevice, muted);
    } catch (err) {
        dlnaLog(`Failed to set mute to ${muted}`, err);
    }
});

// Get current position
ipcMain.handle('dlna-get-position', async () => {
    if (!connectedDevice) return 0;
    try {
        const info = await getPositionInfo(connectedDevice);
        return info.position;
    } catch {
        return lastKnownPosition;
    }
});
