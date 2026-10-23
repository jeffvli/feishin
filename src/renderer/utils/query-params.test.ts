import { describe, expect, it } from 'vitest';

import {
    getFilterQueryStringFromSearchParams,
    parseArrayParam,
    parseBooleanParam,
    parseCustomFiltersParam,
    parseIntParam,
    parseJsonParam,
    parseStringParam,
    setJsonSearchParam,
    setMultipleSearchParams,
    setSearchParam,
} from '/@/renderer/utils/query-params';

const params = (query: string) => new URLSearchParams(query);

describe('parsing list filters from the URL', () => {
    const search = params(
        'genreIds=a&genreIds=b&favorite=true&compilation=false&minYear=1990&maxYear=x&term=rock&_custom=%7B%22mood%22%3A%22happy%22%7D&bad=%7B',
    );

    it('reads arrays, booleans, integers and strings', () => {
        expect(parseArrayParam(search, 'genreIds')).toEqual(['a', 'b']);
        expect(parseBooleanParam(search, 'favorite')).toBe(true);
        expect(parseBooleanParam(search, 'compilation')).toBe(false);
        expect(parseIntParam(search, 'minYear')).toBe(1990);
        expect(parseStringParam(search, 'term')).toBe('rock');
    });

    it('treats missing or invalid values as unset', () => {
        expect(parseArrayParam(search, 'artistIds')).toBeUndefined();
        expect(parseBooleanParam(search, 'missing')).toBeUndefined();
        expect(parseIntParam(search, 'maxYear')).toBeUndefined();
        expect(parseStringParam(search, 'missing')).toBeUndefined();
        expect(parseJsonParam(search, 'bad')).toBeUndefined();
    });

    it('reads custom filters only when they are an object', () => {
        expect(parseCustomFiltersParam(search, '_custom')).toEqual({ mood: 'happy' });
        expect(parseCustomFiltersParam(params('_custom=%5B1%5D'), '_custom')).toBeUndefined();
        expect(parseCustomFiltersParam(search, 'missing')).toBeUndefined();
    });
});

describe('writing list filters to the URL', () => {
    it('sets, replaces and removes single values without mutating the input', () => {
        const original = params('genreIds=a&term=old');

        expect(setSearchParam(original, 'genreIds', ['b', 'c']).getAll('genreIds')).toEqual([
            'b',
            'c',
        ]);
        expect(setSearchParam(original, 'favorite', true).toString()).toBe(
            'genreIds=a&term=old&favorite=true',
        );
        expect(setSearchParam(original, 'term', undefined).toString()).toBe('genreIds=a');
        expect(original.toString()).toBe('genreIds=a&term=old');
    });

    it('stores JSON values and removes them when cleared', () => {
        const withJson = setJsonSearchParam(params(''), '_custom', { mood: 'happy' });
        expect(parseJsonParam(withJson, '_custom')).toEqual({ mood: 'happy' });
        expect(setJsonSearchParam(withJson, '_custom', null).has('_custom')).toBe(false);
    });

    it('sets several values at once, encoding only the JSON keys as JSON', () => {
        const result = setMultipleSearchParams(
            params('term=old&minYear=1990'),
            {
                _custom: { mood: 'happy' },
                genreIds: ['a', 'b'],
                minYear: null,
                term: 'new',
            },
            new Set(['_custom']),
        );

        expect(result.get('term')).toBe('new');
        expect(result.getAll('genreIds')).toEqual(['a', 'b']);
        expect(result.has('minYear')).toBe(false);
        expect(parseJsonParam(result, '_custom')).toEqual({ mood: 'happy' });
    });

    it('drops a JSON key whose value is not an object', () => {
        const result = setMultipleSearchParams(
            params('_custom=%7B%7D'),
            { _custom: ['a'] },
            new Set(['_custom']),
        );
        expect(result.has('_custom')).toBe(false);
    });
});

describe('getFilterQueryStringFromSearchParams', () => {
    it('drops pagination and merges custom filters', () => {
        expect(
            getFilterQueryStringFromSearchParams(
                params('currentPage=3&scrollOffset=200&term=rock&genreIds=old'),
                { _custom: { mood: 'happy' }, favorite: true, genreIds: ['a', 'b'] },
            ),
        ).toBe(
            'term=rock&_custom=%7B%22mood%22%3A%22happy%22%7D&favorite=true&genreIds=a&genreIds=b',
        );
    });
});
