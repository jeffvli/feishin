import et from 'elementtree';
import UpnpMediaRendererClient from 'upnp-mediarenderer-client';

import { DlnaMetadata } from '/@/shared/types/types';

export class MediaRendererClient extends UpnpMediaRendererClient {
    constructor(url: string) {
        super(url);
        this.on('status', (newStatus) => {
            if (Object.prototype.hasOwnProperty.call(newStatus, 'AVTransportURI')) {
                this.emit('changedTrack', newStatus.AVTransportURI);
            }
        });
    }

    public getMute(callback?: (error?: any, result?: any) => void) {
        const params = {
            Channel: 'Master',
            InstanceID: this.instanceId,
        };
        this.callAction('RenderingControl', 'GetMute', params, callback || (() => {}));
    }

    public load(
        url: string,
        options: {
            autoplay?: boolean;
            contentType?: string;
            dlnaFeatures?: string;
            isNext?: boolean;
            metadata?: DlnaMetadata;
        },
        callback: (error?: any, result?: any) => void,
    ) {
        const contentType = options.contentType ?? 'audio/mpeg';
        const dlnaFeatures = makeAudioDlnaFeatures(contentType);
        const protocolInfo = makeProtocolInfo({ contentType, dlnaFeatures });

        const metadata = { ...options.metadata, protocolInfo, url };

        const params = {
            Direction: 'Input',
            PeerConnectionID: -1,
            PeerConnectionManager: null,
            RemoteProtocolInfo: protocolInfo,
        };

        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;
        this.callAction(
            'ConnectionManager',
            'PrepareForConnection',
            params,
            function (err, result) {
                if (err) {
                    if (err.code !== 'ENOACTION') return callback(err);

                    // If PrepareForConnection is not implemented, we keep the default (0) InstanceID
                } else {
                    self.instanceId = result.AVTransportID;
                }

                const metadataString = buildMetadata(metadata);
                const params = options.isNext
                    ? {
                          InstanceID: self.instanceId,
                          NextURI: url,
                          NextURIMetaData: metadataString,
                      }
                    : {
                          CurrentURI: url,
                          CurrentURIMetaData: metadataString,
                          InstanceID: self.instanceId,
                      };
                const action = options.isNext ? 'SetNextAVTransportURI' : 'SetAVTransportURI';

                self.callAction('AVTransport', action, params, function (err) {
                    if (err) return callback(err);
                    if (options.autoplay) {
                        self.play({}, callback);
                        return;
                    }
                    callback();
                });
            },
        );
    }

    public play(opts?: { speed?: number }, callback?: (error?: any, result?: any) => void) {
        const params = {
            InstanceID: this.instanceId,
            Speed: opts?.speed || 1,
        };
        this.callAction('AVTransport', 'Play', params, callback || (() => {}));
    }

    public setMute(isMuted: boolean, callback?: (error?: any, result?: any) => void) {
        const params = {
            Channel: 'Master',
            DesiredMute: isMuted ? 1 : 0,
            InstanceID: this.instanceId,
        };
        this.callAction('RenderingControl', 'SetMute', params, callback || (() => {}));
    }
}

/**
 * Constructs a DIDL-Lite XML representation of media metadata based on the provided object and its properties, handling audio, image, video types with appropriate classifications, titles, creators, URLs for protocol information such as HTTP or RTSP streams*/
