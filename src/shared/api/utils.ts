import { AxiosHeaders } from 'axios';
import isElectron from 'is-electron';
import semverCoerce from 'semver/functions/coerce';
import semverGte from 'semver/functions/gte';
import { z } from 'zod';

import { ServerListItem } from '/@/shared/types/domain-types';
import { ServerFeature } from '/@/shared/types/features-types';

// Since ts-rest client returns a strict response type, we need to add the headers to the body object
export const resultWithHeaders = <ItemType extends z.ZodTypeAny>(itemSchema: ItemType) => {
    return z.object({
        data: itemSchema,
        headers: z.instanceof(AxiosHeaders),
    });
};

export const resultSubsonicBaseResponse = <ItemType extends z.ZodRawShape>(
    itemSchema: ItemType,
) => {
    return z.object({
        'subsonic-response': z
            .object({
                status: z.string(),
                version: z.string(),
            })
            .extend(itemSchema),
    });
};

export const hasFeature = (server: null | ServerListItem, feature: ServerFeature): boolean => {
    if (!server || !server.features) {
        return false;
    }

    return (server.features[feature]?.length || 0) > 0;
};

export type VersionInfo = ReadonlyArray<
    [string, Partial<Record<ServerFeature, readonly number[]>>]
>;

/**
 * Returns the available server features given the version string.
 * @param versionInfo a list, in DECREASING VERSION order, of the features supported by the server.
 *  The first version match will automatically consider the rest matched.
 * @example
 * ```
 * // The CORRECT way to order
 * const VERSION_INFO: VersionInfo = [
 *   ['0.49.3', { [ServerFeature.SHARING_ALBUM_SONG]: [1] }],
 *   ['0.48.0', { [ServerFeature.PLAYLISTS_SMART]: [1] }],
 * ];
 * // INCORRECT way to order
 * const VERSION_INFO: VersionInfo = [
 *   ['0.48.0', { [ServerFeature.PLAYLISTS_SMART]: [1] }],
 *   ['0.49.3', { [ServerFeature.SHARING_ALBUM_SONG]: [1] }],
 * ];
 *  ```
 * @param version the version string (SemVer)
 * @returns a Record containing the matched features (if any) and their versions
 */
export const getFeatures = (
    versionInfo: VersionInfo,
    version: string,
): Partial<Record<ServerFeature, number[]>> => {
    const cleanVersion = semverCoerce(version);
    const features: Partial<Record<ServerFeature, number[]>> = {};
    let matched = cleanVersion === null;

    for (const [version, supportedFeatures] of versionInfo) {
        if (!matched) {
            matched = semverGte(cleanVersion!, version);
        }

        if (matched) {
            for (const [feature, feat] of Object.entries(supportedFeatures)) {
                if (feature in features) {
                    features[feature].push(...feat);
                } else {
                    features[feature] = [...feat];
                }
            }
        }
    }

    return features;
};

export const getClientType = (): string => {
    if (isElectron()) {
        return 'Desktop Client';
    }
    const agent = navigator.userAgent;
    switch (true) {
        case agent.toLowerCase().indexOf('edge') > -1:
            return 'Microsoft Edge';
        case agent.toLowerCase().indexOf('edg/') > -1:
            return 'Edge Chromium'; // Match also / to avoid matching for the older Edge
        case agent.toLowerCase().indexOf('opr') > -1:
            return 'Opera';
        case agent.toLowerCase().indexOf('chrome') > -1:
            return 'Chrome';
        case agent.toLowerCase().indexOf('trident') > -1:
            return 'Internet Explorer';
        case agent.toLowerCase().indexOf('firefox') > -1:
            return 'Firefox';
        case agent.toLowerCase().indexOf('safari') > -1:
            return 'Safari';
        default:
            return 'PC';
    }
};

export const SEPARATOR_STRING = ' · ';
