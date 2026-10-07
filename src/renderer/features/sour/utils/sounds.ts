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

export const playSound = (name?: string) => {
    if (!name || name === 'none') return;
    try {
        audio = audio || new AudioContext();
        const ctx = audio;
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
        }
    } catch {
        // no audio device: stay quiet
    }
};
