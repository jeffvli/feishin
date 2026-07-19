import type { ArtworkKind, ArtworkOp, BatchFileError, TagValue } from '/@/shared/types/tag-editor';

import { constants, promises as fsPromises } from 'fs';
import { PROPERTIES, TagLib } from 'taglib-wasm';

import { getImageMimeTypeFromPath } from '/@/shared/utils/image-mime';

let _taglib: null | TagLib = null;

const getTagLib = async (): Promise<TagLib> => {
    if (!_taglib) _taglib = await TagLib.initialize();
    return _taglib;
};

const BATCH_CONCURRENCY = 8;

/**
 * Known PROPERTIES stay camelCase for the taglib-wasm JS API. Custom tags use
 * TagLib's ALL_CAPS wire form so read/write/settings keys stay consistent.
 */
const canonicalizePropertyKey = (key: string): string => {
    if (key in PROPERTIES) return key;
    return key.toUpperCase();
};

/** Returns an error entry for each path that is missing or not writable by the current process. */
export async function checkPathsWritable(paths: string[]): Promise<BatchFileError[]> {
    const failed: BatchFileError[] = [];
    await Promise.all(
        paths.map(async (filePath) => {
            try {
                await fsPromises.access(filePath, constants.F_OK | constants.W_OK);
            } catch (err) {
                failed.push({
                    code: (err as NodeJS.ErrnoException).code,
                    error: err instanceof Error ? err.message : String(err),
                    path: filePath,
                });
            }
        }),
    );
    return failed;
}

/** Reads an image file and returns it as base64 + MIME type for IPC transport to the renderer. */
export async function readLocalImageFile(filePath: string) {
    const buf = await fsPromises.readFile(filePath);
    return {
        data: buf.toString('base64'),
        mimeType: getImageMimeTypeFromPath(filePath),
    };
}

/** Normalizes a taglib-wasm PropertyMap while preserving true multivalue arrays. */
function normalizeProperties(
    props: Record<string, string[] | undefined>,
): Record<string, TagValue> {
    const normalized: Record<string, TagValue> = {};
    for (const [key, values] of Object.entries(props)) {
        if (values && values.length > 0 && values[0] !== '') {
            const canonicalKey = canonicalizePropertyKey(key);
            normalized[canonicalKey] = values.length === 1 ? values[0] : [...values];
        }
    }
    const coveredByUpperCase = new Set(
        Object.keys(normalized)
            .filter((k) => k !== k.toUpperCase())
            .map((k) => k.toUpperCase()),
    );
    for (const key of Object.keys(normalized)) {
        if (key === key.toUpperCase() && coveredByUpperCase.has(key)) {
            delete normalized[key];
        }
    }
    return normalized;
}

const tagValuesEqual = (a: TagValue, b: TagValue | undefined): boolean => {
    if (Array.isArray(a) || Array.isArray(b)) {
        return (
            Array.isArray(a) &&
            Array.isArray(b) &&
            a.length === b.length &&
            a.every((value, index) => value === b[index])
        );
    }
    return a === b;
};

/** Runs `fn` over `items` with at most `concurrency` tasks in flight at once. Stops early if `signal` is aborted. */
const mapWithConcurrency = async <T>(
    items: T[],
    concurrency: number,
    fn: (item: T) => Promise<void>,
    signal?: AbortSignal,
): Promise<void> => {
    let nextIndex = 0;
    const worker = async () => {
        while (nextIndex < items.length) {
            if (signal?.aborted) return;
            const index = nextIndex;
            nextIndex += 1;
            await fn(items[index]);
        }
    };
    await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()));
};

/**
 * Reads all tags and artwork from a batch of audio files via taglib-wasm.
 * Returns every tag present on disk — not limited to any known-field list.
 * Values that differ across files are merged to `null` and shown as "(Multiple Values)" in the editor.
 * Artwork bytes are captured from the first successful file; subsequent files only contribute their size for comparison.
 */
