import { ChildProcess, execSync, spawn } from 'child_process';
import { createHash } from 'crypto';
import { ipcMain } from 'electron';
import {
    createReadStream,
    existsSync,
    promises as fsPromises,
    readdirSync,
    statSync,
    unlinkSync,
} from 'fs';
import http from 'http';
import os from 'os';
import path from 'path';

import { getMainWindow } from '../../../index';
import {
    becomeCoordinatorOfStandaloneGroup,
    clearNextAVTransportURI,
    DlnaDevice,
    getBass,
    getButtonLockState,
    getCrossfadeMode,
    getLEDState,
    getLoudness,
    getMediaInfo,
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
    TrackMetadata,
} from './soap-client';
import { discoverDevices } from './ssdp-discovery';

import log from '/@/main/logger';

let connectedDevice: DlnaDevice | null = null;
let currentCoordinatorId = '';
let positionPollingInterval: NodeJS.Timeout | null = null;
let lastKnownPosition = 0;
let hasStartedPlaying = false;
let trackLoadedAt = 0;
let lastKnownTransportState = '';
let lastKnownDeviceVolume = -1;
// Volume the app last asked for, and when. Some renderers (HEOS on a transcoded
// stream, for one) report 0 and ignore SetVolume; their reports must not win.
let lastAppVolume = -1;
let lastAppVolumeAt = 0;
let deviceVolumeMismatches = 0;
let deviceVolumeUntrusted = false;
// A changed device volume must hold across consecutive polls before it is acted on;
// a reading of exactly 0 must hold much longer, since that is what misbehaving
// renderers report transiently while switching tracks.
let pendingDeviceVolume = -1;
let pendingDeviceVolumePolls = 0;
const DEVICE_VOLUME_SETTLE_MS = 5000;
const DEVICE_VOLUME_MISMATCH_LIMIT = 6;
const DEVICE_VOLUME_STABLE_POLLS = 3;
const DEVICE_VOLUME_ZERO_STABLE_POLLS = 10;
let lastCommandedUri = '';
// Seconds the current stream starts at (a transcode re-sent with a start offset). Added to
// every polled position so the app sees track time, not stream time.
let positionOffsetSeconds = 0;
// Mirrors the engine's isChunkedTranscodeUrl: Jellyfin transcode routes that cannot be seeked.
const isChunkedTranscodeUri = (uri: string) =>
    /[?&]static=false(?:&|$)/.test(uri) || /\/universal\?/.test(uri);
let lastQueuedNextUri = '';
let lastFinishedUri = '';
let lastAppSeekAt = 0;
let lastStopCommandAt = 0;
let pollInFlight = false;
let lastPlayCommandAt = 0;
let lastPauseCommandAt = 0;
let lastClearNextAt = 0;
let lastLoadedFromUri = '';
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
let speedProxyProcess: ChildProcess | null = null;
let isPausedIntentionally = false;
let currentFfmpegProcess: ChildProcess | null = null;
let currentTranscodeFile = '';
let lastKnownDuration = 0;
let nearEndStallCount = 0;
let resumeKickCount = 0;
let lastPlayUrlSentAt = 0;
let expectedGroupMemberCount = -1;
let topologyRefreshAttempt = 0;
let pendingTopologyRefreshTimeout: NodeJS.Timeout | null = null;

cleanupTempFiles();

function cleanupTempFiles() {
    try {
        const tmpDir = os.tmpdir();
        const files = readdirSync(tmpDir);
        for (const file of files) {
            if (file.startsWith('dlna-speed-') && file.endsWith('.mp3')) {
                unlinkSync(path.join(tmpDir, file));
            }
        }
    } catch (err) {
        dlnaLog('Failed to cleanup temp files', err);
    }
}

function getLanIp(): null | string {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name] || []) {
            if (iface.family === 'IPv4' && !iface.internal) return iface.address;
        }
    }
    return null;
}

