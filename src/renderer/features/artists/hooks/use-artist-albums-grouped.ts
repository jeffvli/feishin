import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { ArtistReleaseTypeItem, useAppStore } from '/@/renderer/store';
import { useArtistReleaseTypeItems } from '/@/renderer/store/settings.store';
import { titleCase } from '/@/renderer/utils';
import { SEPARATOR_STRING } from '/@/shared/api/utils';
import { Album } from '/@/shared/types/domain-types';

const collator = new Intl.Collator();

export type GroupingType = 'all' | 'primary';

const PRIMARY_RELEASE_TYPES = ['album', 'broadcast', 'ep', 'other', 'single'];

export const groupAlbumsByReleaseType = (
    albums: Album[],
    routeId: string,
    groupingType: GroupingType = 'primary',
): Record<string, Album[]> => {
    if (groupingType === 'all') {
        // Group by all individual release types
        const grouped = albums.reduce(
            (acc, album) => {
                // Priority 1: Appears on - artist is not an album artist
                const isAlbumArtist = album.albumArtists?.some((artist) => artist.id === routeId);
                if (!isAlbumArtist) {
                    const appearsOnKey = 'appears-on';
                    if (!acc[appearsOnKey]) {
                        acc[appearsOnKey] = [];
                    }
                    acc[appearsOnKey].push(album);
                    return acc;
                }

                // Priority 2: Compilations
                if (album.isCompilation) {
                    const compilationKey = 'compilation';
                    if (!acc[compilationKey]) {
                        acc[compilationKey] = [];
                    }
                    acc[compilationKey].push(album);
                    return acc;
                }

                // Group by all release types
                const releaseTypes = album.releaseTypes || [];
                if (releaseTypes.length > 0) {
                    // Sort release types: primaries first (alphabetically), then secondaries (alphabetically)
                    const normalizedTypes = releaseTypes.map((type) => type.toLowerCase());
                    const primaryTypes = normalizedTypes
                        .filter((type) => PRIMARY_RELEASE_TYPES.includes(type))
                        .sort();
                    const secondaryTypes = normalizedTypes
                        .filter((type) => !PRIMARY_RELEASE_TYPES.includes(type))
                        .sort();
                    const sortedTypes = [...primaryTypes, ...secondaryTypes];

                    const combinedKey = sortedTypes.join('/');
                    if (!acc[combinedKey]) {
                        acc[combinedKey] = [];
                    }
                    acc[combinedKey].push(album);
                } else {
                    // If no release types, use "album" as fallback
                    const albumKey = 'album';
                    if (!acc[albumKey]) {
                        acc[albumKey] = [];
                    }
                    acc[albumKey].push(album);
                }

                return acc;
            },
            {} as Record<string, Album[]>,
        );

        return grouped;
    }

    // Group by primary release types
    const grouped = albums.reduce(
        (acc, album) => {
            // Priority 1: Appears on - artist is not an album artist
            const isAlbumArtist = album.albumArtists?.some((artist) => artist.id === routeId);
            if (!isAlbumArtist) {
                const appearsOnKey = 'appears-on';
                if (!acc[appearsOnKey]) {
                    acc[appearsOnKey] = [];
                }
                acc[appearsOnKey].push(album);
                return acc;
            }

            const releaseTypes = album.releaseTypes || [];
            const normalizedTypes = releaseTypes.map((type) => type.toLowerCase());

            let matchedType: null | string = null;

            if (normalizedTypes.includes('album')) {
                matchedType = 'album';
            } else if (normalizedTypes.includes('single')) {
                matchedType = 'single';
            } else if (normalizedTypes.includes('ep')) {
                matchedType = 'ep';
            } else if (normalizedTypes.includes('broadcast')) {
                matchedType = 'broadcast';
            } else if (normalizedTypes.includes('other')) {
                matchedType = 'other';
            } else {
                matchedType = 'album';
            }

            const releaseTypeKey = matchedType;
            if (!acc[releaseTypeKey]) {
                acc[releaseTypeKey] = [];
            }
            acc[releaseTypeKey].push(album);
            return acc;
        },
        {} as Record<string, Album[]>,
    );

    return grouped;
};

