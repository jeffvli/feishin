import { describe, expect, it } from 'vitest';

import {
    convertNDQueryToQueryGroup,
    convertQueryGroupToNDQuery,
    playlistSongsToAlbums,
} from '/@/renderer/features/playlists/utils';
import { Song } from '/@/shared/types/domain-types';
import { QueryBuilderGroup } from '/@/shared/types/types';

const rule = (field: string, operator: string, value: unknown) => ({
    field,
    operator,
    uniqueId: `${field}-${operator}`,
    value,
});

const group = (
    type: 'all' | 'any',
    rules: ReturnType<typeof rule>[],
    groups: QueryBuilderGroup[] = [],
): QueryBuilderGroup => ({ group: groups, rules, type, uniqueId: type });

// uniqueIds are random, so compare the structure only
const stripIds = (g: QueryBuilderGroup): unknown => ({
    group: g.group.map(stripIds),
    rules: g.rules.map(({ field, operator, value }) => ({ field, operator, value })),
    type: g.type,
});

describe('convertQueryGroupToNDQuery', () => {
    it('converts rules to Navidrome criteria', () => {
        expect(
            convertQueryGroupToNDQuery(
                group('all', [rule('genre', 'contains', 'rock'), rule('year', 'gt', 1990)]),
            ),
        ).toEqual({ all: [{ contains: { genre: 'rock' } }, { gt: { year: 1990 } }] });
    });

    it('converts boolean fields from the string the UI stores', () => {
        expect(
            convertQueryGroupToNDQuery(
                group('all', [rule('loved', 'is', 'true'), rule('compilation', 'is', 'false')]),
            ),
        ).toEqual({ all: [{ is: { loved: true } }, { is: { compilation: false } }] });
    });

    it('maps date picker operators to the API operators', () => {
        expect(
            convertQueryGroupToNDQuery(
                group('any', [
                    rule('dateadded', 'afterDate', '2024-01-01'),
                    rule('lastplayed', 'inTheRangeDate', ['2024-01-01', '2024-06-30']),
                ]),
            ),
        ).toEqual({
            any: [
                { after: { dateadded: '2024-01-01' } },
                { inTheRange: { lastplayed: ['2024-01-01', '2024-06-30'] } },
            ],
        });
    });

    it('skips incomplete rules', () => {
        expect(
            convertQueryGroupToNDQuery(
                group('all', [
                    rule('genre', '', 'x'),
                    { uniqueId: 'empty' } as ReturnType<typeof rule>,
                ]),
            ),
        ).toEqual({ all: [] });
    });

    it('nests groups after the rules', () => {
        expect(
            convertQueryGroupToNDQuery(
                group(
                    'all',
                    [rule('genre', 'is', 'Rock')],
                    [group('any', [rule('year', 'lt', 1980), rule('year', 'gt', 2010)])],
                ),
            ),
        ).toEqual({
            all: [
                { is: { genre: 'Rock' } },
                { any: [{ lt: { year: 1980 } }, { gt: { year: 2010 } }] },
            ],
        });
    });
});

describe('convertNDQueryToQueryGroup', () => {
    it('restores rules, nested groups and UI operators', () => {
        const restored = convertNDQueryToQueryGroup({
            all: [
                { is: { loved: true } },
                { before: { dateadded: '2024-01-01' } },
                { before: { year: 2000 } },
                { any: [{ contains: { genre: 'jazz' } }] },
            ],
        });

        expect(stripIds(restored)).toEqual({
            group: [
                {
                    group: [],
                    rules: [{ field: 'genre', operator: 'contains', value: 'jazz' }],
                    type: 'any',
                },
            ],
            rules: [
                { field: 'loved', operator: 'is', value: 'true' },
                // Date-like values use the date picker operator
                { field: 'dateadded', operator: 'beforeDate', value: '2024-01-01' },
                { field: 'year', operator: 'before', value: 2000 },
            ],
            type: 'all',
        });
    });

    it('round-trips a query', () => {
        const query = {
            any: [
                { is: { loved: true } },
                { inTheRange: { lastplayed: ['2024-01-01', '2024-06-30'] } },
                { all: [{ contains: { genre: 'rock' } }, { gt: { rating: 3 } }] },
            ],
        };
        expect(convertQueryGroupToNDQuery(convertNDQueryToQueryGroup(query))).toEqual(query);
    });
});

const song = (id: string, albumId: string, fields: Partial<Song> = {}) =>
    ({
        album: `Album ${albumId}`,
        albumId,
        duration: 1000,
        id,
        lastPlayedAt: null,
        playCount: 1,
        ...fields,
    }) as Song;

describe('playlistSongsToAlbums', () => {
    it('returns no rows for an empty playlist', () => {
        expect(playlistSongsToAlbums([])).toEqual([]);
    });

    it('groups consecutive songs of the same album into one row', () => {
        const rows = playlistSongsToAlbums([
            song('1', 'a', { lastPlayedAt: '2024-01-01' }),
            song('2', 'a', { lastPlayedAt: '2024-03-01', playCount: 4 }),
            song('3', 'b'),
            song('4', 'a'),
        ]);

        expect(rows.map((r) => [r.id, r._playlistSongs?.map((s) => s.id)])).toEqual([
            ['a', ['1', '2']],
            ['b', ['3']],
            // The same album later in the playlist gets its own row
            ['a', ['4']],
        ]);
        expect(rows[0]).toMatchObject({
            duration: 2000,
            lastPlayedAt: '2024-03-01',
            name: 'Album a',
            playCount: 5,
            songCount: 2,
        });
        expect(rows[1].lastPlayedAt).toBeNull();
    });
});
