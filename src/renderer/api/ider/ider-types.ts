import { z } from 'zod';

const error = z.string();
const track = z.object({
    artist: z.string(),
    end: z.number(),
    mbid: z.string(),
    start: z.number(),
    title: z.string(),
    track_id: z.number(),
});

const trackList = z.array(track);

const trackListParameters = z.object({
    track_id: z.number(),
});

export const iderType = {
    _parameters: {
        trackList: trackListParameters,
    },
    _response: {
        error,
        trackList,
    },
};