export const releaseTypeToEnumMap: Record<string, ArtistReleaseTypeItem> = {
    album: ArtistReleaseTypeItem.RELEASE_TYPE_ALBUM,
    'appears-on': ArtistReleaseTypeItem.APPEARS_ON,
    audiobook: ArtistReleaseTypeItem.RELEASE_TYPE_AUDIOBOOK,
    'audio drama': ArtistReleaseTypeItem.RELEASE_TYPE_AUDIO_DRAMA,
    broadcast: ArtistReleaseTypeItem.RELEASE_TYPE_BROADCAST,
    compilation: ArtistReleaseTypeItem.RELEASE_TYPE_COMPILATION,
    demo: ArtistReleaseTypeItem.RELEASE_TYPE_DEMO,
    'dj-mix': ArtistReleaseTypeItem.RELEASE_TYPE_DJ_MIX,
    ep: ArtistReleaseTypeItem.RELEASE_TYPE_EP,
    'field recording': ArtistReleaseTypeItem.RELEASE_TYPE_FIELD_RECORDING,
    interview: ArtistReleaseTypeItem.RELEASE_TYPE_INTERVIEW,
    live: ArtistReleaseTypeItem.RELEASE_TYPE_LIVE,
    'mixtape/street': ArtistReleaseTypeItem.RELEASE_TYPE_MIXTAPE_STREET,
    other: ArtistReleaseTypeItem.RELEASE_TYPE_OTHER,
    remix: ArtistReleaseTypeItem.RELEASE_TYPE_REMIX,
    single: ArtistReleaseTypeItem.RELEASE_TYPE_SINGLE,
    soundtrack: ArtistReleaseTypeItem.RELEASE_TYPE_SOUNDTRACK,
    spokenword: ArtistReleaseTypeItem.RELEASE_TYPE_SPOKENWORD,
};

