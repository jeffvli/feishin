export type ArtworkKind = 'common' | 'mixed' | 'none';

export type ArtworkOp = { bytes: Uint8Array; mimeType: string; type: 'set' } | { type: 'clear' };

export interface BatchFileError {
    code?: string;
    error: string;
    path: string;
}

export interface BatchProgress {
    processed: number;
    total: number;
}

export interface FileArtworkData {
    data: string;
    mimeType: string;
}

export interface ReadLocalImageResult extends IpcResult {
    data?: string;
    mimeType?: string;
}

export interface ReadSongMetadataBatchResult extends IpcResult {
    artworkData?: string;
    artworkKind: ArtworkKind;
    artworkMimeType?: string;
    failedFiles?: BatchFileError[];
    fileArtwork?: Record<string, FileArtworkData>;
    fileTags?: Record<string, Record<string, TagValue>>;
    multiValueKeys?: string[];
    readCount?: number;
    tagSummary?: Record<string, null | TagValue>;
    totalCount?: number;
}

/** Subset of `window.api.utils` consumed by the metadata editor. */
export interface TagEditorUtils {
    cancelReadSongMetadata: () => void;
    offBatchProgress: (cb: (event: unknown, data: BatchProgress) => void) => void;
    onBatchProgress: (cb: (event: unknown, data: BatchProgress) => void) => void;
    readLocalImage: (filePath: string) => Promise<ReadLocalImageResult>;
    readSongMetadataBatch: (filePaths: string[]) => Promise<ReadSongMetadataBatchResult>;
    writeSongTagsBatch: (
        filePaths: string[],
        edits: Record<string, TagValue>,
        removed: string[],
        artworkOp?: ArtworkOp,
    ) => Promise<WriteSongTagsBatchResult>;
}

export type TagValue = string | string[];

export interface WriteSongTagsBatchResult extends IpcResult {
    failedFiles?: BatchFileError[];
}

interface IpcResult {
    error?: string;
    success: boolean;
}
