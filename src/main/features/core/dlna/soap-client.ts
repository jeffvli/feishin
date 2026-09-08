import { net } from 'electron';

import log from '/@/main/logger';

const playerLog = (action: string, err?: unknown) => {
    const message = `[Player] ${action}`;
    log.info(message, err);
};

export interface DlnaDevice {
    controlUrl: string;
    groupCoordinatorId?: string;
    groupMembers?: DlnaDevice[];
    id: string;
    isPair?: boolean;
    location: string;
    name: string;
    renderingControlUrl: string;
}

export interface TrackMetadata {
    albumArtUrl?: string;
    albumName?: string;
    artistName?: string;
    autoPlay?: boolean;
    duration?: number;
    mimeType?: string;
    title: string;
}

function formatDuration(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

const RC = 'urn:schemas-upnp-org:service:RenderingControl:1';
const AVT = 'urn:schemas-upnp-org:service:AVTransport:1';
const DP = 'urn:schemas-upnp-org:service:DeviceProperties:1';

export async function becomeCoordinatorOfStandaloneGroup(device: DlnaDevice): Promise<void> {
    playerLog(`BecomeCoordinatorOfStandaloneGroup: ${device.name}`);
    await soapRequest(
        device.controlUrl,
        AVT,
        'BecomeCoordinatorOfStandaloneGroup',
        `<InstanceID>0</InstanceID>`,
    );
}

export async function clearNextAVTransportURI(device: DlnaDevice): Promise<void> {
    playerLog(`ClearNextAVTransportURI: ${device.name}`);
    await soapRequest(
        device.controlUrl,
        AVT,
        'SetNextAVTransportURI',
        `<InstanceID>0</InstanceID><NextURI></NextURI><NextURIMetaData></NextURIMetaData>`,
    );
}

export async function getBass(device: DlnaDevice): Promise<number> {
    const xml = await soapRequest(
        device.renderingControlUrl,
        RC,
        'GetBass',
        '<InstanceID>0</InstanceID>',
    );
    return parseInt2(xml, 'CurrentBass');
}

export async function getButtonLockState(device: DlnaDevice): Promise<boolean> {
    const dpUrl = getDevicePropertiesUrl(device);
    const xml = await soapRequest(dpUrl, DP, 'GetButtonLockState', '');
    const m = xml.match(/<CurrentButtonLockState>(.*?)<\/CurrentButtonLockState>/);
    return m ? m[1].trim().toLowerCase() === 'off' : true;
}

export async function getCrossfadeMode(device: DlnaDevice): Promise<boolean> {
    const xml = await soapRequest(
        device.controlUrl,
        AVT,
        'GetCrossfadeMode',
        '<InstanceID>0</InstanceID>',
    );
    return parseBool(xml, 'CrossfadeMode');
}

export function getDevicePropertiesUrl(device: DlnaDevice): string {
    try {
        const base = new URL(device.location);
        return `${base.protocol}//${base.hostname}:1400/DeviceProperties/Control`;
    } catch {
        return device.controlUrl.replace(
            '/MediaRenderer/AVTransport/Control',
            '/DeviceProperties/Control',
        );
    }
}

export async function getLEDState(device: DlnaDevice): Promise<boolean> {
    const dpUrl = getDevicePropertiesUrl(device);
    const xml = await soapRequest(dpUrl, DP, 'GetLEDState', '');
    const m = xml.match(/<CurrentLEDState>(.*?)<\/CurrentLEDState>/);
    return m ? m[1].trim().toLowerCase() === 'on' : false;
}

export async function getLoudness(device: DlnaDevice): Promise<boolean> {
    const xml = await soapRequest(
        device.renderingControlUrl,
        RC,
        'GetLoudness',
        '<InstanceID>0</InstanceID><Channel>Master</Channel>',
    );
    return parseBool(xml, 'CurrentLoudness');
}

export async function getMediaInfo(
    device: DlnaDevice,
): Promise<{ currentUri: string; nextUri: string }> {
    const xml = await soapRequest(
        device.controlUrl,
        AVT,
        'GetMediaInfo',
        '<InstanceID>0</InstanceID>',
    );
    const unescapeXml = (s: string) =>
        s
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&apos;/g, "'")
            .replace(/&quot;/g, '"');
    const currentMatch = xml.match(/<CurrentURI>([\s\S]*?)<\/CurrentURI>/);
    const nextMatch = xml.match(/<NextURI>([\s\S]*?)<\/NextURI>/);
    return {
        currentUri: currentMatch ? unescapeXml(currentMatch[1].trim()) : '',
        nextUri: nextMatch ? unescapeXml(nextMatch[1].trim()) : '',
    };
}