export const getArtistAlbumsGrouped = (
    albums: Album[],
    routeId: string,
    groupingType: GroupingType,
    artistReleaseTypeItems: { disabled: boolean; id: string }[],
    t: (key: string, options?: any) => string,
) => {
    const albumsByReleaseType = groupAlbumsByReleaseType(albums, routeId, groupingType);

    const enabledReleaseTypeEnums = new Set(
        artistReleaseTypeItems.filter((item) => !item.disabled).map((item) => item.id),
    );

    const priorityMap = new Map<string, number>();
    artistReleaseTypeItems
        .filter((item) => !item.disabled)
        .forEach((item, index) => {
            const releaseTypeKey = Object.keys(releaseTypeToEnumMap).find(
                (key) => releaseTypeToEnumMap[key] === item.id,
            );
            if (releaseTypeKey) {
                priorityMap.set(releaseTypeKey, index);
            }
        });

    const getDisplayNameForType = (releaseType: string): string => {
        switch (releaseType) {
            case 'album':
                return t('releaseType.primary.album', {
                    postProcess: 'sentenceCase',
                });
            case 'appears-on':
                return t('page.albumArtistDetail.appearsOn', {
                    postProcess: 'sentenceCase',
                });
            case 'audiobook':
                return t('releaseType.secondary.audiobook', {
                    postProcess: 'sentenceCase',
                });
            case 'audio drama':
                return t('releaseType.secondary.audioDrama', {
                    postProcess: 'sentenceCase',
                });
            case 'broadcast':
                return t('releaseType.primary.broadcast', {
                    postProcess: 'sentenceCase',
                });
            case 'compilation':
                return t('releaseType.secondary.compilation', {
                    postProcess: 'sentenceCase',
                });
            case 'demo':
                return t('releaseType.secondary.demo', {
                    postProcess: 'sentenceCase',
                });
            case 'dj-mix':
                return t('releaseType.secondary.djMix', {
                    postProcess: 'sentenceCase',
                });
            case 'ep':
                return t('releaseType.primary.ep', {
                    postProcess: 'upperCase',
                });
            case 'field recording':
                return t('releaseType.secondary.fieldRecording', {
                    postProcess: 'sentenceCase',
                });
            case 'interview':
                return t('releaseType.secondary.interview', {
                    postProcess: 'sentenceCase',
                });
            case 'live':
                return t('releaseType.secondary.live', {
                    postProcess: 'sentenceCase',
                });
            case 'mixtape/street':
                return t('releaseType.secondary.mixtape', {
                    postProcess: 'sentenceCase',
                });
            case 'other':
                return t('releaseType.primary.other', {
                    postProcess: 'sentenceCase',
                });
            case 'remix':
                return t('releaseType.secondary.remix', {
                    postProcess: 'sentenceCase',
                });
            case 'single':
                return t('releaseType.primary.single', {
                    postProcess: 'sentenceCase',
                });
            case 'soundtrack':
                return t('releaseType.secondary.soundtrack', {
                    postProcess: 'sentenceCase',
                });
            case 'spokenword':
                return t('releaseType.secondary.spokenWord', {
                    postProcess: 'sentenceCase',
                });
            default:
                return titleCase(releaseType);
        }
    };

    const getPriority = (releaseType: string) => {
        if (releaseType.includes('/')) {
            const types = releaseType.split('/');
            // Check if there's a primary type in the joined types
            const primaryTypes = types.filter((type) => PRIMARY_RELEASE_TYPES.includes(type));

            if (primaryTypes.length > 0) {
                // Use the primary type's priority (first primary if multiple)
                const primaryPriority = priorityMap.get(primaryTypes[0]) ?? 999;
                return primaryPriority;
            } else {
                // Only secondary types - use minimum priority from settings
                const priorities = types
                    .map((type) => priorityMap.get(type) ?? 999)
                    .filter((p) => p !== 999);
                return priorities.length > 0 ? Math.min(...priorities) : 999;
            }
        }
        return priorityMap.get(releaseType) ?? 999;
    };

    const getSecondaryTypePriorityKey = (releaseType: string): string => {
        if (releaseType.includes('/')) {
            const types = releaseType.split('/');
            const secondaryTypes = types.filter((type) => !PRIMARY_RELEASE_TYPES.includes(type));

            if (secondaryTypes.length > 0) {
                const priorities = secondaryTypes
                    .map((type) => priorityMap.get(type) ?? 999)
                    .filter((p) => p !== 999)
                    .sort((a, b) => a - b);

                return priorities.map((p) => String(p).padStart(3, '0')).join(',');
            }
        }
        return '';
    };

    const isReleaseTypeEnabled = (releaseType: string): boolean => {
        if (releaseType.includes('/')) {
            const types = releaseType.split('/');
            return types.some((type) => {
                const enumValue = releaseTypeToEnumMap[type];
                return enumValue ? enabledReleaseTypeEnums.has(enumValue) : false;
            });
        }
        const enumValue = releaseTypeToEnumMap[releaseType];
        return enumValue ? enabledReleaseTypeEnums.has(enumValue) : false;
    };

    const releaseTypeEntries = Object.entries(albumsByReleaseType)
        .filter(([releaseType]) => isReleaseTypeEnabled(releaseType))
        .map(([releaseType, albums]) => {
            let displayName: React.ReactNode | string;

            if (releaseType.includes('/')) {
                const types = releaseType.split('/');
                const displayNames = types.map((type) => getDisplayNameForType(type));
                displayName = displayNames.join(SEPARATOR_STRING);
            } else {
                displayName = getDisplayNameForType(releaseType);
            }

            return { albums, displayName, releaseType };
        })
        .sort((a, b) => {
            const priorityA = getPriority(a.releaseType);
            const priorityB = getPriority(b.releaseType);

            if (priorityA !== priorityB) {
                return priorityA - priorityB;
            }

            const isCombinedA = a.releaseType.includes('/');
            const isCombinedB = b.releaseType.includes('/');

            if (isCombinedA && isCombinedB) {
                const secondaryKeyA = getSecondaryTypePriorityKey(a.releaseType);
                const secondaryKeyB = getSecondaryTypePriorityKey(b.releaseType);

                if (secondaryKeyA && secondaryKeyB) {
                    return collator.compare(secondaryKeyA, secondaryKeyB);
                }
            }

            return collator.compare(a.releaseType, b.releaseType);
        });

    const flatSortedAlbums = releaseTypeEntries.flatMap((entry) => entry.albums);

    return { flatSortedAlbums, releaseTypeEntries };
};

export const useArtistAlbumsGrouped = (albums: Album[], routeId: string) => {
    const { t } = useTranslation();
    const artistReleaseTypeItems = useArtistReleaseTypeItems();
    const albumArtistDetailSort = useAppStore((state) => state.albumArtistDetailSort);
    const groupingType = albumArtistDetailSort.groupingType;

    return useMemo(() => {
        return getArtistAlbumsGrouped(albums, routeId, groupingType, artistReleaseTypeItems, t);
    }, [albums, routeId, groupingType, artistReleaseTypeItems, t]);
};
