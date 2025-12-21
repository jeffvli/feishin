import MediaRendererClient from 'upnp-device-client';

export const playOnSpeaker = (url: string, metadata: string, deviceUrl: string) => {
    const client = new MediaRendererClient(deviceUrl);
    client.load(
        url,
        {
            autoplay: true,
            contentType: 'audio/mpeg',
            metadata: metadata, // This shows the Artist/Title on the speaker's screen
        },
        (err) => {
            if (err) console.error(err);
        },
    );
};