export async function getPositionInfo(
    device: DlnaDevice,
): Promise<{ duration: number; position: number; trackUri: string }> {
    const xml = await soapRequest(
        device.controlUrl,
        AVT,
        'GetPositionInfo',
        '<InstanceID>0</InstanceID>',
        POLL_TIMEOUT_MS,
    );
    const parseTime = (timeStr: string): number => {
        if (!timeStr || timeStr === 'NOT_IMPLEMENTED' || timeStr === '0') return 0;
        const parts = timeStr.split(':').map(parseFloat);
        if (parts.length !== 3) return 0;
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
    };
    const relTimeMatch = xml.match(/<RelTime>(.*?)<\/RelTime>/);
    const durationMatch = xml.match(/<TrackDuration>(.*?)<\/TrackDuration>/);
    const trackUriMatch = xml.match(/<TrackURI>(.*?)<\/TrackURI>/);
    const rawUri = trackUriMatch?.[1] ?? '';
    const trackUri = rawUri
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&apos;/g, "'")
        .replace(/&quot;/g, '"');
    return {
        duration: durationMatch ? parseTime(durationMatch[1]) : 0,
        position: relTimeMatch ? parseTime(relTimeMatch[1]) : 0,
        trackUri,
    };
}

export function getRinconId(device: DlnaDevice): string {
    return device.id.replace(/^uuid:/i, '');
}

export function getTopologyControlUrl(device: DlnaDevice): string {
    const base = new URL(device.location);
    return `${base.protocol}//${base.hostname}:1400/ZoneGroupTopology/Control`;
}

export function getTopologyEventUrl(device: DlnaDevice): string {
    const base = new URL(device.location);
    return `${base.protocol}//${base.hostname}:1400/ZoneGroupTopology/Event`;
}

export async function getTransportInfo(device: DlnaDevice): Promise<string> {
    const xml = await soapRequest(
        device.controlUrl,
        AVT,
        'GetTransportInfo',
        '<InstanceID>0</InstanceID>',
        POLL_TIMEOUT_MS,
    );
    const match = xml.match(/<CurrentTransportState>(.*?)<\/CurrentTransportState>/);
    return match ? match[1] : 'STOPPED';
}

export async function getTreble(device: DlnaDevice): Promise<number> {
    const xml = await soapRequest(
        device.renderingControlUrl,
        RC,
        'GetTreble',
        '<InstanceID>0</InstanceID>',
    );
    return parseInt2(xml, 'CurrentTreble');
}

export async function getVolume(device: DlnaDevice): Promise<number> {
    const xml = await soapRequest(
        device.renderingControlUrl,
        RC,
        'GetVolume',
        `<InstanceID>0</InstanceID><Channel>Master</Channel>`,
    );
    const match = xml.match(/<CurrentVolume>(.*?)<\/CurrentVolume>/);
    return match ? parseInt(match[1], 10) : 0;
}

export async function getZoneGroupState(device: DlnaDevice): Promise<string> {
    const xml = await soapRequest(
        getTopologyControlUrl(device),
        'urn:schemas-upnp-org:service:ZoneGroupTopology:1',
        'GetZoneGroupState',
        '',
    );
    const match = xml.match(/<ZoneGroupState>([\s\S]*?)<\/ZoneGroupState>/);
    if (!match) return '';
    return match[1]
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&apos;/g, "'")
        .replace(/&quot;/g, '"');
}

export async function joinGroup(member: DlnaDevice, coordinator: DlnaDevice): Promise<void> {
    const rinconId = getRinconId(coordinator);
    playerLog(`Join group: ${member.name} -> ${coordinator.name} (${rinconId})`);
    await soapRequest(
        member.controlUrl,
        AVT,
        'SetAVTransportURI',
        `<InstanceID>0</InstanceID>
         <CurrentURI>x-rincon:${rinconId}</CurrentURI>
         <CurrentURIMetaData></CurrentURIMetaData>`,
    );
}

