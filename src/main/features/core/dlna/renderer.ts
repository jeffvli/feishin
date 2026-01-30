import UpnpMediaRendererClient from 'upnp-mediarenderer-client';
import et from 'elementtree';

export class MediaRendererClient extends UpnpMediaRendererClient {
    constructor(url: string) {
        super(url);

        const self = this;
        this.on('status', (newStatus) => {
            if (newStatus.hasOwnProperty('AVTransportURI'))
                self.emit('changedTrack', newStatus.AVTransportURI);
        });
    }

    public play(opts?: { speed?: number }, callback?: (error?: any, result?: any) => void) {
        var params = {
            InstanceID: this.instanceId,
            Speed: opts?.speed || 1,
        };
        this.callAction('AVTransport', 'Play', params, callback || (() => {}));
    }

    public getMute(callback?: (error?: any, result?: any) => void) {
        var params = {
            InstanceID: this.instanceId,
            Channel: 'Master',
        };
        this.callAction('RenderingControl', 'GetMute', params, callback || (() => {}));
    }

    public setMute(isMuted: boolean, callback?: (error?: any, result?: any) => void) {
        var params = {
            InstanceID: this.instanceId,
            Channel: 'Master',
            DesiredMute: isMuted ? 1 : 0,
        };
        this.callAction('RenderingControl', 'SetMute', params, callback || (() => {}));
    }

    public enqueue(url: string, options: any, callback: (error?: any, result?: any) => void) {
        var self = this;

        var dlnaFeatures = options.dlnaFeatures || '*';
        var contentType = options.contentType || 'video/mpeg'; // Default to something generic
        var protocolInfo = 'http-get:*:' + contentType + ':' + dlnaFeatures;

        var metadata = options.metadata || {};
        metadata.url = url;
        metadata.protocolInfo = protocolInfo;

        var params = {
            RemoteProtocolInfo: protocolInfo,
            PeerConnectionManager: null,
            PeerConnectionID: -1,
            Direction: 'Input',
        };

        this.callAction(
            'ConnectionManager',
            'PrepareForConnection',
            params,
            function (err, result) {
                if (err) {
                    if (err.code !== 'ENOACTION') {
                        return callback(err);
                    }
                    //
                    // If PrepareForConnection is not implemented, we keep the default (0) InstanceID
                    //
                } else {
                    self.instanceId = result.AVTransportID;
                }

                var params = {
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
}
function buildMetadata(metadata: any) {
    var didl = et.Element('DIDL-Lite');
    didl.set('xmlns', 'urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/');
    didl.set('xmlns:dc', 'http://purl.org/dc/elements/1.1/');
    didl.set('xmlns:upnp', 'urn:schemas-upnp-org:metadata-1-0/upnp/');
    didl.set('xmlns:sec', 'http://www.sec.co.kr/');

    var item = et.SubElement(didl, 'item');
    item.set('id', 0);
    item.set('parentID', -1);
    item.set('restricted', false);

    var OBJECT_CLASSES = {
        audio: 'object.item.audioItem.musicTrack',
        video: 'object.item.videoItem.movie',
        image: 'object.item.imageItem.photo',
    };

    if (metadata.type) {
        var klass = et.SubElement(item, 'upnp:class');
        klass.text = OBJECT_CLASSES[metadata.type];
    }

    if (metadata.title) {
        var title = et.SubElement(item, 'dc:title');
        title.text = metadata.title;
    }

    if (metadata.creator) {
        var creator = et.SubElement(item, 'dc:creator');
        creator.text = metadata.creator;
    }

    if (metadata.url && metadata.protocolInfo) {
        var res = et.SubElement(item, 'res');
        res.set('protocolInfo', metadata.protocolInfo);
        res.text = metadata.url;
    }

    if (metadata.subtitlesUrl) {
        var captionInfo = et.SubElement(item, 'sec:CaptionInfo');
        captionInfo.set('sec:type', 'srt');
        captionInfo.text = metadata.subtitlesUrl;

        var captionInfoEx = et.SubElement(item, 'sec:CaptionInfoEx');
        captionInfoEx.set('sec:type', 'srt');
        captionInfoEx.text = metadata.subtitlesUrl;

        // Create a second `res` for the subtitles
        var res = et.SubElement(item, 'res');
        res.set('protocolInfo', 'http-get:*:text/srt:*');
        res.text = metadata.subtitlesUrl;
    }

    var doc = new et.ElementTree(didl);
    var xml = doc.write({ xml_declaration: false });

    return xml;
}