function buildMetadata(metadata: DlnaMetadata & { protocolInfo: string; url: string }) {
    const root = et.Element('DIDL-Lite');
    root.set('xmlns', 'urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/');
    root.set('xmlns:dc', 'http://purl.org/dc/elements/1.1/');
    root.set('xmlns:upnp', 'urn:schemas-upnp-org:metadata-1-0/upnp/');
    root.set('xmlns:sec', 'http://www.sec.co.kr/');

    const item = et.SubElement(root, 'item');
    item.set('id', 0);
    item.set('parentID', -1);
    item.set('restricted', false);

    if (metadata.title) {
        const title = et.SubElement(item, 'dc:title');
        title.text = metadata.title;
    }

    const OBJECT_CLASSES = {
        audio: 'object.item.audioItem.musicTrack',
        image: 'object.item.imageItem.photo',
        video: 'object.item.videoItem.movie',
    };

    if (metadata.type) {
        const klass = et.SubElement(item, 'upnp:class');
        klass.text = OBJECT_CLASSES[metadata.type];
    }

    const res = et.SubElement(item, 'res');
    res.set('protocolInfo', metadata.protocolInfo);
    if (metadata.duration) res.set('duration', formatDuration(metadata.duration));
    if (metadata.bitrate) res.set('bitrate', metadata.bitrate * 1000);
    if (metadata.size) res.set('size', metadata.size);
    res.text = metadata.url;

    if (metadata.album) {
        const album = et.SubElement(item, 'upnp:album');
        album.text = metadata.album;
    }

    if (metadata.albumArtUrl) {
        const albumArtURI = et.SubElement(item, 'upnp:albumArtURI');
        albumArtURI.text = metadata.albumArtUrl;

        if (metadata.albumArtMimeType && metadata.albumArtSize) {
            const dlnaFeatures = makeImageDlnaFeatures({
                contentType: metadata.albumArtMimeType,
                size: metadata.albumArtSize,
            });
            const protocolInfo = makeProtocolInfo({
                contentType: metadata.albumArtMimeType,
                dlnaFeatures,
            });
            const resolution = `${metadata.albumArtSize}x${metadata.albumArtSize}`;

            const res = et.SubElement(item, 'res');
            res.set('protocolInfo', protocolInfo);
            res.set('resolution', resolution);
            res.text = metadata.albumArtUrl;
        }
    }

    if (metadata.creator) {
        const creator = et.SubElement(item, 'dc:creator');
        creator.text = metadata.creator;
    }

    if (metadata.date) {
        const date = et.SubElement(item, 'dc:date');
        date.text = metadata.date;
    }

    if (metadata.genre) {
        const genre = et.SubElement(item, 'dc:genre');
        genre.text = metadata.genre;
    }

    if (metadata.discNumber) {
        const originalDiscNumber = et.SubElement(item, 'dc:originalDiscNumber');
        originalDiscNumber.text = metadata.discNumber;
    }

    if (metadata.trackNumber) {
        const originalTrackNumber = et.SubElement(item, 'dc:originalTrackNumber');
        originalTrackNumber.text = metadata.trackNumber;
    }

    const doc = new et.ElementTree(root);
    return doc.write({ xml_declaration: false });
}

function formatDuration(millisecondsTotal: number) {
    const divideWithRemainder = (a: number, b: number) => [Math.floor(a / b), Math.floor(a % b)];

    const [secondsTotal, milliseconds] = divideWithRemainder(millisecondsTotal, 1000);
    const [minutesTotal, seconds] = divideWithRemainder(secondsTotal, 60);
    const [hoursTotal, minutes] = divideWithRemainder(minutesTotal, 60);

    const pad = (value: number, width: number) => value.toString().padStart(width, '0');

    const result = `${hoursTotal}:${pad(minutes, 2)}:${pad(seconds, 2)}.${pad(milliseconds, 3)}`;
    return result;
}

function makeProtocolInfo({
    contentType,
    dlnaFeatures,
}: {
    contentType: string;
    dlnaFeatures?: Record<string, string>;
}) {
    const dlnaFeaturesString = serializeDlnaFeatures(dlnaFeatures ?? {}) ?? '*';
    return `http-get:*:${contentType}:${dlnaFeaturesString}`;
}

