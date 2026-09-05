/**
 * Reads the mono PCM wav the main process extracts with ffmpeg.
 *
 * Deliberately not `AudioContext.decodeAudioData`: that only exists on the main thread, and the
 * whole point of extracting at the fingerprint's own rate is that the samples can go straight to
 * a worker without anything on the main thread touching them.
 */
export function decodeMonoPcmWav(bytes: Uint8Array): Float32Array {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

    if (view.byteLength < 12 || view.getUint32(0, false) !== 0x52494646) {
        throw new Error('not a RIFF file');
    }

    let bitsPerSample = 16;
    let offset = 12;

    // Chunk order is not fixed and ffmpeg writes a `LIST` chunk of its own, so the chunks are
    // walked rather than assumed to be `fmt ` then `data` at fixed offsets.
    while (offset + 8 <= view.byteLength) {
        const id = view.getUint32(offset, false);
        const size = view.getUint32(offset + 4, true);
        const body = offset + 8;

        if (id === 0x666d7420) {
            bitsPerSample = view.getUint16(body + 14, true);
        } else if (id === 0x64617461) {
            return readSamples(view, body, Math.min(size, view.byteLength - body), bitsPerSample);
        }

        // Chunks are word-aligned, so an odd length is followed by a pad byte.
        offset = body + size + (size % 2);
    }

    throw new Error('wav has no data chunk');
}

function readSamples(
    view: DataView,
    start: number,
    length: number,
    bitsPerSample: number,
): Float32Array {
    if (bitsPerSample === 32) {
        const count = Math.floor(length / 4);
        const samples = new Float32Array(count);
        for (let i = 0; i < count; i += 1) {
            samples[i] = view.getFloat32(start + i * 4, true);
        }
        return samples;
    }

    if (bitsPerSample !== 16) {
        throw new Error(`unsupported wav sample width: ${bitsPerSample}`);
    }

    const count = Math.floor(length / 2);
    const samples = new Float32Array(count);
    for (let i = 0; i < count; i += 1) {
        samples[i] = view.getInt16(start + i * 2, true) / 32768;
    }
    return samples;
}
