// Little sounds made on the fly (no files): join sounds in Group Play and the optional startup jingle.
export const SOUNDS = ['none', 'chime', 'pop', 'boing', 'airhorn', 'lemon'] as const;

export type SoundName = (typeof SOUNDS)[number];

let audio: AudioContext | null = null;

const tone = (
    ctx: AudioContext,
    type: OscillatorType,
    from: number,
    to: number,
    start: number,
    length: number,
    volume = 0.15,
) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(from, ctx.currentTime + start);
    osc.frequency.exponentialRampToValueAtTime(to, ctx.currentTime + start + length);
    gain.gain.setValueAtTime(volume, ctx.currentTime + start);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + length);
    osc.connect(gain).connect(ctx.destination);
    osc.start(ctx.currentTime + start);
    osc.stop(ctx.currentTime + start + length + 0.05);
};

// a burst of filtered noise (crowd, drum, scratch)
const noise = (ctx: AudioContext, length: number, volume: number, cutoff: number, start = 0) => {
    const frames = Math.floor(ctx.sampleRate * length);
    const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = cutoff;
    const gain = ctx.createGain();
    gain.gain.value = volume;
    src.connect(filter).connect(gain).connect(ctx.destination);
    src.start(ctx.currentTime + start);
};

// the Group Play soundboard: [sound, emoji on its button]
export const SOUNDBOARD: Array<[string, string]> = [
    ['airhorn', '\u{1F4EF}'],
    ['rewind', '⏪'],
    ['cheer', '\u{1F64C}'],
    ['applause', '\u{1F44F}'],
    ['drumroll', '\u{1F941}'],
    ['laugh', '\u{1F602}'],
    ['boo', '\u{1F44E}'],
    ['scratch', '\u{1F4BF}'],
];

// Browsers keep sound off until you click somewhere: the soundboard and join sounds others set off
// used to play into a muted context. The first click anywhere switches it on for good.
if (typeof window !== 'undefined') {
    const unlock = () => {
        audio = audio || new AudioContext();
        audio.resume().catch(() => undefined);
        window.removeEventListener('pointerdown', unlock);
    };
    window.addEventListener('pointerdown', unlock);
}

// the Group Play soundboard's own sounds ("c:<id>") are clips kept in Hermes Music
let soundBase = '';
export const setSoundBase = (url: string) => {
    soundBase = url;
};

export const playSound = (name?: string) => {
    if (!name || name === 'none') return;
    if (name.startsWith('c:')) {
        if (!soundBase) return;
        const clip = new Audio(`${soundBase}/api/sounds/${encodeURIComponent(name.slice(2))}`);
        clip.volume = 0.8;
        clip.play().catch(() => undefined);
        return;
    }
    try {
        audio = audio || new AudioContext();
        const ctx = audio;
        if (ctx.state === 'suspended') ctx.resume().catch(() => undefined);
        if (name === 'chime') {
            tone(ctx, 'sine', 880, 880, 0, 0.25);
            tone(ctx, 'sine', 1320, 1320, 0.12, 0.35);
        } else if (name === 'pop') {
            tone(ctx, 'sine', 600, 120, 0, 0.12, 0.25);
        } else if (name === 'boing') {
            tone(ctx, 'triangle', 180, 720, 0, 0.35, 0.2);
        } else if (name === 'airhorn') {
            for (const f of [440, 554, 659]) tone(ctx, 'sawtooth', f, f * 0.98, 0, 0.6, 0.06);
        } else if (name === 'lemon') {
            [523, 659, 784, 1046].forEach((f, i) =>
                tone(ctx, 'square', f, f, i * 0.09, 0.15, 0.05),
            );
        } else if (name === 'rewind') {
            tone(ctx, 'sawtooth', 300, 1400, 0, 0.5, 0.06);
            tone(ctx, 'sawtooth', 1400, 200, 0.5, 0.3, 0.06);
        } else if (name === 'cheer') {
            noise(ctx, 1.4, 0.18, 1400);
            tone(ctx, 'triangle', 600, 900, 0.1, 0.8, 0.05);
        } else if (name === 'applause') {
            for (let i = 0; i < 30; i++)
                noise(ctx, 0.04, 0.1, 3500, i * 0.06 + Math.random() * 0.03);
        } else if (name === 'drumroll') {
            for (let i = 0; i < 24; i++) noise(ctx, 0.05, 0.12, 600, i * 0.045);
            noise(ctx, 0.5, 0.25, 4000, 1.1);
        } else if (name === 'boo') {
            tone(ctx, 'sawtooth', 220, 150, 0, 1, 0.08);
            tone(ctx, 'sawtooth', 165, 110, 0, 1, 0.06);
        } else if (name === 'laugh') {
            for (let i = 0; i < 5; i++)
                tone(ctx, 'triangle', 420 - i * 20, 360 - i * 20, i * 0.16, 0.12, 0.12);
        } else if (name === 'scratch') {
            tone(ctx, 'sawtooth', 120, 700, 0, 0.12, 0.1);
            tone(ctx, 'sawtooth', 700, 90, 0.12, 0.16, 0.1);
            noise(ctx, 0.3, 0.08, 2000);
        }
    } catch {
        // no audio device: stay quiet
    }
};