const DLNA_PROFILE_MAP = {
    ['audio/flac']: 'LPCM',
    ['audio/mp4']: 'AAC_ISO_320',
    ['audio/mpeg']: 'MP3',
    ['audio/wav']: 'LPCM',
    ['audio/x-flac']: 'LPCM',
    ['image/gif']: 'GIF',
    ['image/jpeg']: 'JPEG',
    ['image/png']: 'PNG',
} as const;

const STANDARD_AUDIO_DLNA_FEATURES = {
    /**
     * 32-bit hexadecimal flag, with 96 bits of 0-padding appended.
     *
     * Meaning of the bits:
     * * DLNA_ORG_FLAG_SENDER_PACED              = (1 << 31)
     * * DLNA_ORG_FLAG_TIME_BASED_SEEK           = (1 << 30)
     * * DLNA_ORG_FLAG_BYTE_BASED_SEEK           = (1 << 29)
     * * DLNA_ORG_FLAG_PLAY_CONTAINER            = (1 << 28)
     * * DLNA_ORG_FLAG_S0_INCREASE               = (1 << 27)
     * * DLNA_ORG_FLAG_SN_INCREASE               = (1 << 26)
     * * DLNA_ORG_FLAG_RTSP_PAUSE                = (1 << 25)
     * * DLNA_ORG_FLAG_STREAMING_TRANSFER_MODE   = (1 << 24)
     * * DLNA_ORG_FLAG_INTERACTIVE_TRANSFER_MODE = (1 << 23)
     * * DLNA_ORG_FLAG_BACKGROUND_TRANSFER_MODE  = (1 << 22)
     * * DLNA_ORG_FLAG_CONNECTION_STALL          = (1 << 21)
     * * DLNA_ORG_FLAG_DLNA_V15                  = (1 << 20)
     *
     * Standard combination for music rendering:
     * DLNA_ORG_FLAG_STREAMING_TRANSFER_MODE
     * & DLNA_ORG_FLAG_BACKGROUND_TRANSFER_MODE
     * & DLNA_ORG_FLAG_DLNA_V15
     * = 0x01500000
     *
     * With padding (apply << 96):
     * = 0x01500000000000000000000000000000
     *
     * See: https://stackoverflow.com/a/30807975
     */
    ['DLNA.ORG_FLAGS']: '01500000000000000000000000000000',
    /**
     * 2-bit binary flag.
     *
     * Meaning of the bits:
     * * DLNA_ORG_OP_RANGE = (1 << 0) => range supported
     * * DLNA_ORG_OP_TIME  = (1 << 1) => time seek supported
     *
     * Standard combination for music rendering:
     * DLNA_ORG_OP_RANGE = 0b01
     *
     * See: https://github.com/da2ce7/libdlna/blob/7f747b51e3860ab6b51ea9ea9dfdb85b9b1a3ed7/include/dlna/dlna.h#L71-L81
     */
    ['DLNA.ORG_OP']: '01',
} as const;

function makeAudioDlnaFeatures(contentType: string) {
    const dlnaProfile = DLNA_PROFILE_MAP[contentType];
    if (!dlnaProfile) return {};

    return { ['DLNA.ORG_PN']: dlnaProfile, ...STANDARD_AUDIO_DLNA_FEATURES };
}

function makeImageDlnaFeatures({
    contentType,
    size,
}: {
    contentType: string;
    size: number;
}): Record<string, string> {
    const dlnaProfile = DLNA_PROFILE_MAP[contentType];
    if (!dlnaProfile) return {};

    let suffix: string;
    if (size > 4096) return {};
    else if (size > 768) suffix = 'LRG';
    else if (size > 480) suffix = 'MED';
    else if (size > 160) suffix = 'SM';
    else if (size >= 0) suffix = 'TN';
    else return {};

    return { ['DLNA.ORG_PN']: `${dlnaProfile}_${suffix}` };
}

function serializeDlnaFeatures(features: Record<string, string>) {
    return Object.entries(features)
        .map(([key, value]) => `${key}=${value}`)
        .join(';');
}
