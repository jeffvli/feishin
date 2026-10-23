import { TFunction } from 'i18next';
import { describe, expect, it } from 'vitest';

import {
    normalizeReleaseTypes,
    normalizeToPrimaryReleaseTypes,
    normalizeToSecondaryReleaseTypes,
} from '/@/renderer/utils/normalize-release-types';

// Return the translation key so the mapping is visible
const t = ((key: string) => key) as TFunction;

describe('normalizeReleaseTypes', () => {
    it('orders primary, then secondary, then unknown types', () => {
        expect(normalizeReleaseTypes(['live', 'bootleg ep', 'Album', 'compilation'], t)).toEqual([
            'releaseType.primary.album',
            'releaseType.secondary.compilation',
            'releaseType.secondary.live',
            'Bootleg Ep',
        ]);
    });

    it('maps MusicBrainz names with spaces and symbols', () => {
        expect(normalizeReleaseTypes(['DJ-mix', 'Mixtape/Street', 'Audio drama'], t)).toEqual([
            'releaseType.secondary.audioDrama',
            'releaseType.secondary.djMix',
            'releaseType.secondary.mixtape',
        ]);
    });
});

describe('normalizeToPrimaryReleaseTypes', () => {
    it('keeps only primary types', () => {
        expect(normalizeToPrimaryReleaseTypes(['EP', 'live'], t)).toEqual([
            'releaseType.primary.ep',
        ]);
    });

    it('falls back to other when there is no primary type', () => {
        expect(normalizeToPrimaryReleaseTypes(['live'], t)).toEqual(['releaseType.primary.other']);
        expect(normalizeToPrimaryReleaseTypes([], t)).toEqual(['releaseType.primary.other']);
    });
});

describe('normalizeToSecondaryReleaseTypes', () => {
    it('keeps only secondary types, sorted', () => {
        expect(normalizeToSecondaryReleaseTypes(['remix', 'single', 'Live'], t)).toEqual([
            'releaseType.secondary.live',
            'releaseType.secondary.remix',
        ]);
    });
});
