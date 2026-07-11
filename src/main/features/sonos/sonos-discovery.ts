import { createSocket } from 'dgram';
import https from 'https';
import { networkInterfaces } from 'os';

import log from 'electron-log/main';

import {
    getDiscoveryUrl,
    getGroupsUrl,
    SONOS_CONSTANTS,
} from './sonos-constants';
import type {
    DiscoveryResult,
    SonosDevice,
    SonosDiscoveryInfo,
    SonosGroup,
    SonosGroupsResponse,
    SonosPlayerData,
} from './sonos-types';

const SSDP_ADDRESS = '239.255.255.250';
const SSDP_PORT = 1900;
const SONOS_URN = 'urn:schemas-upnp-org:device:ZonePlayer:1';

const M_SEARCH = Buffer.from(
    [
        'M-SEARCH * HTTP/1.1',
        `HOST: ${SSDP_ADDRESS}:${SSDP_PORT}`,
        'MAN: "ssdp:discover"',
        'MX: 3',
        `ST: ${SONOS_URN}`,
        '',
        '',
    ].join('\r\n'),
);

function httpsGetJson(url: string): Promise<any> {
    return new Promise((resolve, reject) => {
        const req = https.get(
            url,
            {
                headers: { 'X-Sonos-Api-Key': SONOS_CONSTANTS.API_TOKEN },
                rejectUnauthorized: false,
                timeout: SONOS_CONSTANTS.HTTP_TIMEOUT_MS,
            },
            (res) => {
                let data = '';
                res.on('data', (chunk: Buffer) => {
                    data += chunk.toString();
                });
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(data));
                    } catch {
                        reject(new Error(`Failed to parse JSON from ${url}`));
                    }
                });
            },
        );
        req.on('error', reject);
        req.on('timeout', () => {
            req.destroy();
            reject(new Error(`Request timeout: ${url}`));
        });
    });
}

async function fetchDeviceInfo(ip: string): Promise<SonosDevice | null> {
    const url = getDiscoveryUrl(ip);
    try {
        const info: SonosDiscoveryInfo = await httpsGetJson(url);
        return {
            hardwareVersion: '',
            householdId: info.householdId,
            id: info.playerId,
            ipAddress: ip,
            model: 'Unknown',
            modelNumber: '',
            name: 'Unknown',
            serialNumber: '',
            softwareVersion: '',
            websocketUrl: info.websocketUrl,
        };
    } catch (e) {
        log.warn(`[sonos] Failed to fetch device info from ${ip}:`, e);
        return null;
    }
}

async function fetchGroups(
    ip: string,
    householdId: string,
): Promise<SonosGroupsResponse> {
    const url = getGroupsUrl(ip, householdId);
    try {
        const data = await httpsGetJson(url);
        const groups: SonosGroup[] = ((data.groups || []) as any[]).map((g: any) => ({
            areaIds: g.areaIds || [],
            coordinatorId: g.coordinatorId || '',
            householdId: g.householdId || householdId,
            id: g.id || '',
            name: g.name || '',
            playbackState: g.playbackState,
            playerIds: g.playerIds || [],
        }));
        const players: SonosPlayerData[] = ((data.players || []) as any[]).map((p: any) => ({
            hardwareVersion: p.hardwareVersion,
            householdId: p.householdId || householdId,
            icon: p.icon,
            id: p.id || '',
            model: p.model,
            modelNumber: p.modelNumber,
            name: p.name || '',
            roomName: p.roomName,
            serialNumber: p.serialNumber,
            softwareVersion: p.softwareVersion,
        }));
        return { groups, players };
    } catch (e) {
        log.warn(`[sonos] Failed to fetch groups from ${ip}:`, e);
        return { groups: [], players: [] };
    }
}

function getLocalNetworkIps(): string[] {
    const ips: string[] = [];
    const interfaces = networkInterfaces();
    for (const [, addrs] of Object.entries(interfaces)) {
        if (!addrs) continue;
        for (const addr of addrs) {
            if (addr.family === 'IPv4' && !addr.internal) {
                ips.push(addr.address);
            }
        }
    }
    return ips;
}

