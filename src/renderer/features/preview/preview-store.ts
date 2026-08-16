import { createWithEqualityFn } from 'zustand/traditional';

import { getActivePlayer } from '/@/renderer/features/player/audio-player/ref/active-player';
import { resolveDeezerPreview } from '/@/renderer/features/preview/providers/deezer';
import { PreviewQuery, resolveItunesPreview } from '/@/renderer/features/preview/providers/itunes';
import { logger } from '/@/renderer/utils/logger';

interface PreviewStore {
    actions: {
        /** Stop any preview, restore the music's volume and clear state. */
        stop: () => void;
        /** Start previewing `id`, or stop it if it is already the one playing. */
        toggle: (id: string, query: PreviewQuery) => Promise<void>;
    };
    /** The item currently sounding, or null. */
    playingId: null | string;
    /** The item whose preview URL is being looked up. Distinct from playing. */
    resolvingId: null | string;
}

/**
 * One element for the whole app.
 *
 * A player per card would leave every previously-hovered card holding a decoded stream, and
 * `preload="none"` means nothing is fetched until something is actually played.
 */
let audio: HTMLAudioElement | null = null;

/** In-flight resolution, aborted when another preview starts or the current one is stopped. */
let controller: AbortController | null = null;

/** Whether we have attenuated the music and therefore owe it a restore. */
let isDucked = false;

/** Resolved preview URLs for this session. iTunes rate limits at roughly 20 requests/minute. */
const resolved = new Map<string, null | string>();

function duck(): void {
    if (isDucked) {
        return;
    }

    isDucked = true;
    getActivePlayer()?.setDuckLevel(0);
}

function getAudio(): HTMLAudioElement {
    if (!audio) {
        audio = new Audio();
        audio.preload = 'none';
        // Deliberately no crossOrigin: media element loads are exempt from CORS, but setting
        // this would opt into it and Apple's audio host would then have to allow the origin.
        audio.addEventListener('ended', () => usePreviewStore.getState().actions.stop());
        audio.addEventListener('error', () => usePreviewStore.getState().actions.stop());
    }

    return audio;
}

async function resolvePreviewUrl(
    id: string,
    query: PreviewQuery,
    signal: AbortSignal,
): Promise<null | string> {
    if (resolved.has(id)) {
        return resolved.get(id) ?? null;
    }

    let url: null | string = null;

    try {
        url = await resolveItunesPreview(query, signal);
    } catch (error) {
        if ((error as Error).name === 'AbortError') {
            throw error;
        }
        logger.warn(`Preview lookup failed for ${query.artistName} - ${query.title}`);
    }

    // Desktop only, and only as a second chance: Deezer's API cannot be called from the
    // renderer because it sends no `Access-Control-Allow-Origin`, so this goes over IPC and
    // is simply unavailable in the web build.
    if (!url) {
        url = await resolveDeezerPreview(query);
    }

    resolved.set(id, url);

    return url;
}

function unduck(): void {
    if (!isDucked) {
        return;
    }

    isDucked = false;
    getActivePlayer()?.setDuckLevel(1);
}

export const usePreviewStore = createWithEqualityFn<PreviewStore>((set, get) => ({
    actions: {
        stop: () => {
            controller?.abort();
            controller = null;

            if (audio) {
                audio.pause();
                audio.removeAttribute('src');
            }

            unduck();
            set({ playingId: null, resolvingId: null });
        },
        toggle: async (id, query) => {
            const { playingId, resolvingId } = get();

            // Clicking the item that is already sounding stops it.
            if (playingId === id || resolvingId === id) {
                get().actions.stop();
                return;
            }

            get().actions.stop();

            controller = new AbortController();
            const signal = controller.signal;
            set({ resolvingId: id });

            let url: null | string;

            try {
                url = await resolvePreviewUrl(id, query, signal);
            } catch {
                // Aborted because another preview started, or the component unmounted.
                return;
            }

            // The resolution is a network round trip, so by the time it returns the user may
            // have started a different preview. Without this the late response would stomp it.
            if (signal.aborted || get().resolvingId !== id) {
                return;
            }

            if (!url) {
                logger.debug(`No preview available for ${query.artistName} - ${query.title}`);
                set({ resolvingId: null });
                return;
            }

            duck();

            const element = getAudio();
            element.src = url;

            try {
                await element.play();
                set({ playingId: id, resolvingId: null });
            } catch {
                // Autoplay policy, or a dead URL. Either way, put everything back.
                get().actions.stop();
            }
        },
    },
    playingId: null,
    resolvingId: null,
}));

export const usePreviewActions = () => usePreviewStore((state) => state.actions);

export const usePreviewPlayingId = () => usePreviewStore((state) => state.playingId);

export const usePreviewResolvingId = () => usePreviewStore((state) => state.resolvingId);