export async function pause(device: DlnaDevice): Promise<void> {
    playerLog('Pause');
    await soapRequest(device.controlUrl, AVT, 'Pause', `<InstanceID>0</InstanceID>`);
}

export async function play(device: DlnaDevice): Promise<void> {
    playerLog('Play');
    await soapRequest(device.controlUrl, AVT, 'Play', `<InstanceID>0</InstanceID><Speed>1</Speed>`);
}

export async function seek(device: DlnaDevice, seconds: number): Promise<void> {
    const targetTime = formatDuration(seconds);
    playerLog(`Seek to ${targetTime}`);
    await soapRequest(
        device.controlUrl,
        AVT,
        'Seek',
        `<InstanceID>0</InstanceID><Unit>REL_TIME</Unit><Target>${targetTime}</Target>`,
    );
}

export async function setAVTransportURI(
    device: DlnaDevice,
    url: string,
    metadata: TrackMetadata,
): Promise<void> {
    const mimeType = metadata.mimeType || 'audio/mpeg';
    playerLog(`SetAVTransportURI - URL: ${url}, MimeType: ${mimeType}`);
    const didl = buildDIDL(metadata, url, mimeType);
    await soapRequest(
        device.controlUrl,
        AVT,
        'SetAVTransportURI',
        `<InstanceID>0</InstanceID>
         <CurrentURI>${escapeXml(url)}</CurrentURI>
         <CurrentURIMetaData>${escapeXml(didl)}</CurrentURIMetaData>`,
    );
}

export async function setBass(device: DlnaDevice, value: number): Promise<void> {
    await soapRequest(
        device.renderingControlUrl,
        RC,
        'SetBass',
        `<InstanceID>0</InstanceID><DesiredBass>${value}</DesiredBass>`,
    );
}

export async function setButtonLockState(device: DlnaDevice, touchEnabled: boolean): Promise<void> {
    const dpUrl = getDevicePropertiesUrl(device);
    await soapRequest(
        dpUrl,
        DP,
        'SetButtonLockState',
        `<DesiredButtonLockState>${touchEnabled ? 'Off' : 'On'}</DesiredButtonLockState>`,
    );
}

export async function setCrossfadeMode(device: DlnaDevice, value: boolean): Promise<void> {
    await soapRequest(
        device.controlUrl,
        AVT,
        'SetCrossfadeMode',
        `<InstanceID>0</InstanceID><CrossfadeMode>${value ? '1' : '0'}</CrossfadeMode>`,
    );
}

export async function setLEDState(device: DlnaDevice, on: boolean): Promise<void> {
    const dpUrl = getDevicePropertiesUrl(device);
    await soapRequest(
        dpUrl,
        DP,
        'SetLEDState',
        `<DesiredLEDState>${on ? 'On' : 'Off'}</DesiredLEDState>`,
    );
}

export async function setLoudness(device: DlnaDevice, value: boolean): Promise<void> {
    await soapRequest(
        device.renderingControlUrl,
        RC,
        'SetLoudness',
        `<InstanceID>0</InstanceID><Channel>Master</Channel><DesiredLoudness>${value ? '1' : '0'}</DesiredLoudness>`,
    );
}

export async function setMute(device: DlnaDevice, mute: boolean): Promise<void> {
    playerLog(`Set Mute to ${mute}`);
    await soapRequest(
        device.renderingControlUrl,
        RC,
        'SetMute',
        `<InstanceID>0</InstanceID><Channel>Master</Channel><DesiredMute>${mute ? '1' : '0'}</DesiredMute>`,
    );
}

export async function setNextAVTransportURI(
    device: DlnaDevice,
    url: string,
    metadata: TrackMetadata,
): Promise<void> {
    const mimeType = metadata.mimeType || 'audio/mpeg';
    const didl = buildDIDL(metadata, url, mimeType);
    await soapRequest(
        device.controlUrl,
        AVT,
        'SetNextAVTransportURI',
        `<InstanceID>0</InstanceID>
         <NextURI>${escapeXml(url)}</NextURI>
         <NextURIMetaData>${escapeXml(didl)}</NextURIMetaData>`,
    );
}

export async function setTreble(device: DlnaDevice, value: number): Promise<void> {
    await soapRequest(
        device.renderingControlUrl,
        RC,
        'SetTreble',
        `<InstanceID>0</InstanceID><DesiredTreble>${value}</DesiredTreble>`,
    );
}

