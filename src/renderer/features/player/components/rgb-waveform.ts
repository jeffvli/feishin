export const RGB_WAVEFORM_POINTS = 3840;

const LOW_MID_CROSSOVER_HZ = 600;
const MID_HIGH_CROSSOVER_HZ = 4000;
const YIELD_INTERVAL = 131_072;

const createLowPass = (frequency: number, sampleRate: number) => {
    const normalizedFrequency = Math.min(frequency, sampleRate * 0.45);
    const omega = (2 * Math.PI * normalizedFrequency) / sampleRate;
    const alpha = Math.sin(omega) / (2 * Math.SQRT1_2);
    const cos = Math.cos(omega);
    const a0 = 1 + alpha;
    const b0 = (1 - cos) / 2 / a0;
    const b1 = (1 - cos) / a0;
    const b2 = b0;
    const a1 = (-2 * cos) / a0;
    const a2 = (1 - alpha) / a0;
    let input1 = 0;
    let input2 = 0;
    let output1 = 0;
    let output2 = 0;

    return (input: number) => {
        const output = b0 * input + b1 * input1 + b2 * input2 - a1 * output1 - a2 * output2;
        input2 = input1;
        input1 = input;
        output2 = output1;
        output1 = output;
        return output;
    };
};

export interface AudioBufferLike {
    getChannelData: (channel: number) => Float32Array;
    length: number;
    numberOfChannels: number;
    sampleRate: number;
}

export interface RgbWaveformData {
    amplitude: Float32Array;
    high: Float32Array;
    low: Float32Array;
    maxAmplitude: number;
    mid: Float32Array;
}

export async function analyzeRgbWaveform(
    audioBuffer: AudioBufferLike,
    signal?: AbortSignal,
): Promise<RgbWaveformData> {
    const pointCount = Math.min(RGB_WAVEFORM_POINTS, Math.max(1, audioBuffer.length));
    const amplitude = new Float32Array(pointCount);
    const low = new Float32Array(pointCount);
    const mid = new Float32Array(pointCount);
    const high = new Float32Array(pointCount);

    if (!audioBuffer.length || !audioBuffer.numberOfChannels) {
        return { amplitude, high, low, maxAmplitude: 0, mid };
    }

    const channels = Array.from({ length: audioBuffer.numberOfChannels }, (_, channel) =>
        audioBuffer.getChannelData(channel),
    );
    const samplesPerPoint = audioBuffer.length / pointCount;
    const lowPass = createLowPass(LOW_MID_CROSSOVER_HZ, audioBuffer.sampleRate);
    const midHighPass = createLowPass(MID_HIGH_CROSSOVER_HZ, audioBuffer.sampleRate);
    let maxAmplitude = 0;

    for (let index = 0; index < audioBuffer.length; index += 1) {
        if (signal?.aborted) {
            throw new DOMException('Waveform analysis aborted', 'AbortError');
        }

        let sample = 0;
        for (const channel of channels) {
            sample += channel[index] || 0;
        }
        sample /= channels.length;

        const lowSample = lowPass(sample);
        const midHighSample = midHighPass(sample);

        const point = Math.min(pointCount - 1, Math.floor(index / samplesPerPoint));
        const sampleAmplitude = Math.abs(sample);
        amplitude[point] = Math.max(amplitude[point], sampleAmplitude);
        low[point] = Math.max(low[point], Math.abs(lowSample));
        mid[point] = Math.max(mid[point], Math.abs(midHighSample - lowSample));
        high[point] = Math.max(high[point], Math.abs(sample - midHighSample));
        maxAmplitude = Math.max(maxAmplitude, sampleAmplitude);

        if (index > 0 && index % YIELD_INTERVAL === 0) {
            await new Promise<void>((resolve) => setTimeout(resolve, 0));
        }
    }

    return { amplitude, high, low, maxAmplitude, mid };
}
