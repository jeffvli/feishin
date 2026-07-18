import { PROPERTIES } from 'taglib-wasm';

/** Tags pinned to the top of the editor table (most frequently edited). */
export const FIELD_PRIORITY: readonly string[] = [
    'title',
    'artist',
    'album',
    'albumArtist',
    'trackNumber',
    'discNumber',
    'date',
];

export interface KnownTag {
    key: string;
    tagName: string;
    type: TagFieldType;
}

/** Which form control to render for a tag row. */
export type TagFieldType = 'boolean' | 'number' | 'string' | 'textarea';

/**
 * Per-key type overrides and extras. Keys absent from PROPERTIES are appended as
 * extra entries.
 */
const TAG_CONFIG: Record<string, { type?: TagFieldType }> = {
    acoustidFingerprint: { type: 'textarea' },
    // extras not in PROPERTIES (common MusicBrainz Picard tags)
    ARTISTS: {},
    artistSort: {},
    bpm: { type: 'number' },
    catalogNumber: {},
    comment: { type: 'textarea' },
    composerSort: {},
    discNumber: {},
    lyrics: { type: 'textarea' },
    musicbrainzArtistId: {},
    musicbrainzReleaseArtistId: {},
    musicbrainzReleaseGroupId: {},
    musicbrainzReleaseId: {},
    musicbrainzReleaseTrackId: {},
    musicbrainzTrackId: {},
    musicbrainzWorkId: {},
    originalAlbum: {},
    originalArtist: {},
    originalDate: {},
    ORIGINALYEAR: { type: 'number' },
    RELEASECOUNTRY: { type: 'string' },
    RELEASESTATUS: { type: 'string' },
    RELEASETYPE: { type: 'string' },
    remixedBy: {},
    titleSort: {},
    totalDiscs: {},
    totalTracks: {},
    trackNumber: {},
};

/** Field definitions derived from taglib-wasm's PROPERTIES plus any extras in TAG_CONFIG. */
export const KNOWN_TAGS: KnownTag[] = [
    ...Object.entries(PROPERTIES).map(([key, prop]) => {
        const cfg = TAG_CONFIG[key];
        return {
            key,
            tagName: prop.key,
            type: cfg?.type ?? (prop.type as TagFieldType),
        };
    }),
    ...Object.entries(TAG_CONFIG)
        .filter(([key]) => !(key in PROPERTIES))
        .map(([key, cfg]) => ({
            key,
            tagName: key,
            type: cfg.type ?? ('string' as TagFieldType),
        })),
];

export const KNOWN_TAG_MAP = new Map(KNOWN_TAGS.map((t) => [t.key, t]));

/**
 * Resolves a raw tag name to its TagLib property key. Known tags return their
 * canonical key; unknown names are uppercased to match TagLib's wire format.
 */
export const resolveTagKey = (input: string): string => {
    const trimmed = input.trim();
    if (!trimmed) return trimmed;

    const exact = KNOWN_TAGS.find((tag) => tag.tagName === trimmed || tag.key === trimmed);
    if (exact) return exact.key;

    const lower = trimmed.toLowerCase();
    const insensitive = KNOWN_TAGS.find(
        (tag) => tag.tagName.toLowerCase() === lower || tag.key.toLowerCase() === lower,
    );
    if (insensitive) return insensitive.key;

    return trimmed.toUpperCase();
};