export async function readFilesMetadataBatch(
    filePaths: string[],
    onProgress?: (processed: number, total: number) => void,
    signal?: AbortSignal,
): Promise<{
    artworkData?: string;
    artworkKind: ArtworkKind;
    artworkMimeType?: string;
    failedFiles: BatchFileError[];
    fileArtwork: Record<string, { data: string; mimeType: string }>;
    fileTags: Record<string, Record<string, TagValue>>;
    multiValueKeys: string[];
    readCount: number;
    success: boolean;
    tagSummary: Record<string, null | TagValue>;
    totalCount: number;
}> {
    const totalCount = filePaths.length;
    const failedFiles: BatchFileError[] = [];
    const multiValueKeys = new Set<string>();
    const tagSummary: Record<string, null | TagValue> = {};
    const fileTags: Record<string, Record<string, TagValue>> = {};
    const fileArtwork: Record<string, { data: string; mimeType: string }> = {};
    let artworkKind = 'none' as ArtworkKind;
    let artworkByteSize: number | undefined;
    let artworkData: string | undefined;
    let artworkMimeType: string | undefined;
    let readCount = 0;
    let processed = 0;

    const taglib = await getTagLib();

    await mapWithConcurrency(
        filePaths,
        BATCH_CONCURRENCY,
        async (filePath) => {
            try {
                await fsPromises.access(filePath, constants.F_OK);
                const file = await taglib.open(filePath);
                try {
                    const rawProperties = file.properties();
                    const embeddedLyrics = file.getLyrics();
                    if (embeddedLyrics.length > 0) {
                        rawProperties.lyrics = [
                            embeddedLyrics.map(({ text }) => text).join('\n\n'),
                        ];
                    }
                    const normalized = normalizeProperties(rawProperties);
                    fileTags[filePath] = normalized;
                    for (const [key, value] of Object.entries(normalized)) {
                        if (Array.isArray(value)) multiValueKeys.add(key);
                    }
                    const pictures = file.getPictures();
                    const frontCover = pictures.find((p) => p.type === 'FrontCover') ?? pictures[0];
                    const hasCoverArt = frontCover !== undefined;
                    const picSize = hasCoverArt ? frontCover.data.length : undefined;

                    if (frontCover) {
                        fileArtwork[filePath] = {
                            data: Buffer.from(frontCover.data).toString('base64'),
                            mimeType: frontCover.mimeType,
                        };
                    }

                    if (readCount === 0) {
                        Object.assign(tagSummary, normalized);
                        artworkKind = hasCoverArt ? 'common' : 'none';
                        artworkByteSize = picSize;
                        if (frontCover) {
                            artworkData = fileArtwork[filePath].data;
                            artworkMimeType = frontCover.mimeType;
                        }
                    } else {
                        for (const k of Object.keys(tagSummary)) {
                            if (
                                tagSummary[k] !== null &&
                                !tagValuesEqual(tagSummary[k], normalized[k])
                            )
                                tagSummary[k] = null;
                        }
                        for (const k of Object.keys(normalized)) {
                            if (!(k in tagSummary)) tagSummary[k] = null;
                        }
                        if (artworkKind !== 'mixed') {
                            if (
                                hasCoverArt !== (artworkKind === 'common') ||
                                picSize !== artworkByteSize
                            ) {
                                artworkKind = 'mixed';
                            }
                        }
                    }

                    readCount += 1;
                } finally {
                    file.dispose();
                }
            } catch (err) {
                failedFiles.push({
                    code: (err as NodeJS.ErrnoException).code,
                    error: err instanceof Error ? err.message : String(err),
                    path: filePath,
                });
            }
            processed += 1;
            onProgress?.(processed, totalCount);
        },
        signal,
    );

    return {
        artworkKind,
        failedFiles,
        fileArtwork,
        fileTags,
        multiValueKeys: [...multiValueKeys],
        readCount,
        success: readCount > 0,
        tagSummary,
        totalCount,
        ...(artworkData ? { artworkData, artworkMimeType } : {}),
    };
}

/**
 * Writes tag edits and/or artwork to a batch of audio files in-place via taglib-wasm (WASI).
 * Only the fields present in `edits`/`removed` are touched — all other existing tags are preserved.
 * Array values are written as true multivalue properties; scalar values remain single-valued.
 * Lyrics use TagLib's dedicated unsynchronized-lyrics API.
 */
export async function writeFilesTags(
    filePaths: string[],
    edits: Record<string, TagValue>,
    removed: string[],
    artworkOp?: ArtworkOp,
    onProgress?: (processed: number, total: number) => void,
): Promise<{ failedFiles: BatchFileError[]; success: boolean }> {
    const notWritable = await checkPathsWritable(filePaths);
    const notWritableSet = new Set(notWritable.map((f) => f.path));

    const writablePaths = filePaths.filter((p) => !notWritableSet.has(p));
    const failedFiles: BatchFileError[] = [...notWritable];

    if (writablePaths.length === 0) {
        return { failedFiles, success: false };
    }

    const hasEdits = Object.keys(edits).length > 0 || removed.length > 0;

    if (!hasEdits && !artworkOp) {
        return { failedFiles, success: failedFiles.length === 0 };
    }

    const taglib = await getTagLib();
    let processed = 0;
    const total = writablePaths.length;

    await mapWithConcurrency(writablePaths, BATCH_CONCURRENCY, async (path) => {
        try {
            await taglib.edit(path, (file) => {
                const propertyEdits = Object.entries(edits).filter(([key]) => key !== 'lyrics');
                const propertyRemovals = removed.filter((key) => key !== 'lyrics');

                if (propertyEdits.length > 0 || propertyRemovals.length > 0) {
                    const properties = file.properties();

                    for (const [key, value] of propertyEdits) {
                        properties[canonicalizePropertyKey(key)] = Array.isArray(value)
                            ? value
                            : [value];
                    }

                    for (const key of propertyRemovals) {
                        delete properties[canonicalizePropertyKey(key)];
                    }

                    file.setProperties(properties);
                }

                if (removed.includes('lyrics')) {
                    file.setLyrics([]);
                } else if (edits.lyrics !== undefined) {
                    file.setLyrics([
                        {
                            text: Array.isArray(edits.lyrics)
                                ? edits.lyrics.join('\n\n')
                                : edits.lyrics,
                        },
                    ]);
                }

                if (artworkOp?.type === 'clear') {
                    file.removePictures();
                } else if (artworkOp?.type === 'set') {
                    file.removePictures();
                    file.addPicture({
                        data: artworkOp.bytes,
                        mimeType: artworkOp.mimeType,
                        type: 'FrontCover',
                    });
                }
            });
        } catch (err) {
            failedFiles.push({ error: String(err), path });
        }
        processed += 1;
        onProgress?.(processed, total);
    });

    return { failedFiles, success: failedFiles.length === 0 };
}
