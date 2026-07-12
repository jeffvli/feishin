import { z } from 'zod';

import { sliceUtf8Bytes } from '/@/renderer/utils/utf8-byte-slice';
import { ssType } from '/@/shared/api/subsonic/subsonic-types';
import {
    LyricAgent,
    LyricsKind,
    StructuredLyric,
    SyncedCueLine,
    SyncedWordCue,
    SynchronizedLyricLine,
} from '/@/shared/types/domain-types';

type ApiStructuredLyric = NonNullable<
    z.infer<typeof ssType._response.structuredLyrics>['lyricsList']
>['structuredLyrics'] extends Array<infer T> | undefined
    ? T
    : never;

const getCueTrailingGap = (
    lineValue: string,
    byteEnd: number,
    nextByteStart: number | undefined,
): string => {
    if (nextByteStart === undefined || nextByteStart <= byteEnd + 1) {
        return '';
    }

    return sliceUtf8Bytes(lineValue, byteEnd + 1, nextByteStart - 1);
};

const mapCueWords = (
    apiCueLine: NonNullable<ApiStructuredLyric['cueLine']>[number],
): SyncedWordCue[] => {
    if (!apiCueLine.cue?.length) {
        return [];
    }

    return apiCueLine.cue.map((cue, cueIndex) => {
        const nextCue = apiCueLine.cue?.[cueIndex + 1];
        const wordText = cue.value || sliceUtf8Bytes(apiCueLine.value, cue.byteStart, cue.byteEnd);
        const trailingGap = getCueTrailingGap(apiCueLine.value, cue.byteEnd, nextCue?.byteStart);

        return {
            endMs: cue.end,
            startMs: cue.start,
            text: wordText + trailingGap,
        };
    });
};

const mapCueLine = (
    apiCueLine: NonNullable<ApiStructuredLyric['cueLine']>[number],
): SyncedCueLine => ({
    agentId: apiCueLine.agentId,
    endMs: apiCueLine.end,
    index: apiCueLine.index,
    startMs: apiCueLine.start,
    value: apiCueLine.value,
    words: mapCueWords(apiCueLine),
});

const attachCueLines = (
    lines: SynchronizedLyricLine[],
    apiCueLines: NonNullable<ApiStructuredLyric['cueLine']>,
): SynchronizedLyricLine[] => {
    const cueLinesByIndex = new Map<number, SyncedCueLine[]>();

    for (const apiCueLine of apiCueLines) {
        const mappedCueLine = mapCueLine(apiCueLine);
        const existing = cueLinesByIndex.get(apiCueLine.index) ?? [];
        existing.push(mappedCueLine);
        cueLinesByIndex.set(apiCueLine.index, existing);
    }

    return lines.map((line, index) => {
        const cueLines = cueLinesByIndex.get(index);

        if (!cueLines?.length) {
            return line;
        }

        return {
            ...line,
            cueLines,
        };
    });
};

const mapAgents = (agents: ApiStructuredLyric['agents']): LyricAgent[] | undefined => {
    if (!agents?.length) {
        return undefined;
    }

    return agents.map((agent) => ({
        id: agent.id,
        name: agent.name,
        role: agent.role,
    }));
};

export const mapStructuredLyric = (lyric: ApiStructuredLyric, source: string): StructuredLyric => {
    const baseLyric = {
        artist: lyric.displayArtist || '',
        lang: lyric.lang,
        name: lyric.displayTitle || '',
        offsetMs: lyric.offset ?? 0,
        remote: false,
        source,
    };

    if (lyric.synced) {
        let lines: SynchronizedLyricLine[] = lyric.line.map((line) => ({
            startMs: line.start ?? 0,
            text: line.value,
        }));

        if (lyric.cueLine?.length) {
            lines = attachCueLines(lines, lyric.cueLine);
        }

        return {
            ...baseLyric,
            agents: mapAgents(lyric.agents),
            kind: (lyric.kind ?? 'main') as LyricsKind,
            lyrics: lines,
            synced: true,
        };
    }

    return {
        ...baseLyric,
        lyrics: lyric.line.map((line) => line.value).join('\n'),
        synced: false,
    };
};
