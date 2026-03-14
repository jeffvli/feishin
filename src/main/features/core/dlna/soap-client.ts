import { net } from 'electron';

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
    title: string;
}

function buildDidlLite(streamUrl: string, metadata: TrackMetadata): string {
    const duration = metadata.duration ? formatDuration(metadata.duration) : '0:00:00';
    const escape = (s: string) =>
        s
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');

    const albumArt = metadata.albumArtUrl
        ? `<upnp:albumArtURI>${escape(metadata.albumArtUrl)}</upnp:albumArtURI>`
        : '';

    return `<DIDL-Lite xmlns="urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/"
        xmlns:dc="http://purl.org/dc/elements/1.1/"
        xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">
        <item id="0" parentID="-1" restricted="1">
            <dc:title>${escape(metadata.title)}</dc:title>
            <dc:creator>${escape(metadata.artistName || '')}</dc:creator>
            <upnp:artist>${escape(metadata.artistName || '')}</upnp:artist>
            <upnp:album>${escape(metadata.albumName || '')}</upnp:album>
            ${albumArt}
            <upnp:class>object.item.audioItem.musicTrack</upnp:class>
            <res protocolInfo="http-get:*:audio/mpeg:*" duration="${duration}">${escape(streamUrl)}</res>
        </item>
    </DIDL-Lite>`;
}

function formatDuration(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

async function soapRequest(
    url: string,
    serviceType: string,
    action: string,
    body: string,
): Promise<string> {
    const soapBody = `<?xml version="1.0" encoding="utf-8"?>
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/"
    s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
    <s:Body>
        <u:${action} xmlns:u="${serviceType}">
            ${body}
        </u:${action}>
    </s:Body>
</s:Envelope>`;

    const response = await net.fetch(url, {
        body: soapBody,
        headers: {
            'Content-Type': 'text/xml; charset="utf-8"',
            SOAPAction: `"${serviceType}#${action}"`,
        },
        method: 'POST',
    });
    return response.text();
}

const AVT = 'urn:schemas-upnp-org:service:AVTransport:1';
const RC = 'urn:schemas-upnp-org:service:RenderingControl:1';

export interface PositionInfo {
    duration: number;
    position: number;
    transportState: string;
}

export async function getPositionInfo(device: DlnaDevice): Promise<PositionInfo> {
    const response = await soapRequest(
        device.controlUrl,
        AVT,
        'GetPositionInfo',
        `<InstanceID>0</InstanceID>`,
    );

    const relTimeMatch = response.match(/<RelTime>([^<]+)<\/RelTime>/);
    const durationMatch = response.match(/<TrackDuration>([^<]+)<\/TrackDuration>/);

    return {
        duration: durationMatch ? parseTime(durationMatch[1]) : 0,
        position: relTimeMatch ? parseTime(relTimeMatch[1]) : 0,
        transportState: 'PLAYING',
    };
}

export async function getTransportInfo(device: DlnaDevice): Promise<{ state: string }> {
    const response = await soapRequest(
        device.controlUrl,
        AVT,
        'GetTransportInfo',
        `<InstanceID>0</InstanceID>`,
    );

    const stateMatch = response.match(/<CurrentTransportState>([^<]+)<\/CurrentTransportState>/);

    return { state: stateMatch ? stateMatch[1] : 'UNKNOWN' };
}

export async function getVolume(device: DlnaDevice): Promise<number> {
    const response = await soapRequest(
        device.renderingControlUrl,
        RC,
        'GetVolume',
        `<InstanceID>0</InstanceID><Channel>Master</Channel>`,
    );
    const match = response.match(/<CurrentVolume>(\d+)<\/CurrentVolume>/);
    return match ? parseInt(match[1]) : 50;
}

export async function pause(device: DlnaDevice): Promise<void> {
    await soapRequest(device.controlUrl, AVT, 'Pause', `<InstanceID>0</InstanceID>`);
}

export async function play(device: DlnaDevice): Promise<void> {
    await soapRequest(device.controlUrl, AVT, 'Play', `<InstanceID>0</InstanceID><Speed>1</Speed>`);
}

export async function seek(device: DlnaDevice, seconds: number): Promise<void> {
    const target = formatDuration(seconds);
    await soapRequest(
        device.controlUrl,
        AVT,
        'Seek',
        `<InstanceID>0</InstanceID><Unit>REL_TIME</Unit><Target>${target}</Target>`,
    );
}

export async function setAVTransportURI(
    device: DlnaDevice,
    streamUrl: string,
    metadata: TrackMetadata,
): Promise<void> {
    const didl = buildDidlLite(streamUrl, metadata);
    const escape = (s: string) =>
        s
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');

    await soapRequest(
        device.controlUrl,
        AVT,
        'SetAVTransportURI',
        `<InstanceID>0</InstanceID>
        <CurrentURI>${escape(streamUrl)}</CurrentURI>
        <CurrentURIMetaData>${escape(didl)}</CurrentURIMetaData>`,
    );
}

export async function setMute(device: DlnaDevice, mute: boolean): Promise<void> {
    await soapRequest(
        device.renderingControlUrl,
        RC,
        'SetMute',
        `<InstanceID>0</InstanceID><Channel>Master</Channel><DesiredMute>${mute ? '1' : '0'}</DesiredMute>`,
    );
}

export async function setNextAVTransportURI(
    device: DlnaDevice,
    streamUrl: string,
    metadata: TrackMetadata,
): Promise<void> {
    const didl = buildDidlLite(streamUrl, metadata);
    const escape = (s: string) =>
        s
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');

    await soapRequest(
        device.controlUrl,
        AVT,
        'SetNextAVTransportURI',
        `<InstanceID>0</InstanceID>
        <NextURI>${escape(streamUrl)}</NextURI>
        <NextURIMetaData>${escape(didl)}</NextURIMetaData>`,
    );
}

export async function setVolume(device: DlnaDevice, volume: number): Promise<void> {
    const vol = Math.round(Math.max(0, Math.min(100, volume)));
    await soapRequest(
        device.renderingControlUrl,
        RC,
        'SetVolume',
        `<InstanceID>0</InstanceID><Channel>Master</Channel><DesiredVolume>${vol}</DesiredVolume>`,
    );
}

export async function stop(device: DlnaDevice): Promise<void> {
    await soapRequest(device.controlUrl, AVT, 'Stop', `<InstanceID>0</InstanceID>`);
}

function parseTime(timeStr: string): number {
    const match = timeStr.match(/(\d+):(\d+):(\d+)/);
    if (!match) return 0;
    return parseInt(match[1]) * 3600 + parseInt(match[2]) * 60 + parseInt(match[3]);
}
