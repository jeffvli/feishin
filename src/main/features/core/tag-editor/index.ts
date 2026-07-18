import type {
    ArtworkOp,
    ReadSongMetadataBatchResult,
    TagValue,
    WriteSongTagsBatchResult,
} from '/@/shared/types/tag-editor';

import { ipcMain, type IpcMainInvokeEvent } from 'electron';

import { readFilesMetadataBatch, readLocalImageFile, writeFilesTags } from './taglib-service';

const sendBatchProgress = (event: IpcMainInvokeEvent, processed: number, total: number) => {
    event.sender.send('batch-progress', { processed, total });
};

let activeReadController: AbortController | null = null;

ipcMain.handle('cancel-read-song-metadata', () => {
    activeReadController?.abort();
    activeReadController = null;
});

ipcMain.handle(
    'read-song-metadata-batch',
    async (event, filePaths: string[]): Promise<ReadSongMetadataBatchResult> => {
        activeReadController?.abort();
        activeReadController = new AbortController();
        const { signal } = activeReadController;

        try {
            const result = await readFilesMetadataBatch(
                filePaths,
                (processed, total) => sendBatchProgress(event, processed, total),
                signal,
            );

            if (signal.aborted) {
                return { artworkKind: 'none', success: false };
            }

            if (!result.success) {
                return {
                    artworkKind: 'none',
                    error: result.failedFiles[0]?.error ?? 'No readable audio files in selection',
                    failedFiles: result.failedFiles,
                    readCount: result.readCount,
                    success: false,
                    totalCount: result.totalCount,
                };
            }

            return {
                artworkKind: result.artworkKind,
                failedFiles: result.failedFiles.length > 0 ? result.failedFiles : undefined,
                fileArtwork: result.fileArtwork,
                fileTags: result.fileTags,
                multiValueKeys: result.multiValueKeys,
                readCount: result.readCount,
                success: true,
                tagSummary: result.tagSummary,
                totalCount: result.totalCount,
                ...(result.artworkData
                    ? {
                          artworkData: result.artworkData,
                          artworkMimeType: result.artworkMimeType,
                      }
                    : {}),
            };
        } catch (err) {
            return { artworkKind: 'none', error: String(err), success: false };
        } finally {
            activeReadController = null;
        }
    },
);

ipcMain.handle(
    'write-song-tags-batch',
    async (
        event,
        filePaths: string[],
        edits: Record<string, TagValue>,
        removed: string[],
        artworkOp?: ArtworkOp,
    ): Promise<WriteSongTagsBatchResult> => {
        try {
            const result = await writeFilesTags(
                filePaths,
                edits,
                removed,
                artworkOp,
                (processed, total) => sendBatchProgress(event, processed, total),
            );

            if (!result.success) {
                return {
                    error: result.failedFiles[0]?.error,
                    failedFiles: result.failedFiles,
                    success: false,
                };
            }
            return { success: true };
        } catch (err) {
            return { error: String(err), success: false };
        }
    },
);

ipcMain.handle('read-local-image', async (_event, filePath: string) => {
    try {
        const { data, mimeType } = await readLocalImageFile(filePath);
        return { data, mimeType, success: true };
    } catch (err) {
        return { error: String(err), success: false };
    }
});
