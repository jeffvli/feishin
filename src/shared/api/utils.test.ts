import { describe, expect, it } from 'vitest';

import { getFeatures, hasFeature, hasFeatureWithVersion, VersionInfo } from '/@/shared/api/utils';
import { ServerListItem } from '/@/shared/types/domain-types';
import { ServerFeature } from '/@/shared/types/features-types';

const versionInfo: VersionInfo = [
    ['0.55.0', { [ServerFeature.LYRICS_MULTIPLE_STRUCTURED]: [1] }],
    ['0.49.3', { [ServerFeature.LYRICS_SINGLE_STRUCTURED]: [1] }],
    ['0.48.0', { [ServerFeature.LYRICS_SINGLE_STRUCTURED]: [2] }],
];

describe('getFeatures', () => {
    it('includes every feature from the first matching version down', () => {
        expect(getFeatures(versionInfo, '0.50.1')).toEqual({
            [ServerFeature.LYRICS_SINGLE_STRUCTURED]: [1, 2],
        });
    });

    it('matches an exact version', () => {
        expect(getFeatures(versionInfo, '0.48.0')).toEqual({
            [ServerFeature.LYRICS_SINGLE_STRUCTURED]: [2],
        });
    });

    it('returns nothing for older servers', () => {
        expect(getFeatures(versionInfo, '0.47.9')).toEqual({});
    });

    it('coerces non-semver version strings', () => {
        expect(getFeatures(versionInfo, '10.10.7.0')).toHaveProperty(
            ServerFeature.LYRICS_MULTIPLE_STRUCTURED,
        );
        expect(getFeatures(versionInfo, '0.55.0 (abc123)')).toHaveProperty(
            ServerFeature.LYRICS_MULTIPLE_STRUCTURED,
        );
    });

    it('enables everything for an unparseable version', () => {
        expect(Object.keys(getFeatures(versionInfo, 'dev'))).toHaveLength(2);
    });
});

describe('hasFeature', () => {
    const server = {
        features: { [ServerFeature.LYRICS_SINGLE_STRUCTURED]: [1, 2] },
    } as unknown as ServerListItem;

    it('checks whether a feature is present', () => {
        expect(hasFeature(server, ServerFeature.LYRICS_SINGLE_STRUCTURED)).toBe(true);
        expect(hasFeature(server, ServerFeature.LYRICS_MULTIPLE_STRUCTURED)).toBe(false);
        expect(hasFeature(null, ServerFeature.LYRICS_SINGLE_STRUCTURED)).toBe(false);
    });

    it('checks a specific feature version', () => {
        expect(hasFeatureWithVersion(server, ServerFeature.LYRICS_SINGLE_STRUCTURED, 2)).toBe(true);
        expect(hasFeatureWithVersion(server, ServerFeature.LYRICS_SINGLE_STRUCTURED, 3)).toBe(
            false,
        );
    });
});
