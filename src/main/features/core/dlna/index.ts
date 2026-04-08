import type { DlnaDevice, SpeakerProperties, TrackMetadata } from '/@/shared/types/dlna';

import { ipcMain } from 'electron';
import http from 'http';
import os from 'os';

import { getMainWindow } from '../../../index';
import { createLog } from '../../../utils';
import {
    becomeCoordinatorOfStandaloneGroup,
    getBass,
    getButtonLockState,
    getCrossfadeMode,
    getLEDState,
    getLoudness,
    getPositionInfo,
    getRinconId,
    getTopologyEventUrl,
    getTransportInfo,
    getTreble,
    getVolume,
    joinGroup,
    pause,
    play,
    seek,
    setAVTransportURI,
    setBass,
    setButtonLockState,
    setCrossfadeMode,
    setLEDState,
    setLoudness,
    setMute,
    setNextAVTransportURI,
    setTreble,
    setVolume,
    stop,
} from './soap-client';
import { discoverDevices } from './ssdp-discovery';

let connectedDevice: DlnaDevice | null = null;
let currentCoordinatorId = '';
let positionPollingInterval: NodeJS.Timeout | null = null;
let lastKnownPosition = 0;
let hasStartedPlaying = false;
let trackLoadedAt = 0;
let lastKnownTransportState = '';
let lastKnownDeviceVolume = -1;
let lastCommandedUri = '';
let lastQueuedNextUri = '';
let lastAppSeekAt = 0;
let pendingPrevTrack = false;
let isRadioMode = false;
let groupMembers: DlnaDevice[] = [];
let groupMemberVolumes: Record<string, number> = {};
let topologySubscriptionSid: null | string = null;
let topologyRenewalTimeout: NodeJS.Timeout | null = null;
let eventServer: http.Server | null = null;
let eventServerPort = 0;
let subscriptionSid: null | string = null;
let subscriptionRenewalTimeout: NodeJS.Timeout | null = null;
let topologyPollingInterval: NodeJS.Timeout | null = null;

function getLanIp(): null | string {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name] || []) {
            if (iface.family === 'IPv4' && !iface.internal) return iface.address;
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
    if (err) console.error(message, err);
};

async function ensureEventServer(): Promise<void> {
    if (eventServer) return;
    eventServer = http.createServer((req, res) => {
        if (req.method !== 'NOTIFY') {
            res.writeHead(405);
            res.end();
            return;
        }
        let body = '';
        req.on('data', (chunk) => (body += chunk.toString()));
        req.on('end', () => {
            res.writeHead(200);
            res.end();
            if (req.url === '/topology') handleTopologyNotify(body);
            else handleEventNotify(body);
        });
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

function fetchXml(url: string): Promise<string> {
    return new Promise((resolve) => {
        const req = http.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => (data += chunk));
            res.on('end', () => resolve(data));
        });
        req.on('error', () => resolve(''));
        req.setTimeout(3000, () => {
            req.destroy();
            resolve('');
        });
    });
}

async function fullDisconnect(): Promise<void> {
    if (groupMembers.length > 1 && connectedDevice) {
        const members = groupMembers.filter((m) => m.id !== connectedDevice!.id);
        await Promise.allSettled(
            members.map(async (m) => {
                try {
                    await stop(m);
                } catch {
                    // Catch
                }
                try {
                    await becomeCoordinatorOfStandaloneGroup(m);
                } catch {
                    // Catch
                }
            }),
        );
    }
    if (connectedDevice) {
        try {
            await stop(connectedDevice);
        } catch {
            // Catch
        }
        await stopEventSubscription(connectedDevice);
        await stopTopologySubscription(connectedDevice);
        dlnaLog(`Disconnected from ${connectedDevice.name}`);
    }
    connectedDevice = null;
    currentCoordinatorId = '';
    groupMembers = [];
    groupMemberVolumes = {};
    isRadioMode = false;
    stopPositionPolling();
    if (topologyPollingInterval) {
        clearInterval(topologyPollingInterval);
        topologyPollingInterval = null;
    }
    sendGroupStateToRenderer();
    if (eventServer) {
        eventServer.close();
        eventServer = null;
        eventServerPort = 0;
    }
}

