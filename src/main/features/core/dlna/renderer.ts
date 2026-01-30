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

    public enqueue(url: string, options: any, callback: (error?: any, result?: any) => void) {
        const dlnaFeatures = options.dlnaFeatures || '*';
        const contentType = options.contentType || 'video/mpeg'; // Default to something generic
        const protocolInfo = 'http-get:*:' + contentType + ':' + dlnaFeatures;

        const metadata = options.metadata || {};
        metadata.url = url;
        metadata.protocolInfo = protocolInfo;

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
                    if (err.code !== 'ENOACTION') {
                        return callback(err);
                    }

                    // If PrepareForConnection is not implemented, we keep the default (0) InstanceID
                } else {
                    self.instanceId = result.AVTransportID;
                }

                const params = {
                    InstanceID: self.instanceId,
                    NextURI: url,
                    NextURIMetaData: buildMetadata(metadata),
                };

                self.callAction('AVTransport', 'SetNextAVTransportURI', params, function (err) {
                    if (err) return callback(err);
                    callback();
                });
            },
        );
    }

    public getMute(callback?: (error?: any, result?: any) => void) {
        const params = {
            Channel: 'Master',
            InstanceID: this.instanceId,
        };
        this.callAction('RenderingControl', 'GetMute', params, callback || (() => {}));
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

    const OBJECT_CLASSES = {
        audio: 'object.item.audioItem.musicTrack',
        image: 'object.item.imageItem.photo',
        video: 'object.item.videoItem.movie',
    };

    if (metadata.type) {
        const klass = et.SubElement(item, 'upnp:class');
        klass.text = OBJECT_CLASSES[metadata.type];
    }

    if (metadata.title) {
        const title = et.SubElement(item, 'dc:title');
        title.text = metadata.title;
    }

    if (metadata.creator) {
        const creator = et.SubElement(item, 'dc:creator');
        creator.text = metadata.creator;
    }

    if (metadata.url && metadata.protocolInfo) {
        const res = et.SubElement(item, 'res');
        res.set('protocolInfo', metadata.protocolInfo);
        res.text = metadata.url;
    }

    if (metadata.subtitleUrl) {
        const captionInfo = et.SubElement(item, 'sec:CaptionInfo');
        captionInfo.set('sec:type', 'srt');
        captionInfo.text = metadata.subtitleUrl;

        const captionInfoEx = et.SubElement(item, 'sec:CaptionInfoEx');
        captionInfoEx.set('sec:type', 'srt');
        captionInfoEx.text = metadata.subtitleUrl;

        // Create a second resource for the subtitles
        const res = et.SubElement(item, 'res');
        res.set('protocolInfo', 'http-get:*:text/srt:*');
        res.text = metadata.subtitleUrl;
    }

    const doc = new et.ElementTree(root);
    return doc.write({ xml_declaration: false });
}