function discoverViaSsdp(): Promise<string[]> {
    return new Promise((resolve) => {
        const ips = new Set<string>();
        let resolved = false;
        let socket: ReturnType<typeof createSocket> | null = null;
        const localIps = getLocalNetworkIps();

        const finish = () => {
            if (resolved) return;
            resolved = true;
            try { socket?.close(); } catch {}
            resolve([...ips]);
        };

        const localIp = localIps.find((ip) => ip.startsWith('192.') || ip.startsWith('10.') || ip.startsWith('172.16.'));

        try {
            socket = createSocket({ type: 'udp4', reuseAddr: true });

            socket.on('message', (msg: Buffer) => {
                const text = msg.toString();
                if (text.includes(SONOS_URN)) {
                    const match = text.match(/LOCATION:\s*https?:\/\/([^:/]+)[:/]/i);
                    if (match) {
                        ips.add(match[1]);
                        log.info(`[sonos] SSDP found device at ${match[1]}`);
                    }
                }
            });

            socket.on('listening', () => {
                const addr = socket!.address();
                log.info(`[sonos] SSDP socket bound to ${addr.address}:${addr.port}`);
                try {
                    socket!.addMembership(SSDP_ADDRESS);
                    socket!.setBroadcast(true);

                    // Send M-SEARCH multiple times
                    const send = () => {
                        try {
                            socket!.send(M_SEARCH, SSDP_PORT, SSDP_ADDRESS);
                        } catch (e) {
                            log.warn('[sonos] SSDP send error:', e);
                        }
                    };
                    send();
                    setTimeout(send, 1000);
                    setTimeout(send, 2000);
                } catch (e) {
                    log.warn('[sonos] SSDP addMembership error:', e);
                    finish();
                }
            });

            socket.on('error', (err) => {
                log.warn('[sonos] SSDP socket error:', err.message);
                finish();
            });

            socket!.bind(0, localIp || '0.0.0.0');
        } catch (e) {
            log.warn('[sonos] SSDP creation error:', e);
            finish();
        }

        setTimeout(finish, SONOS_CONSTANTS.DISCOVERY_TIMEOUT_MS);
    });
}

/**
 * LAN scan fallback: try common Sonos ports on all local subnet IPs.
 * Sonos devices run on ports 1400 (HTTP) and 1443 (HTTPS).
 */
async function discoverViaLanScan(): Promise<string[]> {
    const localIps = getLocalNetworkIps();
    log.info(`[sonos] LAN scan: local IPs = ${localIps.join(', ')}`);

    const ips = new Set<string>();

    // Generate potential Sonos IPs based on local subnets
    const candidates: string[] = [];
    for (const localIp of localIps) {
        const parts = localIp.split('.');
        const subnet = `${parts[0]}.${parts[1]}.${parts[2]}`;
        // Scan common DHCP range .1 - .100
        for (let i = 1; i <= 254; i++) {
            candidates.push(`${subnet}.${i}`);
        }
    }

    // Probe candidates in parallel batches
    const batchSize = 20;
    for (let i = 0; i < candidates.length; i += batchSize) {
        const batch = candidates.slice(i, i + batchSize);
        const results = await Promise.all(
            batch.map(async (ip) => {
                const url = `https://${ip}:1443/api/v1/players/local/info`;
                try {
                    await httpsGetJson(url);
                    return ip;
                } catch {
                    return null;
                }
            }),
        );
        for (const ip of results) {
            if (ip) ips.add(ip);
        }
    }

    return [...ips];
}

export async function discoverSonosDevices(): Promise<DiscoveryResult> {
    let devices: SonosDevice[] = [];
    let groups: SonosGroup[] = [];
    let lastError: string | null = null;

    // Try SSDP first
    log.info('[sonos] Starting SSDP discovery...');
    let ips = await discoverViaSsdp();
    log.info(`[sonos] SSDP result: ${ips.length} devices`);

    // Fall back to LAN scan
    if (ips.length === 0) {
        log.info('[sonos] SSDP found nothing, trying LAN scan...');
        try {
            ips = await discoverViaLanScan();
            log.info(`[sonos] LAN scan result: ${ips.length} devices`);
        } catch (e) {
            log.warn('[sonos] LAN scan failed:', e);
            lastError = `SSDP found nothing, LAN scan failed: ${(e as Error).message}`;
        }
    }

    if (ips.length > 0) {
        const results = await Promise.all(ips.map((ip) => fetchDeviceInfo(ip)));
        devices = results.filter(Boolean) as SonosDevice[];
        log.info(`[sonos] Fetched device info for ${devices.length} devices`);

        if (devices.length > 0) {
            const firstDevice = devices[0];
            const groupsResponse = await fetchGroups(
                firstDevice.ipAddress,
                firstDevice.householdId,
            );

            const playersById = new Map<string, SonosPlayerData>();
            for (const player of groupsResponse.players) {
                playersById.set(player.id, player);
            }

            for (const device of devices) {
                const playerData = playersById.get(device.id);
                if (playerData) {
                    device.name = playerData.name || device.name;
                    device.model = playerData.model || device.model;
                    device.modelNumber = playerData.modelNumber || device.modelNumber;
                    device.serialNumber = playerData.serialNumber || device.serialNumber;
                    device.softwareVersion = playerData.softwareVersion || device.softwareVersion;
                    device.hardwareVersion = playerData.hardwareVersion || device.hardwareVersion;
                }
            }

            groups = groupsResponse.groups;
            log.info(`[sonos] Fetched ${groups.length} groups`);
        }
    }

    if (ips.length === 0 && !lastError) {
        lastError = 'No Sonos devices found on the network';
    }

    log.info(`[sonos] Discovery complete: ${devices.length} devices, ${groups.length} groups`);
    return { devices, groups, error: lastError };
}
