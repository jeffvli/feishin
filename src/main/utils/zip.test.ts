import { crc32, inflateRawSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';

import { createZipBuffer, ZipEntry } from '/@/main/utils/zip';

// Minimal reader: follow the end record to the central directory, then read each local entry
const readZip = (zip: Buffer) => {
    const end = zip.length - 22;
    expect(zip.readUInt32LE(end)).toBe(0x06054b50);

    const count = zip.readUInt16LE(end + 10);
    let central = zip.readUInt32LE(end + 16);
    const entries: Array<{ crc: number; data: Buffer; name: string }> = [];

    for (let i = 0; i < count; i++) {
        expect(zip.readUInt32LE(central)).toBe(0x02014b50);
        const crc = zip.readUInt32LE(central + 16);
        const compressedSize = zip.readUInt32LE(central + 20);
        const size = zip.readUInt32LE(central + 24);
        const nameLength = zip.readUInt16LE(central + 28);
        const localOffset = zip.readUInt32LE(central + 42);
        const name = zip.toString('utf8', central + 46, central + 46 + nameLength);

        expect(zip.readUInt32LE(localOffset)).toBe(0x04034b50);
        expect(zip.readUInt32LE(localOffset + 14)).toBe(crc);
        const dataStart = localOffset + 30 + zip.readUInt16LE(localOffset + 26);
        const data = inflateRawSync(zip.subarray(dataStart, dataStart + compressedSize));
        expect(data.length).toBe(size);

        entries.push({ crc, data, name });
        central += 46 + nameLength;
    }

    return entries;
};

describe('createZipBuffer', () => {
    it('writes entries that read back with matching content and checksums', () => {
        const input: ZipEntry[] = [
            { data: Buffer.from('{\n  "level": "info"\n}\n'), name: 'diagnostics.json' },
            { data: Buffer.from('häämarssi ♪ 夜に駆ける\n'.repeat(200)), name: 'logs/main.log' },
            { data: Buffer.alloc(0), name: 'empty.txt' },
        ];

        const entries = readZip(createZipBuffer(input));

        expect(entries.map((e) => e.name)).toEqual(input.map((e) => e.name));
        entries.forEach((entry, i) => {
            expect(entry.data.equals(input[i].data)).toBe(true);
            expect(entry.crc).toBe(crc32(input[i].data));
        });
    });

    it('compresses repetitive content', () => {
        const data = Buffer.from('log line\n'.repeat(1000));
        expect(createZipBuffer([{ data, name: 'a.log' }]).length).toBeLessThan(data.length / 10);
    });

    it('writes a valid empty archive', () => {
        const zip = createZipBuffer([]);
        expect(zip.length).toBe(22);
        expect(readZip(zip)).toEqual([]);
    });
});
