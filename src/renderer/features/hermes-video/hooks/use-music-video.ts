import { useQuery } from '@tanstack/react-query';

import { useHermesUrl } from '/@/renderer/features/hermes-video/store/hermes-video.store';

export interface MusicVideo {
    channel?: string;
    live?: null | { channel: string; title: string; videoId: string };
    offset?: number; // seconds into the video where the song starts
    pending?: boolean; // Hermes Music is still lining the video up with the song
    title?: string;
    videoId: string;
}

// Asks Hermes Music whether the song has a music video (added there with /video).
// Returns null if not.
export const useMusicVideo = (artist?: string, title?: string) => {
    const url = useHermesUrl();
    return useQuery({
        enabled: Boolean(url && artist && title),
        queryFn: async ({ signal }) => {
            const params = new URLSearchParams({ artist: artist || '', title: title || '' });
            const res = await fetch(`${url}/api/videos/lookup?${params}`, { signal });
            if (res.status === 404) return null;
            if (!res.ok) throw new Error(`Hermes Music returned ${res.status}`);
            const video = (await res.json()) as MusicVideo;
            return /^[\w-]{11}$/.test(video.videoId) ? video : null;
        },
        queryKey: ['hermes-video', url, artist, title],
        // while the timing is still being measured, check back until it's ready
        refetchInterval: (query) => (query.state.data?.pending ? 5000 : false),
        retry: false,
        staleTime: 5 * 60 * 1000,
    });
};
