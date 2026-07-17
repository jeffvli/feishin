import type { ArtworkKind, ArtworkOp, BatchFileError } from '/@/shared/types/tag-editor';

import { constants, promises as fsPromises } from 'fs';
import { PROPERTIES, TagLib } from 'taglib-wasm';

import { getImageMimeTypeFromPath } from '/@/shared/utils/image-mime';

let _taglib: null | TagLib = null;

const getTagLib = async (): Promise<TagLib> => {
    if (!_taglib) _taglib = await TagLib.initialize();
    return _taglib;
};

const BATCH_CONCURRENCY = 8;

/** Returns an error entry for each path that is missing or not writable by the current process. */
export async function checkPathsWritable(paths: string[]): Promise<BatchFileError[]> {
    const failed: BatchFileError[] = [];
    await Promise.all(
        paths.map(async (filePath) => {
            try {
                await fsPromises.access(filePath, constants.F_OK | constants.W_OK);
            } catch (err) {
                failed.push({
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

/** Flattens a taglib-wasm PropertyMap to a string record, dropping ALL_CAPS alias keys already covered by a camelCase equivalent. */
function flattenProperties(props: Record<string, string[] | undefined>): Record<string, string> {
    const flat: Record<string, string> = {};
    for (const [key, values] of Object.entries(props)) {
        if (values && values.length > 0 && values[0] !== '') {
            flat[key] = values.join('; ');
        }
    }
    const coveredByUpperCase = new Set(
        Object.keys(flat)
            .filter((k) => k !== k.toUpperCase())
            .map((k) => k.toUpperCase()),
    );
    for (const key of Object.keys(flat)) {
        if (key === key.toUpperCase() && coveredByUpperCase.has(key)) {
            delete flat[key];
        }
    }
    return flat;
}

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
    readCount: number;
    success: boolean;
    tagSummary: Record<string, null | string>;
    totalCount: number;
}> {
    const totalCount = filePaths.length;
    const failedFiles: BatchFileError[] = [];
    const tagSummary: Record<string, null | string> = {};
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
                const file = await taglib.open(filePath);
                try {
                    const rawProperties = file.properties();
                    const embeddedLyrics = file.getLyrics();
                    if (embeddedLyrics.length > 0) {
                        rawProperties.lyrics = [
                            embeddedLyrics.map(({ text }) => text).join('\n\n'),
                        ];
                    }
                    const flat = flattenProperties(rawProperties);
                    const pictures = file.getPictures();
                    const frontCover = pictures.find((p) => p.type === 'FrontCover') ?? pictures[0];
                    const hasCoverArt = frontCover !== undefined;
                    const picSize = hasCoverArt ? frontCover.data.length : undefined;

                    if (readCount === 0) {
                        Object.assign(tagSummary, flat);
                        artworkKind = hasCoverArt ? 'common' : 'none';
                        artworkByteSize = picSize;
                        if (frontCover) {
                            artworkData = Buffer.from(frontCover.data).toString('base64');
                            artworkMimeType = frontCover.mimeType;
                        }
                    } else {
                        for (const k of Object.keys(tagSummary)) {
                            if (tagSummary[k] !== null && flat[k] !== tagSummary[k])
                                tagSummary[k] = null;
                        }
                        for (const k of Object.keys(flat)) {
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
 * Fields in `removed` are written as empty strings, which clears them in TagLib.
 */
export async function writeFilesTags(
    filePaths: string[],
    edits: Record<string, string>,
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

    const mergedEdits: Record<string, string> = { ...edits };
    for (const key of removed) {
        mergedEdits[key] = '';
    }

    const hasEdits = Object.keys(mergedEdits).length > 0;

    if (!hasEdits && !artworkOp) {
        return { failedFiles, success: failedFiles.length === 0 };
    }

    const taglib = await getTagLib();
    let processed = 0;
    const total = writablePaths.length;

    await mapWithConcurrency(writablePaths, BATCH_CONCURRENCY, async (path) => {
        try {
            await taglib.edit(path, (file) => {
                for (const [k, v] of Object.entries(mergedEdits)) {
                    file.setProperty(k in PROPERTIES ? k : k.toUpperCase(), v);
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