function getAttr(attrString: string, name: string): string {
    const m = attrString.match(new RegExp(`\\b${name}="([^"]*)"`));
    return m ? m[1] : '';
}

function getEventUrl(device: DlnaDevice): string {
    return device.controlUrl.replace(/\/Control$/, '/Event');
}

function handleEventNotify(body: string): void {
    if (isRadioMode) return;
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
    if (!newUri || newUri === lastCommandedUri) {
        if (lastQueuedNextUri && newUri === lastQueuedNextUri) {
            dlnaLog('Gapless same-URI loop detected (event)');
            lastCommandedUri = newUri;
            lastQueuedNextUri = '';
            hasStartedPlaying = true;
            trackLoadedAt = Date.now();
            lastKnownPosition = 0;
            getMainWindow()?.webContents.send('renderer-dlna-track-ended');
        }
        return;
    }
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

function handleTopologyNotify(xml: string): void {
    try {
        const match = xml.match(/<ZoneGroupState>([\s\S]*?)<\/ZoneGroupState>/);
        if (!match) return;
        const decodedXml = match[1]
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&amp;/g, '&');
        if (!connectedDevice) return;
        const myRinconId = getRinconId(connectedDevice);
        const zoneGroupRegex = /<ZoneGroup[^>]*>[\s\S]*?<\/ZoneGroup>/g;
        const zoneGroups = decodedXml.match(zoneGroupRegex);
        if (!zoneGroups) return;
        const newMembers: DlnaDevice[] = [];
        let newCoordinatorRincon = '';
        for (const group of zoneGroups) {
            if (!group.includes(myRinconId)) continue;
            const groupTagMatch = group.match(/^<ZoneGroup([^>]*)>/);
            if (groupTagMatch) {
                newCoordinatorRincon = getAttr(groupTagMatch[1], 'Coordinator');
            }
            const memberTagRegex = /<ZoneGroupMember([^>]*)\/?>/g;
            let tagMatch: null | RegExpExecArray;
            while ((tagMatch = memberTagRegex.exec(group)) !== null) {
                const attrs = tagMatch[1];
                const uuid = getAttr(attrs, 'UUID');
                const location = getAttr(attrs, 'Location');
                const zoneName = getAttr(attrs, 'ZoneName');
                if (!uuid || !location) continue;
                const existingMember = groupMembers.find((m) => m.id === `uuid:${uuid}`);
                const finalName = existingMember ? existingMember.name : zoneName || uuid;
                try {
                    const base = new URL(location);
                    const baseUrl = `${base.protocol}//${base.hostname}:1400`;
                    newMembers.push({
                        controlUrl: `${baseUrl}/MediaRenderer/AVTransport/Control`,
                        id: `uuid:${uuid}`,
                        location,
                        name: finalName,
                        renderingControlUrl: `${baseUrl}/MediaRenderer/RenderingControl/Control`,
                    });
                    if (!existingMember) {
                        fetchXml(location)
                            .then((descXml) => {
                                const modelMatch = descXml.match(/<modelName>(.*?)<\/modelName>/);
                                if (modelMatch && modelMatch[1]) {
                                    const formattedName = `${zoneName} (${modelMatch[1]})`;
                                    const idx = groupMembers.findIndex(
                                        (m) => m.id === `uuid:${uuid}`,
                                    );
                                    if (idx !== -1 && groupMembers[idx].name !== formattedName) {
                                        groupMembers[idx].name = formattedName;
                                        sendGroupStateToRenderer();
                                    }
                                }
                            })
                            .catch(() => {});
                    }
                } catch {
                    // Skip members with unparseable locations
                }
            }
            break;
        }
        let newCoordinatorId = newCoordinatorRincon ? `uuid:${newCoordinatorRincon}` : '';
        if (newMembers.length === 1 && connectedDevice) {
            newCoordinatorId = connectedDevice.id;
        }
        const hasTopologyChanged =
            newMembers.length !== groupMembers.length ||
            newCoordinatorId !== currentCoordinatorId ||
            newMembers.some((m, i) => m.id !== groupMembers[i]?.id);
        if (hasTopologyChanged) {
            groupMembers = newMembers;
            currentCoordinatorId = newCoordinatorId;
            dlnaLog(`Topology Change Detected: Group size is now ${groupMembers.length}`);
            sendGroupStateToRenderer();
        }
    } catch (error) {
        dlnaLog('Topology parse error', error);
    }
}