export async function setVolume(device: DlnaDevice, volume: number): Promise<void> {
    playerLog(`Set Volume to ${volume}`);
    await soapRequest(
        device.renderingControlUrl,
        RC,
        'SetVolume',
        `<InstanceID>0</InstanceID><Channel>Master</Channel><DesiredVolume>${volume}</DesiredVolume>`,
    );
}

export async function stop(device: DlnaDevice): Promise<void> {
    playerLog('Stop');
    await soapRequest(device.controlUrl, AVT, 'Stop', `<InstanceID>0</InstanceID>`);
}

function buildDIDL(metadata: TrackMetadata, url: string, mimeType: string): string {
    const title = escapeXml(metadata.title || 'Unknown Title');
    const artist = escapeXml(metadata.artistName || 'Unknown Artist');
    const album = escapeXml(metadata.albumName || 'Unknown Album');
    const art = escapeXml(metadata.albumArtUrl || '');
    const protocolInfo = `http-get:*:${mimeType}:*`;
    return `
        <DIDL-Lite xmlns="urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/"
                   xmlns:dc="http://purl.org/dc/elements/1.1/"
                   xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">
            <item id="1" parentID="0" restricted="1">
                <dc:title>${title}</dc:title>
                <dc:creator>${artist}</dc:creator>
                <upnp:album>${album}</upnp:album>
                <upnp:class>object.item.audioItem.musicTrack</upnp:class>
                <upnp:albumArtURI>${art}</upnp:albumArtURI>
                <res protocolInfo="${protocolInfo}">${escapeXml(url)}</res>
            </item>
        </DIDL-Lite>
    `
        .replace(/\s+/g, ' ')
        .trim();
}
function escapeXml(unsafe: string): string {
    if (!unsafe) return '';
    return unsafe.replace(/[<>&'"]/g, (c) => {
        switch (c) {
            case '"':
                return '&quot;';
            case '&':
                return '&amp;';
            case "'":
                return '&apos;';
            case '<':
                return '&lt;';
            case '>':
                return '&gt;';
            default:
                return c;
        }
    });
}

function parseBool(xml: string, tag: string): boolean {
    const m = xml.match(new RegExp(`<${tag}>(.*?)</${tag}>`));
    if (!m) return false;
    const v = m[1].trim().toLowerCase();
    return v === '1' || v === 'true';
}

function parseInt2(xml: string, tag: string): number {
    const m = xml.match(new RegExp(`<${tag}>(.*?)</${tag}>`));
    return m ? parseInt(m[1], 10) : 0;
}

// Renderers stall: a Yamaha HTR-6067 has taken 7 s to answer SetAVTransportURI and has
// left position queries unanswered. Without a limit one such call parks the poller (it
// polls one request at a time) and any flow awaiting the command. Polls use a short
// limit, commands a long one.
const COMMAND_TIMEOUT_MS = 15000;
const POLL_TIMEOUT_MS = 4000;

async function soapRequest(
    url: string,
    service: string,
    action: string,
    body: string,
    timeoutMs: number = COMMAND_TIMEOUT_MS,
): Promise<string> {
    const soapBody = `<?xml version="1.0" encoding="utf-8"?>
<s:Envelope s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/" xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">
    <s:Body>
        <u:${action} xmlns:u="${service}">
            ${body}
        </u:${action}>
    </s:Body>
</s:Envelope>`;
    return new Promise((resolve, reject) => {
        const request = net.request({
            method: 'POST',
            url: url,
        });
        const timer = setTimeout(() => {
            request.abort();
            reject(new Error(`SOAP ${action} timed out after ${timeoutMs} ms`));
        }, timeoutMs);
        request.setHeader('Content-Type', 'text/xml; charset="utf-8"');
        request.setHeader('SOAPAction', `"${service}#${action}"`);
        request.on('response', (response) => {
            let data = '';
            response.on('data', (chunk) => {
                data += chunk.toString();
            });
            response.on('end', () => {
                clearTimeout(timer);
                if (response.statusCode === 200) {
                    resolve(data);
                } else {
                    reject(
                        new Error(
                            `SOAP Request failed with status ${response.statusCode}: ${data}`,
                        ),
                    );
                }
            });
        });
        request.on('error', (err) => {
            clearTimeout(timer);
            reject(err);
        });
        request.write(soapBody);
        request.end();
    });
}