function getLanIpForDevice(deviceIp: string): null | string {
    try {
        const devOctets = deviceIp.split('.');
        const interfaces = os.networkInterfaces();
        for (const name of Object.keys(interfaces)) {
            for (const iface of interfaces[name] || []) {
                if (iface.family !== 'IPv4' || iface.internal) continue;
                const ifOctets = iface.address.split('.');
                if (
                    ifOctets[0] === devOctets[0] &&
                    ifOctets[1] === devOctets[1] &&
                    ifOctets[2] === devOctets[2]
                ) {
                    return iface.address;
                }
            }
        }
    } catch {
        // LAN IP may be malformed, etc
    }
    return getLanIp();
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

function stopCurrentTranscode() {
    if (currentFfmpegProcess) {
        dlnaLog('Stopping active transcode process');
        try {
            currentFfmpegProcess.kill('SIGKILL');
        } catch (err) {
            dlnaLog('Failed to kill ffmpeg', err);
        }
        currentFfmpegProcess = null;
    }
    if (currentTranscodeFile) {
        try {
            if (existsSync(currentTranscodeFile)) {
                unlinkSync(currentTranscodeFile);
                dlnaLog('Deleted transcode temp file');
            }
        } catch {
            // File errors
        }
        currentTranscodeFile = '';
    }
}

const dlnaLog = (action: string, err?: unknown) => {
    const message = `[DLNA] ${action}`;
    log.info(message, err);
};

export interface SpeakerProperties {
    bass: number;
    crossfade: boolean;
    ledState: boolean;
    loudness: boolean;
    touchControls: boolean;
    treble: number;
}

function consolidateDiscoveredDevices(
    devices: DlnaDevice[],
    decodedTopology: string,
): DlnaDevice[] {
    const zoneGroupRegex = /<ZoneGroup\b[^>]*>[\s\S]*?<\/ZoneGroup>/g;
    const zoneGroups = decodedTopology.match(zoneGroupRegex);
    dlnaLog(`[Consolidate] Total ZoneGroup blocks matched: ${zoneGroups?.length ?? 0}`);
    if (!zoneGroups) return devices;
    const deviceById = new Map<string, DlnaDevice>(devices.map((d) => [d.id, d]));
    const groupedIds = new Set<string>();
    const groupEntries: DlnaDevice[] = [];
    for (let gi = 0; gi < zoneGroups.length; gi++) {
        const group = zoneGroups[gi];
        const groupTagMatch = group.match(/^<ZoneGroup\b([^>]*)>/);
        if (!groupTagMatch) {
            dlnaLog(`[Consolidate] Group[${gi}]: no opening tag match, skipping`);
            continue;
        }
        const coordinatorUuid = getAttr(groupTagMatch[1], 'Coordinator');
        dlnaLog(`[Consolidate] Group[${gi}]: Coordinator UUID="${coordinatorUuid}"`);
        if (!coordinatorUuid) continue;
        const coordinatorId = `uuid:${coordinatorUuid}`;
        const memberDevices: DlnaDevice[] = [];
        const memberTagRegex = /<ZoneGroupMember\b([^>]*)\/?>/g;
        let tagMatch: null | RegExpExecArray;
        while ((tagMatch = memberTagRegex.exec(group)) !== null) {
            const attrs = tagMatch[1];
            const uuid = getAttr(attrs, 'UUID');
            const location = getAttr(attrs, 'Location');
            const zoneName = getAttr(attrs, 'ZoneName');
            dlnaLog(
                `[Consolidate] Group[${gi}] member: UUID="${uuid}" ZoneName="${zoneName}" Location="${location}"`,
            );
            if (!uuid || !location) {
                dlnaLog(`[Consolidate] Group[${gi}] member skipped: missing UUID or Location`);
                continue;
            }
            const fullId = `uuid:${uuid}`;
            const existing = deviceById.get(fullId);
            if (existing) {
                dlnaLog(
                    `[Consolidate] Group[${gi}] member "${zoneName}": matched discovered device "${existing.name}"`,
                );
                memberDevices.push(existing);
            } else {
                dlnaLog(
                    `[Consolidate] Group[${gi}] member "${zoneName}" (${fullId}): NOT in discovered list, building from topology`,
                );
                try {
                    const base = new URL(location);
                    const baseUrl = `${base.protocol}//${base.hostname}:1400`;
                    memberDevices.push({
                        controlUrl: `${baseUrl}/MediaRenderer/AVTransport/Control`,
                        id: fullId,
                        location,
                        name: zoneName || uuid,
                        renderingControlUrl: `${baseUrl}/MediaRenderer/RenderingControl/Control`,
                    });
                } catch (e: any) {
                    dlnaLog(`[Consolidate] Group[${gi}] member URL parse failed: ${e?.message}`);
                    continue;
                }
            }
        }
        dlnaLog(`[Consolidate] Group[${gi}]: ${memberDevices.length} members total`);
        if (memberDevices.length === 1) {
            continue;
        }
        if (memberDevices.length < 2) {
            dlnaLog(`[Consolidate] Group[${gi}]: fewer than 2 members, skipping`);
            continue;
        }
        for (const m of memberDevices) {
            groupedIds.add(m.id);
        }
        const coordinator =
            deviceById.get(coordinatorId) ?? memberDevices.find((m) => m.id === coordinatorId);
        if (!coordinator) {
            dlnaLog(
                `[Consolidate] Group[${gi}]: coordinator ${coordinatorId} not resolvable, skipping`,
            );
            continue;
        }
        const isStereoGroup =
            group.includes('ChannelMapSet=') && !group.includes('HTSatChanMapSet=');
        if (isStereoGroup) {
            const firstMemberMatch = group.match(/<ZoneGroupMember\b([^>]*)\/?>/);
            const pairName = firstMemberMatch
                ? getAttr(firstMemberMatch[1], 'ZoneName') || coordinator.name
                : coordinator.name;
            dlnaLog(`[Consolidate] Group[${gi}]: stereo pair detected, name="${pairName}"`);
            for (const m of memberDevices) groupedIds.add(m.id);
            groupEntries.push({
                ...coordinator,
                isPair: true,
                name: `${pairName} (Stereo Pair)`,
            });
            continue;
        }
        const sortedMembers = [coordinator, ...memberDevices.filter((m) => m.id !== coordinatorId)];
        dlnaLog(
            `[Consolidate] Group[${gi}]: creating group entry "${coordinator.name}" with ${sortedMembers.length} members`,
        );
        groupEntries.push({
            ...coordinator,
            groupCoordinatorId: coordinatorId,
            groupMembers: sortedMembers,
            name: `Group (${sortedMembers.length})`,
        });
    }
    dlnaLog(`[Consolidate] groupedIds: ${JSON.stringify([...groupedIds])}`);
    dlnaLog(`[Consolidate] groupEntries count: ${groupEntries.length}`);
    const remaining = devices.filter((d) => !groupedIds.has(d.id));
    dlnaLog(`[Consolidate] remaining solo devices: ${remaining.map((d) => d.name).join(', ')}`);
    return [...remaining, ...groupEntries];
}

async function enrichDevicesWithTopology(devices: DlnaDevice[]): Promise<DlnaDevice[]> {
    const sonosDevices = devices.filter((d) => d.id.toUpperCase().includes('RINCON'));
    if (sonosDevices.length === 0) return devices;
    dlnaLog(
        `[Discovery/Topology] Starting parallel topology scan for ${sonosDevices.length} Sonos device(s)`,
    );
    const attemptDelays = [1000, 2000, 4000, 6000];
    for (let attempt = 0; attempt < attemptDelays.length; attempt++) {
        await new Promise((r) => setTimeout(r, attemptDelays[attempt]));
        dlnaLog(`[Discovery/Topology] Attempt ${attempt + 1}/${attemptDelays.length} (parallel)`);
        const allResults = await Promise.all(
            sonosDevices.map((sonosDevice) =>
                fetchTopologyForDevice(sonosDevice)
                    .then((raw) => {
                        if (!raw) return null;
                        const stateMatch = raw.match(
                            /<ZoneGroupState>([\s\S]*?)<\/ZoneGroupState>/,
                        );
                        if (!stateMatch) return null;
                        return stateMatch[1]
                            .replace(/&lt;/g, '<')
                            .replace(/&gt;/g, '>')
                            .replace(/&quot;/g, '"')
                            .replace(/&amp;/g, '&');
                    })
                    .catch(() => null),
            ),
        );
        let bestResult: DlnaDevice[] | null = null;
        let bestScore = 0;
        let anyResponded = false;
        for (const rawSoap of allResults) {
            if (!rawSoap) continue;
            anyResponded = true;
            const consolidated = consolidateDiscoveredDevices(devices, rawSoap);
            const score = consolidated.filter((d) => d.groupMembers || d.isPair).length;
            if (score > bestScore) {
                bestScore = score;
                bestResult = consolidated;
            }
        }
        if (bestResult && bestScore > 0) {
            dlnaLog(
                `[Discovery/Topology] Result: ${bestResult.length} entries (groups/pairs found)`,
            );
            return bestResult;
        }
        if (anyResponded) {
            dlnaLog(
                '[Discovery/Topology] Topology received but no groups/pairs found, returning flat list',
            );
            return devices;
        }
        dlnaLog(`[Discovery/Topology] Attempt ${attempt + 1}: no topology from any device`);
    }
    dlnaLog('[Discovery/Topology] All attempts exhausted, returning flat device list');
    return devices;
}

async function ensureEventServer(): Promise<void> {
    if (eventServer) return;
    eventServer = http.createServer((req, res) => {
        const isFileServe = req.url?.startsWith('/serve-temp');
        if (
            isFileServe &&
            (req.method === 'GET' || req.method === 'HEAD') &&
            req.url != undefined
        ) {
            try {
                const qs = new URLSearchParams(req.url.split('?')[1] ?? '');
                const filePath = qs.get('path');
                if (!filePath || !filePath.startsWith(os.tmpdir())) {
                    res.writeHead(403);
                    return res.end();
                }
                const stat = statSync(filePath);
                const fileSize = stat.size;
                const range = req.headers.range;
                if (req.method === 'HEAD') {
                    res.writeHead(200, {
                        'Accept-Ranges': 'bytes',
                        'Content-Length': fileSize,
                        'Content-Type': 'audio/mpeg',
                    });
                    return res.end();
                }
                if (range) {
                    const parts = range.replace(/bytes=/, '').split('-');
                    const start = parseInt(parts[0], 10);
                    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
                    const chunksize = end - start + 1;
                    const file = createReadStream(filePath, { end, start });
                    res.writeHead(206, {
                        'Accept-Ranges': 'bytes',
                        'Content-Length': chunksize,
                        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                        'Content-Type': 'audio/mpeg',
                    });
                    file.pipe(res);
                } else {
                    res.writeHead(200, {
                        'Accept-Ranges': 'bytes',
                        'Content-Length': fileSize,
                        'Content-Type': 'audio/mpeg',
                    });
                    createReadStream(filePath).pipe(res);
                }
            } catch (err) {
                dlnaLog('Static file serve error', err);
                if (!res.writableEnded) {
                    res.writeHead(404);
                    res.end();
                }
            }
            return;
        }
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
        return;
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

function fetchTopologyForDevice(device: DlnaDevice): Promise<string> {
    return new Promise((resolve) => {
        try {
            const parsedUrl = new URL(device.controlUrl);
            const controlUrl = `http://${parsedUrl.hostname}:1400/ZoneGroupTopology/Control`;
            dlnaLog(`[Discovery/Topology] Requesting from ${device.name} at ${controlUrl}`);
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
                        'Content-Length': Buffer.byteLength(body, 'utf8'),
                        'Content-Type': 'text/xml; charset="utf-8"',
                        SOAPAction:
                            '"urn:schemas-upnp-org:service:ZoneGroupTopology:1#GetZoneGroupState"',
                    },
                    method: 'POST',
                },
                (res) => {
                    dlnaLog(`[Discovery/Topology] HTTP ${res.statusCode} from ${device.name}`);
                    let data = '';
                    res.on('data', (chunk) => (data += chunk));
                    res.on('end', () => {
                        dlnaLog(
                            `[Discovery/Topology] Response ${data.length} bytes from ${device.name}`,
                        );
                        if (data.includes('GetZoneGroupStateResponse')) {
                            resolve(data);
                        } else {
                            dlnaLog(
                                `[Discovery/Topology] Guard failed for ${device.name}: ${data.substring(0, 200).replace(/\s+/g, ' ')}`,
                            );
                            resolve('');
                        }
                    });
                },
            );
            req.on('error', (err) => {
                dlnaLog(`[Discovery/Topology] Error from ${device.name}: ${err.message}`);
                resolve('');
            });
            req.setTimeout(5000, () => {
                dlnaLog(`[Discovery/Topology] Timeout for ${device.name}`);
                req.destroy();
                resolve('');
            });
            req.write(body);
            req.end();
        } catch (err: any) {
            dlnaLog(`[Discovery/Topology] Exception for ${device.name}: ${err?.message}`);
            resolve('');
        }
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
    stopPositionPolling();
    hasStartedPlaying = false;
    lastCommandedUri = '';
    lastQueuedNextUri = '';
    lastKnownDuration = 0;
    nearEndStallCount = 0;
    isRadioMode = false;
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
    expectedGroupMemberCount = -1;
    topologyRefreshAttempt = 0;
    if (pendingTopologyRefreshTimeout) {
        clearTimeout(pendingTopologyRefreshTimeout);
        pendingTopologyRefreshTimeout = null;
    }
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
    cleanupTempFiles();
}

function getActiveProxyState(uri: string) {
    if (!uri) return null;
    if (uri.includes('/audio-proxy')) {
        try {
            const urlObj = new URL(uri);
            return {
                offset: parseFloat(urlObj.searchParams.get('offset') || '0'),
                speed: parseFloat(urlObj.searchParams.get('speed') || '1'),
            };
        } catch {
            return null;
        }
    }
    const match = uri.match(/dlna-speed-[^-]+-s([0-9.]+)-p[01]\.mp3/);
    if (match) {
        return { offset: 0, speed: parseFloat(match[1]) };
    }
    return null;
}

function getAttr(attrString: string, name: string): string {
    const m = attrString.match(new RegExp(`\\b${name}=["']([^"']*)["']`, 'i'));
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
        if (
            lastQueuedNextUri &&
            newUri === lastQueuedNextUri &&
            lastQueuedNextUri !== lastCommandedUri
        ) {
            dlnaLog('Gapless transition detected (event)');
            lastCommandedUri = newUri;
            positionOffsetSeconds = 0;
            lastQueuedNextUri = '';
            hasStartedPlaying = true;
            trackLoadedAt = Date.now();
            lastKnownPosition = 0;
            getMainWindow()?.webContents.send('renderer-dlna-track-ended', { gapless: true });
        }
        return;
    }
    if (!lastCommandedUri) return;
    if (lastQueuedNextUri && newUri === lastQueuedNextUri) {
        dlnaLog('Event: advanced to next track');
        lastCommandedUri = newUri;
        positionOffsetSeconds = 0;
        lastQueuedNextUri = '';
        hasStartedPlaying = true;
        trackLoadedAt = Date.now();
        lastKnownPosition = 0;
        getMainWindow()?.webContents.send('renderer-dlna-track-ended', { gapless: true });
    } else {
        dlnaLog('Event: URI is now unknown');
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
        if (connectedDevice.isPair) return;
        const myRinconId = getRinconId(connectedDevice);
        const zoneGroupRegex = /<ZoneGroup\b[^>]*>[\s\S]*?<\/ZoneGroup>/g;
        const zoneGroups = decodedXml.match(zoneGroupRegex);
        if (!zoneGroups) return;
        const newMembers: DlnaDevice[] = [];
        let newCoordinatorRincon = '';
        for (const group of zoneGroups) {
            if (!group.includes(myRinconId)) continue;
            const groupTagMatch = group.match(/^<ZoneGroup\b([^>]*)>/);
            if (groupTagMatch) {
                newCoordinatorRincon = getAttr(groupTagMatch[1], 'Coordinator');
            }
            const memberTagRegex = /<ZoneGroupMember\b([^>]*)\/?>/g;
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
        const incomingSize = Math.max(newMembers.length, 1);
        if (expectedGroupMemberCount >= 0 && incomingSize !== expectedGroupMemberCount) {
            if (topologyRefreshAttempt < 10) {
                scheduleTopologyVerification();
            } else {
                expectedGroupMemberCount = -1;
                topologyRefreshAttempt = 0;
            }
            return;
        }
        if (expectedGroupMemberCount >= 0 && incomingSize === expectedGroupMemberCount) {
            expectedGroupMemberCount = -1;
            topologyRefreshAttempt = 0;
            if (pendingTopologyRefreshTimeout) {
                clearTimeout(pendingTopologyRefreshTimeout);
                pendingTopologyRefreshTimeout = null;
            }
        }
        let newCoordinatorId = newCoordinatorRincon ? `uuid:${newCoordinatorRincon}` : '';
        if (newMembers.length <= 1 && connectedDevice) {
            const solo = newMembers.length === 1 ? newMembers[0] : connectedDevice;
            newCoordinatorId = connectedDevice.id;
            const hasTopologyChanged =
                groupMembers.length !== 1 ||
                groupMembers[0]?.id !== solo.id ||
                currentCoordinatorId !== newCoordinatorId;
            if (hasTopologyChanged) {
                groupMembers = [solo];
                currentCoordinatorId = newCoordinatorId;
                dlnaLog(`Topology Change Detected: Group size is now 1 (solo)`);
                sendGroupStateToRenderer();
            }
            return;
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

async function passiveDisconnect(): Promise<void> {
    stopPositionPolling();
    hasStartedPlaying = false;
    lastCommandedUri = '';
    lastQueuedNextUri = '';
    lastKnownDuration = 0;
    nearEndStallCount = 0;
    isRadioMode = false;
    if (connectedDevice) {
        await stopEventSubscription(connectedDevice);
        await stopTopologySubscription(connectedDevice);
        dlnaLog(`Passive disconnect from ${connectedDevice.name} (speaker keeps playing)`);
    }
    connectedDevice = null;
    currentCoordinatorId = '';
    groupMembers = [];
    groupMemberVolumes = {};
    expectedGroupMemberCount = -1;
    topologyRefreshAttempt = 0;
    if (pendingTopologyRefreshTimeout) {
        clearTimeout(pendingTopologyRefreshTimeout);
        pendingTopologyRefreshTimeout = null;
    }
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
    cleanupTempFiles();
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
                    'Content-Length': Buffer.byteLength(body, 'utf8'),
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

function scheduleTopologyVerification() {
    if (pendingTopologyRefreshTimeout) clearTimeout(pendingTopologyRefreshTimeout);
    const delay = Math.min(5000 * Math.pow(1.5, topologyRefreshAttempt), 30_000);
    pendingTopologyRefreshTimeout = setTimeout(() => {
        pendingTopologyRefreshTimeout = null;
        topologyRefreshAttempt++;
        refreshTopology();
    }, delay);
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
        // Renderers such as upmpdcli block their control port for seconds while seeking;
        // without this guard polls pile up and answer late, out of order.
        if (pollInFlight) return;
        pollInFlight = true;
        const issuedAt = Date.now();
        try {
            const [posInfo, rawTransportState] = await Promise.all([
                getPositionInfo(connectedDevice),
                getTransportInfo(connectedDevice),
            ]);
            // A Yamaha HTR-6067 reports NO_MEDIA_PRESENT, not STOPPED, once it has dropped or
            // finished a stream; for everything below that is a stop.
            const transportState =
                rawTransportState === 'NO_MEDIA_PRESENT' ? 'STOPPED' : rawTransportState;
            if (positionOffsetSeconds > 0 && posInfo.position >= 0) {
                posInfo.position += positionOffsetSeconds;
            }
            // An answer to a request issued before the latest app command (seek, stop,
            // play, pause, track load) describes the pre-command state; applying it would
            // overwrite the app's position, or mirror a stale STOPPED back as a pause.
            if (
                lastAppSeekAt > issuedAt ||
                lastStopCommandAt > issuedAt ||
                lastPlayCommandAt > issuedAt ||
                lastPauseCommandAt > issuedAt ||
                trackLoadedAt > issuedAt
            ) {
                return;
            }
            let realPosition = posInfo.position;
            const proxyState = getActiveProxyState(lastCommandedUri);
            if (proxyState) {
                realPosition = posInfo.position * proxyState.speed;
            }
            getMainWindow()?.webContents.send('renderer-dlna-current-time', realPosition);
            if (posInfo.duration > 0) {
                getMainWindow()?.webContents.send('renderer-dlna-duration', posInfo.duration);
            }
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
                const isSameUriLoop =
                    lastQueuedNextUri === lastCommandedUri && lastQueuedNextUri !== '';
                if (posInfo.trackUri === lastCommandedUri) {
                    lastLoadedFromUri = '';
                }

                if (
                    hasStartedPlaying &&
                    uriReportedByDevice &&
                    posInfo.trackUri !== lastCommandedUri &&
                    posInfo.trackUri !== lastLoadedFromUri &&
                    lastQueuedNextUri &&
                    posInfo.trackUri === lastQueuedNextUri
                ) {
                    dlnaLog(`Polling: advanced to next track`);
                    lastCommandedUri = posInfo.trackUri;
                    positionOffsetSeconds = 0;
                    lastQueuedNextUri = '';
                    trackLoadedAt = Date.now();
                    lastKnownPosition = 0;
                    getMainWindow()?.webContents.send('renderer-dlna-track-ended', {
                        gapless: true,
                    });
                } else if (
                    hasStartedPlaying &&
                    isSameUriLoop &&
                    uriReportedByDevice &&
                    posInfo.trackUri === lastCommandedUri &&
                    previousPosition > 1 &&
                    posInfo.position < 2 &&
                    posInfo.position < previousPosition - 2 &&
                    !recentAppSeek
                ) {
                    dlnaLog(`Polling: looped same track (gapless 1-loop)`);
                    trackLoadedAt = Date.now();
                    lastKnownPosition = 0;
                    pendingPrevTrack = false;
                    getMainWindow()?.webContents.send('renderer-dlna-track-ended', {
                        gapless: true,
                    });
                }
                const isGracePeriod = Date.now() - trackLoadedAt < 4000;
                if (pendingPrevTrack) {
                    pendingPrevTrack = false;
                    if (!isGracePeriod && transportState !== 'STOPPED') {
                        dlnaLog(`Position-based prev confirmed`);
                        trackLoadedAt = Date.now();
                        lastKnownPosition = 0;
                        getMainWindow()?.webContents.send('renderer-dlna-prev-track');
                    }
                }
                if (
                    !isGracePeriod &&
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
                const recentClearNext = Date.now() - lastClearNextAt < 3000;
                let justFiredTrackEnded = false;
                if (posInfo.duration > 0) lastKnownDuration = posInfo.duration;
                if (
                    hasStartedPlaying &&
                    lastKnownDuration > 0 &&
                    posInfo.position > 0 &&
                    posInfo.position >= lastKnownDuration - 2 &&
                    Math.abs(posInfo.position - previousPosition) < 0.5 &&
                    !recentAppSeek
                ) {
                    nearEndStallCount += 1;
                    if (nearEndStallCount >= 3) {
                        dlnaLog(
                            `Stuck-at-end detected (${posInfo.position}/${lastKnownDuration}s), advancing`,
                        );
                        nearEndStallCount = 0;
                        hasStartedPlaying = false;
                        lastKnownDuration = 0;
                        trackLoadedAt = Date.now();
                        getMainWindow()?.webContents.send('renderer-dlna-track-ended', {
                            gapless: false,
                        });
                    }
                } else {
                    nearEndStallCount = 0;
                }
                if (
                    hasStartedPlaying &&
                    transportState === 'STOPPED' &&
                    !isPausedIntentionally &&
                    !recentClearNext
                ) {
                    const isResumeFailure =
                        previousPosition < 15 ||
                        (Date.now() - trackLoadedAt < 12000 && previousPosition < 30);
                    if (isResumeFailure) {
                        resumeKickCount++;
                        if (resumeKickCount <= 4) {
                            dlnaLog(
                                `Stream dropped unexpectedly (resume failure). Kicking device... (${resumeKickCount}/4)`,
                            );
                            trackLoadedAt = Date.now();
                            lastPlayCommandAt = Date.now();
                            play(connectedDevice).catch(() => {});
                        } else {
                            dlnaLog('Stream failed to resume after 4 attempts, giving up');
                            hasStartedPlaying = false;
                            isPausedIntentionally = true;
                            getMainWindow()?.webContents.send('renderer-dlna-toast', {
                                message: 'DLNA stream failed to resume. Please try playing again.',
                                type: 'error',
                            });
                        }
                    } else {
                        pendingPrevTrack = false;
                        dlnaLog('Track ended (stopped), advancing queue');
                        hasStartedPlaying = false;
                        lastKnownPosition = 0;
                        justFiredTrackEnded = true;
                        lastFinishedUri = lastCommandedUri;
                        lastCommandedUri = '';
                        getMainWindow()?.webContents.send('renderer-dlna-track-ended', {
                            gapless: false,
                        });
                    }
                }
                if (
                    !hasStartedPlaying &&
                    !justFiredTrackEnded &&
                    transportState === 'STOPPED' &&
                    !isPausedIntentionally &&
                    lastCommandedUri
                ) {
                    const isStuck =
                        !hasStartedPlaying &&
                        trackLoadedAt > 0 &&
                        Date.now() - trackLoadedAt > 5000;

                    if (isStuck && lastCommandedUri && lastCommandedUri !== lastFinishedUri) {
                        if (lastKnownTransportState !== 'TRANSITIONING') {
                            dlnaLog('Stream startup slow/stuck in STOPPED. Kicking device...');
                            play(connectedDevice).catch(() => {});
                            trackLoadedAt = Date.now();
                        }
                    }
                }
            } else if (hasStartedPlaying && transportState === 'STOPPED') {
                hasStartedPlaying = false;
                dlnaLog('Radio stream stopped on device');
            }

            if (transportState !== lastKnownTransportState && transportState !== 'TRANSITIONING') {
                lastKnownTransportState = transportState;
                const recentPauseOrPlay =
                    Date.now() - lastPauseCommandAt < 2000 || Date.now() - lastPlayCommandAt < 2000;
                const newTrackSentSincePause = lastPlayUrlSentAt > lastPauseCommandAt;
                if (
                    !recentPauseOrPlay ||
                    (transportState === 'PLAYING' && newTrackSentSincePause)
                ) {
                    getMainWindow()?.webContents.send(
                        'renderer-dlna-transport-state',
                        transportState,
                    );
                }
            }

            try {
                const deviceVolume = await getVolume(connectedDevice);
                if (deviceVolume === lastKnownDeviceVolume) {
                    pendingDeviceVolume = -1;
                    pendingDeviceVolumePolls = 0;
                    throw new Error('volume unchanged');
                }
                if (deviceVolume !== pendingDeviceVolume) {
                    pendingDeviceVolume = deviceVolume;
                    pendingDeviceVolumePolls = 1;
                    throw new Error('volume unstable');
                }
                pendingDeviceVolumePolls += 1;
                const stablePollsNeeded =
                    deviceVolume === 0
                        ? DEVICE_VOLUME_ZERO_STABLE_POLLS
                        : DEVICE_VOLUME_STABLE_POLLS;
                if (pendingDeviceVolumePolls < stablePollsNeeded) {
                    throw new Error('volume unstable');
                }
                if (lastAppVolume >= 0 && deviceVolume !== lastAppVolume) {
                    // The device does not reflect what the app set. Give it time to settle;
                    // if it never does, stop letting its reports overwrite the app volume.
                    if (Date.now() - lastAppVolumeAt < DEVICE_VOLUME_SETTLE_MS) {
                        throw new Error('volume not settled');
                    }
                    deviceVolumeMismatches += 1;
                    if (deviceVolumeMismatches >= DEVICE_VOLUME_MISMATCH_LIMIT) {
                        if (!deviceVolumeUntrusted) {
                            dlnaLog(
                                `Device reports volume ${deviceVolume} after app set ${lastAppVolume}; ignoring its volume reports`,
                            );
                        }
                        deviceVolumeUntrusted = true;
                        throw new Error('volume untrusted');
                    }
                    // A non-zero contradiction is most likely the user turning the device's
                    // own knob and is passed on. A zero contradicting a non-zero app volume
                    // is what misreporting renderers send; never let it win, or the app
                    // pushes 0 back and the device "agrees" from then on.
                    if (deviceVolume === 0 && lastAppVolume > 0) {
                        throw new Error('volume zero contradicts app');
                    }
                } else if (lastAppVolume >= 0) {
                    deviceVolumeMismatches = 0;
                    deviceVolumeUntrusted = false;
                }
                if (deviceVolumeUntrusted) {
                    throw new Error('volume untrusted');
                }
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
        } finally {
            pollInFlight = false;
        }
    }, 500);
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

function stopSpeedProxy(): void {
    if (speedProxyProcess) {
        try {
            speedProxyProcess.kill('SIGKILL');
        } catch {
            // Catch
        }
        speedProxyProcess = null;
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
        const result = await discoverDevices(5000);
        if (result === null) {
            dlnaLog('Discovery aborted, Node not found');
            getMainWindow()?.webContents.send('renderer-dlna-toast', {
                message: 'DLNA discovery on macOS requires Node to be installed and added to PATH.',
                type: 'error',
            });
            return [];
        }
        dlnaLog(`Found ${result.length} device(s)`);
        const finalDevices = await enrichDevicesWithTopology(result);
        return finalDevices;
    } catch (err) {
        dlnaLog('Discovery failed', err);
        return [];
    }
});

// Connect to a specific DLNA device
ipcMain.handle('dlna-connect', async (_event, device: DlnaDevice) => {
    try {
        if (connectedDevice) await fullDisconnect();
        const actualDevice = device.groupMembers?.find((m) => m.id === device.id) || device;
        connectedDevice = actualDevice;
        currentCoordinatorId = actualDevice.id;
        groupMembers = device.groupMembers ? [...device.groupMembers] : [actualDevice];
        groupMemberVolumes = {};
        lastKnownPosition = 0;
        hasStartedPlaying = false;
        trackLoadedAt = Date.now();
        lastKnownTransportState = '';
        positionOffsetSeconds = 0;
        lastKnownDeviceVolume = -1;
        lastAppVolume = -1;
        lastAppVolumeAt = 0;
        deviceVolumeMismatches = 0;
        deviceVolumeUntrusted = false;
        pendingDeviceVolume = -1;
        pendingDeviceVolumePolls = 0;
        lastCommandedUri = '';
        lastQueuedNextUri = '';
        startPositionPolling();
        startTopologyPolling();
        refreshTopology();
        if (process.platform !== 'darwin') {
            await startEventSubscription(device);
            await startTopologySubscription(device);
        }
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
        let currentUri = '';
        let nextUri = '';
        let currentPosition = 0;
        let currentDuration = 0;
        let currentTransportState = 'STOPPED';
        try {
            const [posInfo, tState, mediaInfo] = await Promise.all([
                getPositionInfo(device),
                getTransportInfo(device),
                getMediaInfo(device).catch(() => ({ currentUri: '', nextUri: '' })),
            ]);
            currentTransportState = tState;
            lastKnownTransportState = currentTransportState || 'STOPPED';
            const isActive =
                tState === 'PLAYING' || tState === 'PAUSED_PLAYBACK' || tState === 'TRANSITIONING';
            if (isActive && posInfo.trackUri && posInfo.trackUri !== 'NOT_IMPLEMENTED') {
                currentUri = posInfo.trackUri;
                currentPosition = posInfo.position;
                currentDuration = posInfo.duration;
                lastCommandedUri = currentUri;
                positionOffsetSeconds = 0;
                nextUri = mediaInfo.nextUri || '';
                if (nextUri) lastQueuedNextUri = nextUri;
                dlnaLog(`Device already playing: ${currentUri} at ${currentPosition}s (${tState})`);
            }
        } catch {
            // Catch
        }

        sendGroupStateToRenderer();
        if (currentUri && currentTransportState !== 'STOPPED') {
            getMainWindow()?.webContents.send('renderer-dlna-connect-playback', {
                duration: currentDuration,
                nextUri,
                position: currentPosition,
                transportState: currentTransportState,
                uri: currentUri,
            });
        }
        return {
            currentDuration,
            currentPosition,
            currentTransportState,
            currentUri,
            nextUri,
            success: true,
            volume: deviceVolume,
        };
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

ipcMain.handle('dlna-disconnect-passive', async () => {
    try {
        await passiveDisconnect();
        return true;
    } catch (err) {
        dlnaLog('Failed to passive-disconnect', err);
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
        expectedGroupMemberCount = groupMembers.length;
        topologyRefreshAttempt = 0;
        scheduleTopologyVerification();
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
        expectedGroupMemberCount = groupMembers.length;
        topologyRefreshAttempt = 0;
        scheduleTopologyVerification();
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
ipcMain.on(
    'dlna-play-url',
    async (
        _event,
        data: {
            isMuted?: boolean;
            metadata: TrackMetadata;
            positionOffset?: number;
            seekTo?: number;
            url: string;
        },
    ) => {
        if (!connectedDevice) return;
        const device = connectedDevice;
        try {
            hasStartedPlaying = false;
            lastKnownPosition = 0;
            isPausedIntentionally = data.metadata.autoPlay === false;
            lastAppSeekAt = Date.now();
            lastKnownDuration = 0;
            nearEndStallCount = 0;
            const lanUrl = rewriteUrlForLan(data.url);
            lastPlayCommandAt = Date.now();
            if (lanUrl === lastCommandedUri && !data.seekTo && !isChunkedTranscodeUri(lanUrl)) {
                dlnaLog(
                    `dlna-play-url: URI already loaded (${data.metadata.title}), seeking to 0 and playing`,
                );
                lastQueuedNextUri = '';
                if (data.metadata.autoPlay !== false) {
                    try {
                        await seek(device, 0);
                    } catch {
                        // seek may fail on some devices; proceed to play anyway
                    }
                    await play(device).catch((err) => dlnaLog('Play (skip-reload) failed', err));
                }
                return;
            }
            trackLoadedAt = Date.now();
            lastPlayUrlSentAt = Date.now();
            lastLoadedFromUri = lastCommandedUri;
            lastCommandedUri = lanUrl;
            positionOffsetSeconds = data.positionOffset ?? 0;
            lastQueuedNextUri = '';
            const lanArtUrl = data.metadata.albumArtUrl
                ? rewriteUrlForLan(data.metadata.albumArtUrl)
                : undefined;
            const metadata = { ...data.metadata, albumArtUrl: lanArtUrl };
            const shouldMuteTrick = data.seekTo !== undefined && data.seekTo > 0;
            if (shouldMuteTrick) {
                try {
                    await setMute(device, true);
                    await Promise.all(groupMembers.map((m) => setMute(m, true).catch(() => {})));
                } catch {
                    // Pass
                }
            }
            await setAVTransportURI(device, lanUrl, metadata);
            await new Promise((r) => setTimeout(r, 1000));
            if (data.metadata.autoPlay !== false) {
                lastPlayCommandAt = Date.now();
                await play(device).catch((err) => dlnaLog('Initial play failed', err));
                dlnaLog(`Playing: ${data.metadata.title}`);
                if (shouldMuteTrick) {
                    await waitForTransportState(device, ['PLAYING'], 4000);
                    await new Promise((r) => setTimeout(r, 1200));
                    let targetSeek = data.seekTo!;
                    const proxyState = getActiveProxyState(lanUrl);
                    if (proxyState) {
                        targetSeek = targetSeek / proxyState.speed;
                    }
                    for (let i = 0; i < 3; i++) {
                        try {
                            await seek(device, targetSeek);
                            break;
                        } catch (err: any) {
                            if (err?.message?.includes('701') || err?.message?.includes('500')) {
                                dlnaLog(`Seek failed (701), retrying... (${i + 1}/3)`);
                                await new Promise((r) => setTimeout(r, 1000));
                            } else {
                                break;
                            }
                        }
                    }
                    await setMute(device, !!data.isMuted).catch(() => {});
                    await Promise.all(
                        groupMembers.map((m) => setMute(m, !!data.isMuted).catch(() => {})),
                    );
                }
            } else {
                dlnaLog(`Queued (Paused): ${data.metadata.title}`);
                if (shouldMuteTrick) {
                    lastPlayCommandAt = Date.now();
                    await play(device).catch(() => {});
                    await waitForTransportState(device, ['PLAYING'], 4000);
                    await new Promise((r) => setTimeout(r, 1200));
                    let targetSeek = data.seekTo!;
                    const proxyState = getActiveProxyState(lanUrl);
                    if (proxyState) targetSeek = targetSeek / proxyState.speed;
                    for (let i = 0; i < 3; i++) {
                        try {
                            await seek(device, targetSeek);
                            break;
                        } catch (err: any) {
                            if (err?.message?.includes('701') || err?.message?.includes('500')) {
                                dlnaLog(`Seek failed (701), retrying... (${i + 1}/3)`);
                                await new Promise((r) => setTimeout(r, 1000));
                            } else {
                                break;
                            }
                        }
                    }
                    await pause(device).catch(() => {});
                    await setMute(device, !!data.isMuted).catch(() => {});
                    await Promise.all(
                        groupMembers.map((m) => setMute(m, !!data.isMuted).catch(() => {})),
                    );
                }
            }
        } catch (err) {
            dlnaLog(`Failed to load ${data.metadata.title}`, err);
            if (data.seekTo !== undefined) {
                await setMute(device, !!data.isMuted).catch(() => {});
                await Promise.all(
                    groupMembers.map((m) => setMute(m, !!data.isMuted).catch(() => {})),
                );
            }
        }
    },
);

// Set the next track for gapless playback
ipcMain.on('dlna-set-next-url', async (_event, data: { metadata: TrackMetadata; url: string }) => {
    if (!connectedDevice) return;
    try {
        if (!data.url) {
            lastQueuedNextUri = '';
            try {
                await clearNextAVTransportURI(connectedDevice);
            } catch {
                // Pass
            }
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
        isPausedIntentionally = false;
        trackLoadedAt = Date.now();
        lastPlayCommandAt = Date.now();
        lastPauseCommandAt = 0;
        lastKnownTransportState = 'PLAYING';
        await play(connectedDevice);
    } catch (err) {
        dlnaLog('Failed to resume playback', err);
    }
});

// Pause playback
ipcMain.on('dlna-pause', async () => {
    if (!connectedDevice) return;
    try {
        isPausedIntentionally = true;
        lastPauseCommandAt = Date.now();
        lastKnownTransportState = 'PAUSED_PLAYBACK';
        if (isRadioMode) {
            lastCommandedUri = '';
            lastQueuedNextUri = '';
            await stop(connectedDevice);
            return;
        }
        await pause(connectedDevice);
    } catch (err: any) {
        dlnaLog('Failed to pause', err);
        if (err?.message?.includes('701') || err?.message?.includes('500')) {
            setTimeout(() => {
                if (isPausedIntentionally) pause(connectedDevice!).catch(() => {});
            }, 1500);
        }
    }
});

ipcMain.on('dlna-clear-next', async () => {
    if (!connectedDevice) return;
    lastQueuedNextUri = '';
    lastClearNextAt = Date.now();
    try {
        await clearNextAVTransportURI(connectedDevice);
        dlnaLog('Cleared next track');
    } catch (err) {
        dlnaLog('Failed to clear next track', err);
    }
});

// Stop playback
ipcMain.on('dlna-stop', async () => {
    if (!connectedDevice) return;
    try {
        isPausedIntentionally = true;
        lastStopCommandAt = Date.now();
        lastCommandedUri = '';
        lastQueuedNextUri = '';
        await stop(connectedDevice);
    } catch (err) {
        dlnaLog('Failed to stop', err);
    }
});

// Seek to position
ipcMain.on('dlna-seek', async (_event, seconds: number) => {
    if (!connectedDevice) return;
    // A chunked transcode cannot be seeked (see the engine's isChunkedTranscodeUrl); a HEOS
    // receiver given a Seek on one hangs in TRANSITIONING. The engine re-sends with an offset
    // instead, so anything that still arrives here for such a stream is dropped.
    if (isChunkedTranscodeUri(lastCommandedUri)) {
        dlnaLog(`Ignoring Seek to ${seconds} on a chunked transcode`);
        return;
    }
    try {
        lastAppSeekAt = Date.now();
        let targetSeconds = seconds;
        const proxyState = getActiveProxyState(lastCommandedUri);
        if (proxyState) {
            targetSeconds = seconds / proxyState.speed;
        }
        await seek(connectedDevice, targetSeconds);
    } catch (err) {
        dlnaLog(`Failed to seek to ${seconds}`, err);
    }
});

// Set volume (0-100)
ipcMain.on('dlna-volume', async (_event, value: number) => {
    if (!connectedDevice) return;
    try {
        lastAppVolume = value;
        lastAppVolumeAt = Date.now();
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
        const proxyState = getActiveProxyState(lastCommandedUri);
        const position = proxyState ? info.position * proxyState.speed : info.position;
        return position + positionOffsetSeconds;
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

ipcMain.handle(
    'dlna-prepare-speed-file',
    async (
        _event,
        data: { offset: number; preservePitch: boolean; speed: number; url: string },
    ) => {
        stopCurrentTranscode();
        try {
            execSync('ffmpeg -version', { stdio: 'ignore' });
        } catch {
            dlnaLog('FFmpeg not found on PATH');
            getMainWindow()?.webContents.send('renderer-dlna-toast', {
                message:
                    'DLNA playback speed changes require FFMpeg to be installed and added to PATH.',
                type: 'error',
            });
            return null;
        }
        let lanIp: null | string = null;
        if (connectedDevice) {
            try {
                const deviceIp = new URL(connectedDevice.controlUrl).hostname;
                lanIp = getLanIpForDevice(deviceIp);
            } catch {
                // Catch
            }
        }
        if (!lanIp) lanIp = getLanIp();
        if (!lanIp) return null;
        await ensureEventServer();
        const safeUrlId = createHash('md5').update(data.url).digest('hex').substring(0, 16);
        const pp = data.preservePitch ? '1' : '0';
        const fileName = `dlna-speed-${safeUrlId}-s${data.speed}-p${pp}.mp3`;
        const filePath = path.join(os.tmpdir(), fileName);
        currentTranscodeFile = filePath;
        return new Promise<null | string>((resolve) => {
            try {
                let audioFilter = '';
                if (data.speed !== 1) {
                    if (!data.preservePitch) {
                        const targetRate = Math.round(44100 * data.speed);
                        audioFilter = `aresample=44100,asetrate=${targetRate},aresample=44100`;
                    } else {
                        const parts: string[] = [];
                        let remaining = data.speed;
                        while (remaining > 2) {
                            parts.push('atempo=2.0');
                            remaining /= 2;
                        }
                        while (remaining < 0.5) {
                            parts.push('atempo=0.5');
                            remaining /= 0.5;
                        }
                        parts.push(`atempo=${remaining.toFixed(6)}`);
                        audioFilter = parts.join(',');
                    }
                }
                dlnaLog(`Transcode started for speed: ${data.speed}`);
                const ffmpeg = spawn('ffmpeg', [
                    '-loglevel',
                    'error',
                    '-i',
                    data.url,
                    '-vn',
                    '-af',
                    audioFilter || 'anull',
                    '-map_metadata',
                    '0',
                    '-f',
                    'mp3',
                    currentTranscodeFile,
                ]);
                currentFfmpegProcess = ffmpeg;
                ffmpeg.on('error', (err) => {
                    dlnaLog('FFmpeg spawn error', err);
                    currentFfmpegProcess = null;
                    resolve(null);
                });
                ffmpeg.on('close', (code) => {
                    currentFfmpegProcess = null;
                    if (code === 0) {
                        dlnaLog('Transcode finished successfully');
                        resolve(
                            `http://${lanIp}:${eventServerPort}/serve-temp?path=${encodeURIComponent(currentTranscodeFile)}`,
                        );
                    } else {
                        dlnaLog(`FFmpeg exited with code ${code}`);
                        resolve(null);
                    }
                });
            } catch (err) {
                dlnaLog('Transcode setup failed', err);
                resolve(null);
            }
        });
    },
);

ipcMain.handle(
    'dlna-check-speed-file',
    async (_event, data: { preservePitch: boolean; speed: number; url: string }) => {
        let lanIp = getLanIp();
        if (connectedDevice) {
            try {
                lanIp = getLanIpForDevice(new URL(connectedDevice.controlUrl).hostname) || lanIp;
            } catch {
                // Catch
            }
        }
        const safeUrlId = createHash('md5').update(data.url).digest('hex').substring(0, 16);
        const pp = data.preservePitch ? '1' : '0';
        const fileName = `dlna-speed-${safeUrlId}-s${data.speed}-p${pp}.mp3`;
        const filePath = path.join(os.tmpdir(), fileName);
        try {
            await fsPromises.access(filePath);
            return `http://${lanIp}:${eventServerPort}/serve-temp?path=${encodeURIComponent(filePath)}`;
        } catch {
            return null;
        }
    },
);

ipcMain.on('dlna-cancel-speed-file', () => {
    stopCurrentTranscode();
});

ipcMain.on('dlna-destroy-speed-proxy', () => {
    stopSpeedProxy();
    stopCurrentTranscode();
});