function refreshTopology() {
    if (!connectedDevice) return;
    try {
        const parsedUrl = new URL(connectedDevice.controlUrl);
        const controlUrl = `http://${parsedUrl.hostname}:1400/ZoneGroupTopology/Control`;
        const body = `<?xml version="1.0" encoding="utf-8"?>
            <s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
                <s:Body>
                    <u:GetZoneGroupState xmlns:u="urn:schemas-upnp-org:service:ZoneGroupTopology:1"></u:GetZoneGroupState>
                </s:Body>
            </s:Envelope>`;
        const req = http.request(
            controlUrl,
            {
                headers: {
                    Connection: 'close',
                    'Content-Type': 'text/xml; charset="utf-8"',
                    SOAPAction:
                        '"urn:schemas-upnp-org:service:ZoneGroupTopology:1#GetZoneGroupState"',
                },
                method: 'POST',
            },
            (res) => {
                let data = '';
                res.on('data', (chunk) => (data += chunk));
                res.on('end', () => {
                    if (data.includes('GetZoneGroupStateResponse')) {
                        handleTopologyNotify(data);
                    }
                });
            },
        );
        req.on('error', () => {});
        req.write(body);
        req.end();
    } catch {
        // Catch
    }
}

async function renewEventSubscription(device: DlnaDevice): Promise<void> {
    if (!subscriptionSid) return;
    try {
        const parsedUrl = new URL(getEventUrl(device));
        await new Promise<void>((resolve, reject) => {
            const req = http.request(
                {
                    headers: { SID: subscriptionSid!, TIMEOUT: 'Second-1800' },
                    hostname: parsedUrl.hostname,
                    method: 'SUBSCRIBE',
                    path: parsedUrl.pathname,
                    port: parsedUrl.port || '1400',
                },
                (res) => {
                    res.resume();
                    resolve();
                },
            );
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

async function renewTopologySubscription(device: DlnaDevice): Promise<void> {
    if (!topologySubscriptionSid) return;
    try {
        const parsedUrl = new URL(getTopologyEventUrl(device));
        await new Promise<void>((resolve, reject) => {
            const req = http.request(
                {
                    headers: { SID: topologySubscriptionSid!, TIMEOUT: 'Second-1800' },
                    hostname: parsedUrl.hostname,
                    method: 'SUBSCRIBE',
                    path: parsedUrl.pathname,
                    port: parsedUrl.port || '1400',
                },
                (res) => {
                    res.resume();
                    resolve();
                },
            );
            req.on('error', reject);
            req.setTimeout(5000, () => req.destroy(new Error('Topology renewal timed out')));
            req.end();
        });
        dlnaLog('Renewed ZoneGroupTopology subscription');
        topologyRenewalTimeout = setTimeout(
            () => renewTopologySubscription(device),
            25 * 60 * 1000,
        );
    } catch (err) {
        dlnaLog('Failed to renew topology subscription', err);
    }
}

function sendGroupStateToRenderer(): void {
    const state = groupMembers.map((m) => ({
        device: m,
        isCoordinator:
            m.id === currentCoordinatorId ||
            (!currentCoordinatorId && m.id === connectedDevice?.id),
        volume: groupMemberVolumes[m.id] ?? 50,
    }));
    getMainWindow()?.webContents.send('renderer-dlna-group-state', state);
}

async function startEventSubscription(device: DlnaDevice): Promise<void> {
    const lanIp = getLanIp();
    if (!lanIp) {
        dlnaLog('Cannot subscribe to events: no LAN IP found');
        return;
    }
    await ensureEventServer();
    const callbackUrl = `http://${lanIp}:${eventServerPort}/notify`;
    try {
        const parsedUrl = new URL(getEventUrl(device));
        const sid = await new Promise<string>((resolve, reject) => {
            const req = http.request(
                {
                    headers: {
                        CALLBACK: `<${callbackUrl}>`,
                        NT: 'upnp:event',
                        TIMEOUT: 'Second-1800',
                    },
                    hostname: parsedUrl.hostname,
                    method: 'SUBSCRIBE',
                    path: parsedUrl.pathname,
                    port: parsedUrl.port || '1400',
                },
                (res) => {
                    const sid = res.headers['sid'] as string | undefined;
                    res.resume();
                    if (sid) resolve(sid);
                    else reject(new Error('No SID'));
                },
            );
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
        dlnaLog('Failed to subscribe to AVTransport events', err);
    }
}

function startPositionPolling() {
    stopPositionPolling();
    positionPollingInterval = setInterval(async () => {
        if (!connectedDevice) return;
        // Don't poll during the first few seconds after loading a track
        if (Date.now() - trackLoadedAt < 50) return;
        // Started polling much sooner, most of the failed DLNA commands I've seen occurred earlier than this, and position info
        // early in the song is good. I tested with a few configurations, this works well, I believe.
        try {
            const [posInfo, transportState] = await Promise.all([
                getPositionInfo(connectedDevice),
                getTransportInfo(connectedDevice),
            ]);
            getMainWindow()?.webContents.send('renderer-dlna-current-time', posInfo.position);
            // Track that playback has started
            if (transportState === 'PLAYING' || transportState === 'TRANSITIONING')
                hasStartedPlaying = true;

            const previousPosition = lastKnownPosition;
            lastKnownPosition = posInfo.position;
            const uriReportedByDevice =
                !!posInfo.trackUri && posInfo.trackUri !== 'NOT_IMPLEMENTED';
            const recentAppSeek = Date.now() - lastAppSeekAt < 3000;
            // Detect gapless transition: position jumped backward significantly
            if (!isRadioMode) {
                if (
                    hasStartedPlaying &&
                    uriReportedByDevice &&
                    posInfo.trackUri !== lastCommandedUri &&
                    lastQueuedNextUri &&
                    posInfo.trackUri === lastQueuedNextUri
                ) {
                    dlnaLog(
                        `Polling: advanced to next track (${lastCommandedUri} → ${posInfo.trackUri})`,
                    );
                    lastCommandedUri = posInfo.trackUri;
                    lastQueuedNextUri = '';
                    trackLoadedAt = Date.now();
                    lastKnownPosition = 0;
                    getMainWindow()?.webContents.send('renderer-dlna-track-ended');
                }

                if (pendingPrevTrack) {
                    pendingPrevTrack = false;
                    if (transportState !== 'STOPPED') {
                        dlnaLog(`Position-based prev confirmed`);
                        trackLoadedAt = Date.now();
                        lastKnownPosition = 0;
                        getMainWindow()?.webContents.send('renderer-dlna-prev-track');
                    }
                }
                if (
                    !pendingPrevTrack &&
                    hasStartedPlaying &&
                    transportState !== 'STOPPED' &&
                    uriReportedByDevice &&
                    posInfo.trackUri === lastCommandedUri &&
                    previousPosition > 1 &&
                    posInfo.position < 2 &&
                    posInfo.position < previousPosition - 2 &&
                    !recentAppSeek
                ) {
                    dlnaLog(
                        `Position-based prev pending: ${previousPosition}s -> ${posInfo.position}s`,
                    );
                    pendingPrevTrack = true;
                }
                if (hasStartedPlaying && transportState === 'STOPPED') {
                    pendingPrevTrack = false;
                    dlnaLog('Track ended (stopped), advancing queue');
                    hasStartedPlaying = false;
                    getMainWindow()?.webContents.send('renderer-dlna-track-ended');
                }
            } else if (hasStartedPlaying && transportState === 'STOPPED') {
                hasStartedPlaying = false;
                dlnaLog('Radio stream stopped on device');
            }

            if (transportState !== lastKnownTransportState && transportState !== 'TRANSITIONING') {
                lastKnownTransportState = transportState;
                getMainWindow()?.webContents.send('renderer-dlna-transport-state', transportState);
            }

            try {
                const deviceVolume = await getVolume(connectedDevice);
                if (deviceVolume !== lastKnownDeviceVolume) {
                    lastKnownDeviceVolume = deviceVolume;
                    if (groupMembers.length > 0) {
                        groupMemberVolumes[connectedDevice.id] = deviceVolume;
                        getMainWindow()?.webContents.send('renderer-dlna-group-member-volume', {
                            deviceId: connectedDevice.id,
                            volume: deviceVolume,
                        });
                    }
                    getMainWindow()?.webContents.send('renderer-dlna-volume', deviceVolume);
                }
            } catch {
                // Volume errors are non-fatal
            }

            if (groupMembers.length > 1) {
                for (const member of groupMembers) {
                    if (member.id === connectedDevice.id) continue;
                    try {
                        const vol = await getVolume(member);
                        if (vol !== groupMemberVolumes[member.id]) {
                            groupMemberVolumes[member.id] = vol;
                            getMainWindow()?.webContents.send('renderer-dlna-group-member-volume', {
                                deviceId: member.id,
                                volume: vol,
                            });
                        }
                    } catch {
                        // Non-fatal
                    }
                }
            }
        } catch {
            // Polling errors are expected during track transitions
        }
    }, 350);
    // IMPORTANT: This used to be 1000, but I believe that was not tested explicitly and arbitrary, and we get
    // benefit from somewhat smaller polling intervals, so I changed it with tests. This might prove too small
    // for some network configurations, so if need be, I'll make this a setting later.
}

function startTopologyPolling() {
    if (topologyPollingInterval) clearInterval(topologyPollingInterval);
    topologyPollingInterval = setInterval(refreshTopology, 4000);
}

async function startTopologySubscription(device: DlnaDevice): Promise<void> {
    const lanIp = getLanIp();
    if (!lanIp) return;
    await ensureEventServer();
    const callbackUrl = `http://${lanIp}:${eventServerPort}/topology`;
    try {
        const parsedUrl = new URL(getTopologyEventUrl(device));
        const sid = await new Promise<string>((resolve, reject) => {
            const req = http.request(
                {
                    headers: {
                        CALLBACK: `<${callbackUrl}>`,
                        NT: 'upnp:event',
                        TIMEOUT: 'Second-1800',
                    },
                    hostname: parsedUrl.hostname,
                    method: 'SUBSCRIBE',
                    path: parsedUrl.pathname,
                    port: parsedUrl.port || '1400',
                },
                (res) => {
                    const sid = res.headers['sid'] as string | undefined;
                    res.resume();
                    if (sid) resolve(sid);
                    else reject(new Error('No SID'));
                },
            );
            req.on('error', reject);
            req.setTimeout(5000, () => req.destroy(new Error('Topology SUBSCRIBE timed out')));
            req.end();
        });
        topologySubscriptionSid = sid;
        dlnaLog(`Subscribed to ZoneGroupTopology events (SID: ${sid})`);
        topologyRenewalTimeout = setTimeout(
            () => renewTopologySubscription(device),
            25 * 60 * 1000,
        );
    } catch (err) {
        dlnaLog('Failed to subscribe to ZoneGroupTopology events', err);
    }
}

async function stopEventSubscription(device: DlnaDevice): Promise<void> {
    if (subscriptionRenewalTimeout) {
        clearTimeout(subscriptionRenewalTimeout);
        subscriptionRenewalTimeout = null;
    }
    if (!subscriptionSid) return;
    try {
        const parsedUrl = new URL(getEventUrl(device));
        await new Promise<void>((resolve) => {
            const req = http.request(
                {
                    headers: { SID: subscriptionSid! },
                    hostname: parsedUrl.hostname,
                    method: 'UNSUBSCRIBE',
                    path: parsedUrl.pathname,
                    port: parsedUrl.port || '1400',
                },
                (res) => {
                    res.resume();
                    resolve();
                },
            );
            req.on('error', () => resolve());
            req.setTimeout(3000, () => {
                req.destroy();
                resolve();
            });
            req.end();
        });
        dlnaLog('Unsubscribed from AVTransport events');
    } catch {
        // Catch
    }
    subscriptionSid = null;
}

function stopPositionPolling() {
    if (positionPollingInterval) {
        clearInterval(positionPollingInterval);
        positionPollingInterval = null;
    }
}

async function stopTopologySubscription(device: DlnaDevice): Promise<void> {
    if (topologyRenewalTimeout) {
        clearTimeout(topologyRenewalTimeout);
        topologyRenewalTimeout = null;
    }
    if (!topologySubscriptionSid) return;
    try {
        const parsedUrl = new URL(getTopologyEventUrl(device));
        await new Promise<void>((resolve) => {
            const req = http.request(
                {
                    headers: { SID: topologySubscriptionSid! },
                    hostname: parsedUrl.hostname,
                    method: 'UNSUBSCRIBE',
                    path: parsedUrl.pathname,
                    port: parsedUrl.port || '1400',
                },
                (res) => {
                    res.resume();
                    resolve();
                },
            );
            req.on('error', () => resolve());
            req.setTimeout(3000, () => {
                req.destroy();
                resolve();
            });
            req.end();
        });
        dlnaLog('Unsubscribed from ZoneGroupTopology events');
    } catch {
        // Catch
    }
    topologySubscriptionSid = null;
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
            // Catch
        }
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
        if (connectedDevice) await fullDisconnect();
        connectedDevice = device;
        currentCoordinatorId = device.id;
        groupMembers = [device];
        groupMemberVolumes = {};
        lastKnownPosition = 0;
        hasStartedPlaying = false;
        trackLoadedAt = Date.now();
        lastKnownTransportState = '';
        lastKnownDeviceVolume = -1;
        lastCommandedUri = '';
        lastQueuedNextUri = '';
        startPositionPolling();
        startTopologyPolling();
        refreshTopology();
        await startEventSubscription(device);
        await startTopologySubscription(device);
        dlnaLog(`Connected to ${device.name}`);
        // Get current volume from device to sync UI
        let deviceVolume = 50;
        try {
            deviceVolume = await getVolume(device);
            lastKnownDeviceVolume = deviceVolume;
            groupMemberVolumes[device.id] = deviceVolume;
            dlnaLog(`Device volume: ${deviceVolume}`);
        } catch {
            // Use default
        }
        sendGroupStateToRenderer();
        return { success: true, volume: deviceVolume };
    } catch (err) {
        dlnaLog(`Failed to connect to ${device.name}`, err);
        return { success: false, volume: 50 };
    }
});

// Disconnect from the current device
ipcMain.handle('dlna-disconnect', async () => {
    try {
        await fullDisconnect();
        return true;
    } catch (err) {
        dlnaLog('Failed to disconnect', err);
        connectedDevice = null;
        groupMembers = [];
        groupMemberVolumes = {};
        isRadioMode = false;
        stopPositionPolling();
        return false;
    }
});

ipcMain.handle('dlna-group-add-member', async (_event, device: DlnaDevice) => {
    if (!connectedDevice) return { success: false };
    if (groupMembers.some((m) => m.id === device.id)) {
        dlnaLog(`${device.name} is already in the group`);
        return { success: true };
    }
    try {
        await joinGroup(device, connectedDevice);
        groupMembers.push(device);
        try {
            groupMemberVolumes[device.id] = await getVolume(device);
        } catch {
            groupMemberVolumes[device.id] = 50;
        }
        dlnaLog(`Added ${device.name} to group`);
        sendGroupStateToRenderer();
        return { success: true };
    } catch (err) {
        dlnaLog(`Failed to add ${device.name} to group`, err);
        return { success: false };
    }
});

ipcMain.handle('dlna-group-remove-member', async (_event, deviceId: string) => {
    if (!connectedDevice || deviceId === connectedDevice.id) return { success: false };
    const device = groupMembers.find((m) => m.id === deviceId);
    if (!device) return { success: false };
    try {
        try {
            await stop(device);
        } catch {
            // Catch
        }
        await becomeCoordinatorOfStandaloneGroup(device);
        groupMembers = groupMembers.filter((m) => m.id !== deviceId);
        if (groupMembers.length === 1 && connectedDevice) {
            currentCoordinatorId = connectedDevice.id;
        }
        delete groupMemberVolumes[deviceId];
        dlnaLog(`Removed ${device.name} from group`);
        sendGroupStateToRenderer();
        return { success: true };
    } catch (err) {
        dlnaLog(`Failed to remove ${device.name} from group`, err);
        return { success: false };
    }
});

ipcMain.on(
    'dlna-group-member-volume',
    async (_event, payload: { deviceId: string; volume: number }) => {
        const device = groupMembers.find((m) => m.id === payload.deviceId);
        if (!device) return;
        try {
            await setVolume(device, payload.volume);
            groupMemberVolumes[payload.deviceId] = payload.volume;
        } catch (err) {
            dlnaLog(`Failed to set volume on ${device.name}`, err);
        }
    },
);

ipcMain.on(
    'dlna-group-member-mute',
    async (_event, payload: { deviceId: string; muted: boolean }) => {
        const device = groupMembers.find((m) => m.id === payload.deviceId);
        if (!device) return;
        try {
            await setMute(device, payload.muted);
        } catch (err) {
            dlnaLog(`Failed to set mute on ${device.name}`, err);
        }
    },
);

ipcMain.handle('dlna-group-get-state', async () => {
    if (!connectedDevice || groupMembers.length === 0) return [];
    return groupMembers.map((m) => ({
        device: m,
        isCoordinator:
            m.id === currentCoordinatorId ||
            (!currentCoordinatorId && m.id === connectedDevice?.id),
        volume: groupMemberVolumes[m.id] ?? 50,
    }));
});

ipcMain.on('dlna-set-radio-mode', (_event, enabled: boolean) => {
    isRadioMode = enabled;
    dlnaLog(`Radio mode ${enabled ? 'enabled' : 'disabled'}`);
    if (enabled) {
        pendingPrevTrack = false;
        hasStartedPlaying = false;
        lastKnownPosition = 0;
        lastCommandedUri = '';
        lastQueuedNextUri = '';
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
        if (!data.url) {
            lastQueuedNextUri = '';
            await setNextAVTransportURI(connectedDevice, '', {} as TrackMetadata);
            dlnaLog('Cleared next track');
            return;
        }
        const lanUrl = rewriteUrlForLan(data.url);
        lastQueuedNextUri = lanUrl;
        const lanArtUrl = data.metadata?.albumArtUrl
            ? rewriteUrlForLan(data.metadata.albumArtUrl)
            : undefined;
        await setNextAVTransportURI(connectedDevice, lanUrl, {
            ...data.metadata,
            albumArtUrl: lanArtUrl,
        });
        dlnaLog(`Set next track: ${data.metadata.title}`);
    } catch (err) {
        dlnaLog(`Failed to set next track ${data?.metadata?.title || ''}`, err);
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
        if (groupMembers.length > 0) groupMemberVolumes[connectedDevice.id] = value;
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

ipcMain.handle('dlna-get-speaker-properties', async (_event, deviceId: string) => {
    const device = groupMembers.find((m) => m.id === deviceId);
    if (!device) return null;
    try {
        const [bass, treble, loudness, crossfade, ledState, touchControls] = await Promise.all([
            getBass(device).catch(() => 0),
            getTreble(device).catch(() => 0),
            getLoudness(device).catch(() => false),
            getCrossfadeMode(device).catch(() => false),
            getLEDState(device).catch(() => true),
            getButtonLockState(device).catch(() => true),
        ]);
        dlnaLog(`Got properties for ${device.name}`);
        return { bass, crossfade, ledState, loudness, touchControls, treble } as SpeakerProperties;
    } catch (err) {
        dlnaLog(`Failed to get properties for ${device.name}`, err);
        return null;
    }
});

ipcMain.on(
    'dlna-set-speaker-property',
    async (
        _event,
        payload: { deviceId: string; property: keyof SpeakerProperties; value: boolean | number },
    ) => {
        const device = groupMembers.find((m) => m.id === payload.deviceId);
        if (!device) return;
        try {
            switch (payload.property) {
                case 'bass':
                    await setBass(device, payload.value as number);
                    break;
                case 'crossfade':
                    await setCrossfadeMode(device, payload.value as boolean);
                    break;
                case 'ledState':
                    await setLEDState(device, payload.value as boolean);
                    break;
                case 'loudness':
                    await setLoudness(device, payload.value as boolean);
                    break;
                case 'touchControls':
                    await setButtonLockState(device, payload.value as boolean);
                    break;
                case 'treble':
                    await setTreble(device, payload.value as number);
                    break;
            }
            dlnaLog(`Set ${payload.property}=${payload.value} on ${device.name}`);
        } catch (err) {
            dlnaLog(`Failed to set ${payload.property} on ${device.name}`, err);
        }
    },
);
