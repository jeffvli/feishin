import { describe, expect, it } from 'vitest';

import { mapStructuredLyric } from '/@/renderer/api/subsonic/subsonic-structured-lyrics';
import { StructuredLyric, SynchronizedLyricLine } from '/@/shared/types/domain-types';

type ApiLyric = Parameters<typeof mapStructuredLyric>[0];

const apiLyric = (fields: Partial<ApiLyric>): ApiLyric =>
    ({ lang: 'eng', line: [], synced: true, ...fields }) as ApiLyric;

const syncedLines = (lyric: StructuredLyric) =>
    (lyric as { lyrics: SynchronizedLyricLine[] }).lyrics;

describe('mapStructuredLyric', () => {
    it('joins unsynced lines into plain text', () => {
        expect(
            mapStructuredLyric(
                apiLyric({
                    displayArtist: 'Artist',
                    displayTitle: 'Song',
                    line: [{ value: 'first' }, { value: 'second' }],
                    synced: false,
                } as Partial<ApiLyric>),
                'server',
            ),
        ).toEqual({
            artist: 'Artist',
            lang: 'eng',
            lyrics: 'first\nsecond',
            name: 'Song',
            offsetMs: null,
            remote: false,
            source: 'server',
            synced: false,
        });
    });

    it('maps synced lines, defaulting the kind to main', () => {
        const lyric = mapStructuredLyric(
            apiLyric({
                line: [{ start: 1000, value: 'first' }, { value: 'no start' }],
                offset: -250,
            } as Partial<ApiLyric>),
            'server',
        );

        expect(lyric).toMatchObject({ kind: 'main', offsetMs: -250, synced: true });
        expect(syncedLines(lyric)).toEqual([
            { startMs: 1000, text: 'first' },
            { startMs: 0, text: 'no start' },
        ]);
    });

    it('builds word cues from UTF-8 byte offsets, keeping the spaces between words', () => {
        const value = 'häät öisin';
        const lyric = mapStructuredLyric(
            apiLyric({
                cueLine: [
                    {
                        cue: [
                            { byteEnd: 5, byteStart: 0, end: 1500, start: 1000, value: '' },
                            { byteEnd: 12, byteStart: 7, end: 2500, start: 1600, value: '' },
                        ],
                        end: 2500,
                        index: 0,
                        start: 1000,
                        value,
                    },
                ],
                line: [{ start: 1000, value }],
            } as Partial<ApiLyric>),
            'server',
        );

        expect(syncedLines(lyric)[0].cueLines?.[0].words).toEqual([
            { endMs: 1500, startMs: 1000, text: 'häät ' },
            { endMs: 2500, startMs: 1600, text: 'öisin' },
        ]);
    });

    it('prefers the cue text sent by the server', () => {
        const lyric = mapStructuredLyric(
            apiLyric({
                cueLine: [
                    {
                        cue: [{ byteEnd: 4, byteStart: 0, end: 500, start: 0, value: 'HELLO' }],
                        end: 500,
                        index: 0,
                        start: 0,
                        value: 'hello',
                    },
                ],
                line: [{ start: 0, value: 'hello' }],
            } as Partial<ApiLyric>),
            'server',
        );

        expect(syncedLines(lyric)[0].cueLines?.[0].words[0].text).toBe('HELLO');
    });

    it('attaches several cue lines to the same line for duets', () => {
        const cueLine = (agentId: string, value: string) => ({
            agentId,
            end: 2000,
            index: 1,
            start: 1000,
            value,
        });
        const lyric = mapStructuredLyric(
            apiLyric({
                agents: [
                    { id: 'v1', name: 'Singer A', role: 'main' },
                    { id: 'v2', name: 'Singer B', role: 'main' },
                ],
                cueLine: [cueLine('v1', 'la'), cueLine('v2', 'da')],
                line: [
                    { start: 0, value: 'intro' },
                    { start: 1000, value: 'la da' },
                ],
            } as Partial<ApiLyric>),
            'server',
        );

        const [intro, duet] = syncedLines(lyric);
        expect(intro.cueLines).toBeUndefined();
        expect(duet.cueLines?.map((c) => [c.agentId, c.value, c.words])).toEqual([
            ['v1', 'la', []],
            ['v2', 'da', []],
        ]);
        expect(lyric).toMatchObject({
            agents: [
                { id: 'v1', name: 'Singer A', role: 'main' },
                { id: 'v2', name: 'Singer B', role: 'main' },
            ],
        });
    });
});
