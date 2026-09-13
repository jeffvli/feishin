import Decoder from 'wavesurfer.js/dist/decoder.js';

import { analyzeRgbWaveform, RgbWaveformData } from './rgb-waveform';

import { getSongUrl } from '/@/renderer/features/player/audio-player/hooks/use-stream-url';
import { TranscodingConfig } from '/@/renderer/store';
import { QueueSong } from '/@/shared/types/domain-types';

const ANALYSIS_SAMPLE_RATE = 12_000;
const MAX_CACHED_WAVEFORMS = 12;

const cachedWaveforms = new Map<string, RgbWaveformData>();
const pendingWaveforms = new Map<string, Promise<RgbWaveformData>>();

const getCacheKey = (song: QueueSong) => song._uniqueId;

const cacheWaveform = (key: string, waveform: RgbWaveformData) => {
    cachedWaveforms.delete(key);
    cachedWaveforms.set(key, waveform);

    if (cachedWaveforms.size > MAX_CACHED_WAVEFORMS) {
        const oldestKey = cachedWaveforms.keys().next().value;
        if (oldestKey) cachedWaveforms.delete(oldestKey);
    }
};

export const getCachedRgbWaveform = (song: QueueSong | undefined) => {
    return song ? cachedWaveforms.get(getCacheKey(song)) : undefined;
};

export const loadRgbWaveform = (
    song: QueueSong,
    transcode: Partial<TranscodingConfig>,
): Promise<RgbWaveformData> => {
    const key = getCacheKey(song);
    const cachedWaveform = cachedWaveforms.get(key);
    if (cachedWaveform) return Promise.resolve(cachedWaveform);

    const pendingWaveform = pendingWaveforms.get(key);
    if (pendingWaveform) return pendingWaveform;

    const task = (async () => {
        const streamUrl = await getSongUrl(song, {
            bitrate: 64,
            enabled: transcode.enabled ?? false,
            format: 'mp3',
        });
        const response = await fetch(streamUrl);
        if (!response.ok) {
            throw new Error(`Waveform request failed with ${response.status}`);
        }

        const audioBuffer = await Decoder.decode(
            await response.arrayBuffer(),
            ANALYSIS_SAMPLE_RATE,
        );
        const waveform = await analyzeRgbWaveform(audioBuffer);
        cacheWaveform(key, waveform);
        return waveform;
    })();

    pendingWaveforms.set(key, task);
    void task.then(
        () => pendingWaveforms.delete(key),
        () => pendingWaveforms.delete(key),
    );
    return task;
};
