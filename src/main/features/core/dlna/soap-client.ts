import { net } from 'electron';

import { createLog } from '../../../utils';

const playerLog = (action: string, err?: unknown) => {
    const message = `[Player] ${action}`;
    createLog({ message, type: err ? 'error' : 'info' });
    if (err) {
        console.error(message, err);
    }
};

playerLog('Init Soap Client');

export interface DlnaDevice {
    controlUrl: string;
    id: string;
    location: string;
    name: string;
    renderingControlUrl: string;
}

export interface TrackMetadata {
    albumArtUrl?: string;
    albumName?: string;
    artistName?: string;
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

const AVT = 'urn:schemas-upnp-org:service:AVTransport:1';
const RC = 'urn:schemas-upnp-org:service:RenderingControl:1';

async function soapRequest(url: string, service: string, action: string, body: string): Promise<string> {
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
        request.setHeader('Content-Type', 'text/xml; charset="utf-8"');
        request.setHeader('SOAPAction', `"${service}#${action}"`);
        request.on('response', (response) => {
            let data = '';
            response.on('data', (chunk) => {
                data += chunk.toString();
            });
            response.on('end', () => {
                if (response.statusCode === 200) {
                    resolve(data);
                } else {
                    reject(new Error(`SOAP Request failed with status ${response.statusCode}: ${data}`));
                }
            });
        });
        request.on('error', reject);
        request.write(soapBody);
        request.end();
    });
}

function escapeXml(unsafe: string): string {
    if (!unsafe) return '';
    return unsafe.replace(/[<>&'"]/g, (c) => {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
            default: return c;
        }
    });
}

function buildDIDL(metadata: TrackMetadata, url: string, mimeType: string): string {
    const title = escapeXml(metadata.title || 'Unknown Title');
    const artist = escapeXml(metadata.artistName || 'Unknown Artist');
    const album = escapeXml(metadata.albumName || 'Unknown Album');
    const art = escapeXml(metadata.albumArtUrl || '');
    const duration = formatDuration(metadata.duration || 0);
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
                <res protocolInfo="${protocolInfo}" duration="${duration}">${escapeXml(url)}</res>
            </item>
        </DIDL-Lite>
    `.replace(/\s+/g, ' ').trim();
}

export async function setAVTransportURI(device: DlnaDevice, url: string, metadata: TrackMetadata): Promise<void> {
    const mimeType = metadata.mimeType || 'audio/mpeg';
    playerLog(`SetAVTransportURI - URL: ${url}, MimeType: ${mimeType}`);
    const didl = buildDIDL(metadata, url, mimeType);
    await soapRequest(
        device.controlUrl,
        AVT,
        'SetAVTransportURI',
        `<InstanceID>0</InstanceID>
         <CurrentURI>${escapeXml(url)}</CurrentURI>
         <CurrentURIMetaData>${escapeXml(didl)}</CurrentURIMetaData>`
    );
}

export async function setNextAVTransportURI(device: DlnaDevice, url: string, metadata: TrackMetadata): Promise<void> {
    const mimeType = metadata.mimeType || 'audio/mpeg';
    const didl = buildDIDL(metadata, url, mimeType);
    await soapRequest(
        device.controlUrl,
        AVT,
        'SetNextAVTransportURI',
        `<InstanceID>0</InstanceID>
         <NextURI>${escapeXml(url)}</NextURI>
         <NextURIMetaData>${escapeXml(didl)}</NextURIMetaData>`
    );
}

export async function play(device: DlnaDevice): Promise<void> {
    playerLog('Play');
    await soapRequest(device.controlUrl, AVT, 'Play', `<InstanceID>0</InstanceID><Speed>1</Speed>`);
}

export async function pause(device: DlnaDevice): Promise<void> {
    playerLog('Pause');
    await soapRequest(device.controlUrl, AVT, 'Pause', `<InstanceID>0</InstanceID>`);
}

export async function stop(device: DlnaDevice): Promise<void> {
    playerLog('Stop');
    await soapRequest(device.controlUrl, AVT, 'Stop', `<InstanceID>0</InstanceID>`);
}

export async function seek(device: DlnaDevice, seconds: number): Promise<void> {
    const targetTime = formatDuration(seconds);
    playerLog(`Seek to ${targetTime}`);
    await soapRequest(device.controlUrl, AVT, 'Seek', `<InstanceID>0</InstanceID><Unit>REL_TIME</Unit><Target>${targetTime}</Target>`);
}

export async function setVolume(device: DlnaDevice, volume: number): Promise<void> {
    playerLog(`Set Volume to ${volume}`);
    await soapRequest(device.renderingControlUrl, RC, 'SetVolume', `<InstanceID>0</InstanceID><Channel>Master</Channel><DesiredVolume>${volume}</DesiredVolume>`);
}

export async function setMute(device: DlnaDevice, mute: boolean): Promise<void> {
    playerLog(`Set Mute to ${mute}`);
    await soapRequest(device.renderingControlUrl, RC, 'SetMute', `<InstanceID>0</InstanceID><Channel>Master</Channel><DesiredMute>${mute ? '1' : '0'}</DesiredMute>`);
}

export async function getVolume(device: DlnaDevice): Promise<number> {
    const xml = await soapRequest(device.renderingControlUrl, RC, 'GetVolume', `<InstanceID>0</InstanceID><Channel>Master</Channel>`);
    const match = xml.match(/<CurrentVolume>(.*?)<\/CurrentVolume>/);
    return match ? parseInt(match[1], 10) : 0;
}

export async function getTransportInfo(device: DlnaDevice): Promise<string> {
    const xml = await soapRequest(device.controlUrl, AVT, 'GetTransportInfo', '<InstanceID>0</InstanceID>');
    const match = xml.match(/<CurrentTransportState>(.*?)<\/CurrentTransportState>/);
    return match ? match[1] : 'STOPPED';
}

export async function getPositionInfo(device: DlnaDevice): Promise<{ duration: number; position: number; trackUri: string }> {
    const xml = await soapRequest(device.controlUrl, AVT, 'GetPositionInfo', '<InstanceID>0</InstanceID>');
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
