import { describe, expect, it } from 'vitest';

import { orderSearchResults } from '/@/main/features/core/lyrics/shared';
import { InternetProviderLyricSearchResponse, LyricSource } from '/@/shared/types/domain-types';

const result = (
    id: string,
    name: string,
    artist: string,
    isSync: boolean | null = false,
): InternetProviderLyricSearchResponse => ({
    artist,
    id,
    isSync,
    name,
    source: LyricSource.LRCLIB,
});

const ids = (items: { id: string }[]) => items.map((item) => item.id);

describe('orderSearchResults', () => {
    const results = [
        result('wrong-artist', 'Paranoid Android', 'Some Cover Band'),
        result('match', 'Paranoid Android', 'Radiohead'),
        result('wrong-song', 'Karma Police', 'Radiohead'),
    ];

    it('keeps only results matching both artist and title', () => {
        expect(
            ids(
                orderSearchResults({
                    params: { artist: 'Radiohead', name: 'Paranoid Android' },
                    results,
                }),
            ),
        ).toEqual(['match']);
    });

    it('tolerates small differences in the title', () => {
        expect(
            ids(
                orderSearchResults({
                    params: { artist: 'radiohead', name: 'Paranoid Androids' },
                    results,
                }),
            ),
        ).toEqual(['match']);
    });

    it('prefers synced lyrics over a closer unsynced match', () => {
        const ordered = orderSearchResults({
            params: { artist: 'Radiohead', name: 'Paranoid Android' },
            results: [
                result('plain', 'Paranoid Android', 'Radiohead', false),
                result('synced', 'Paranoid Android (Remastered)', 'Radiohead', true),
            ],
        });
        expect(ids(ordered)).toEqual(['synced', 'plain']);
    });

    it('orders by match score within the same sync type', () => {
        const ordered = orderSearchResults({
            params: { artist: 'Radiohead', name: 'Creep' },
            results: [
                result('live', 'Creep (Live at Glastonbury 1997)', 'Radiohead'),
                result('exact', 'Creep', 'Radiohead'),
            ],
        });
        expect(ids(ordered)[0]).toBe('exact');
        expect(ordered[0].score).toBeLessThanOrEqual(ordered[1]?.score ?? 1);
    });

    it('ranks by title alone when the artist is unknown', () => {
        expect(ids(orderSearchResults({ params: { name: 'Karma Police' }, results }))[0]).toBe(
            'wrong-song',
        );
    });

    it('returns nothing without matches', () => {
        expect(
            orderSearchResults({ params: { artist: 'Metallica', name: 'One' }, results }),
        ).toEqual([]);
    });
});
