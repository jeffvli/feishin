import { useEffect } from 'react';

import { useWebAudio } from '/@/renderer/features/player/hooks/use-webaudio';
import { getVisualizerAudioNodes } from '/@/renderer/features/player/utils/get-visualizer-audio-nodes';
import { usePlaybackType } from '/@/renderer/store';
import { usePlayerStoreBase } from '/@/renderer/store/player.store';
import { PlayerStatus } from '/@/shared/types/types';

export const BINS = 48;

// What the visualizers draw from, refreshed every frame: 48 frequency bands (0-1, bass first), the
// kick (bass punch, 0-1), overall energy and whether a beat just landed. When the player's audio
// can be read (web player, or the Feishin visualizer capture) the numbers are real; otherwise they
// follow the song's tempo so the visualizers still move with the music.
export interface Levels {
    beat: boolean;
    bins: Float32Array;
    energy: number;
    kick: number;
    real: boolean;
}

export const makeLevels = (): Levels => ({
    beat: false,
    bins: new Float32Array(BINS),
    energy: 0,
    kick: 0,
    real: false,
});

let analyser: AnalyserNode | null = null;
let sources: AudioNode[] = [];
let users = 0;
let raw: null | Uint8Array<ArrayBuffer> = null;
let kickAverage = 0.2;
let lastBeat = 0;
let lastBeatIndex = -1;

const detach = () => {
    for (const node of sources) {
        try {
            node.disconnect(analyser as AnalyserNode);
        } catch {
            // already gone
        }
    }
    sources = [];
    analyser = null;
};

const attach = (context: AudioContext, nodes: AudioNode[]) => {
    if (analyser && analyser.context === context && sources.length === nodes.length) {
        if (nodes.every((n, i) => sources[i] === n)) return;
    }
    detach();
    if (!nodes.length) return;
    try {
        analyser = context.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.72;
        for (const node of nodes) node.connect(analyser);
        sources = nodes;
        raw = new Uint8Array(new ArrayBuffer(analyser.frequencyBinCount));
    } catch {
        detach();
    }
};

// Keeps the shared analyser connected while at least one visualizer is on screen.
export const useLevelSource = () => {
    const { webAudio } = useWebAudio();
    const playbackType = usePlaybackType();
    useEffect(() => {
        users++;
        const nodes = getVisualizerAudioNodes(webAudio, playbackType);
        if (webAudio?.context && nodes.length) attach(webAudio.context, nodes);
        return () => {
            users--;
            if (users <= 0) {
                users = 0;
                detach();
            }
        };
    }, [playbackType, webAudio]);
};

const playing = () => usePlayerStoreBase.getState().player.status === PlayerStatus.PLAYING;

// fills `levels` for this moment (`now` in ms)
export const readLevels = (levels: Levels, now: number) => {
    const bins = levels.bins;
    const isPlaying = playing();
    levels.beat = false;
    if (analyser && raw) {
        analyser.getByteFrequencyData(raw);
        const usable = Math.floor(raw.length * 0.72);
        for (let i = 0; i < BINS; i++) {
            // more room for the bass end: bands get wider towards the treble
            const from = Math.floor(Math.pow(i / BINS, 1.6) * usable);
            const to = Math.max(from + 1, Math.floor(Math.pow((i + 1) / BINS, 1.6) * usable));
            let peak = 0;
            for (let j = from; j < to; j++) peak = Math.max(peak, raw[j]);
            const v = peak / 255;
            bins[i] += (v - bins[i]) * 0.5;
        }
        levels.real = true;
    } else {
        const bpm = usePlayerStoreBase.getState().getCurrentSong()?.bpm || 112;
        const t = now / 1000;
        const beats = (t * bpm) / 60;
        const phase = beats % 1;
        const kick = isPlaying ? Math.exp(-phase * 6) : 0;
        for (let i = 0; i < BINS; i++) {
            const f = i / BINS;
            const v = isPlaying
                ? (1 - f) * 0.55 * kick +
                  0.25 * Math.abs(Math.sin(t * 3 + i * 0.5)) * (1 - f * 0.5) +
                  0.15 * Math.abs(Math.sin(t * 7.3 + i * 1.7)) +
                  Math.random() * 0.05
                : 0;
            bins[i] += (v - bins[i]) * 0.3;
        }
        const index = Math.floor(beats);
        if (isPlaying && index !== lastBeatIndex) {
            lastBeatIndex = index;
            levels.beat = true;
        }
        levels.real = false;
    }
    let sum = 0;
    for (let i = 0; i < BINS; i++) sum += bins[i];
    levels.energy = sum / BINS;
    const kick = (bins[0] + bins[1] + bins[2] + bins[3]) / 4;
    levels.kick = kick;
    if (levels.real) {
        kickAverage = kickAverage * 0.96 + kick * 0.04;
        if (kick > 0.3 && kick > kickAverage * 1.35 && now - lastBeat > 260) {
            lastBeat = now;
            levels.beat = true;
        }
    }
    return levels;
};
