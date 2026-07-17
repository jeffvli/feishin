import type {
    ArtworkKind,
    ArtworkOp,
    BatchProgress,
    TagEditorUtils,
    TagValue,
} from '/@/shared/types/tag-editor';

import { closeAllModals } from '@mantine/modals';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { FIELD_PRIORITY, KNOWN_TAG_MAP, KNOWN_TAGS, type KnownTag } from '../utils/known-tags';
import { base64ToBytes, formatBatchFileErrors } from '../utils/utils';

import { controller } from '/@/renderer/api/controller';
import { useCurrentServer, useSettingsStoreActions, useTagEditorSettings } from '/@/renderer/store';
import { resolveSongPath } from '/@/renderer/utils/resolve-song-path';
import { toast } from '/@/shared/components/toast/toast';
import { Song } from '/@/shared/types/domain-types';

/**
 * Subscribes to batch progress events for the duration of `fn`, then unsubscribes.
 * Ensures the progress handler is always cleaned up even if `fn` throws.
 */
const withBatchProgress = async <T>(
    utils: TagEditorUtils,
    onProgress: (data: BatchProgress) => void,
    fn: () => Promise<T>,
): Promise<T> => {
    const handler = (_e: unknown, data: BatchProgress) => onProgress(data);
    utils.onBatchProgress(handler);
    try {
        return await fn();
    } finally {
        utils.offBatchProgress(handler);
    }
};

interface UseMetadataEditorArgs {
    browser: null | { clearCache: () => Promise<void> };
    songs?: Song[];
    utils: TagEditorUtils;
}

/**
 * Drives the metadata editor UI: loads song tags from disk, tracks field edits
 * and artwork changes, and writes them back on save.
 */
export const useMetadataEditor = ({ browser, songs: songsProp, utils }: UseMetadataEditorArgs) => {
    const { t } = useTranslation();
    const server = useCurrentServer();
    const { favoriteValues, multiValueFields, triggerRescan } = useTagEditorSettings();
    const { setSettings } = useSettingsStoreActions();

    const [isLoading, setIsLoading] = useState(true);
    const [loadProgress, setLoadProgress] = useState<BatchProgress | null>(null);
    const [error, setError] = useState<null | string>(null);
    const [readWarning, setReadWarning] = useState<null | string>(null);
    const [resolvedSongs, setResolvedSongs] = useState<Song[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [tagSummary, setTagSummary] = useState<Record<string, null | TagValue>>({});
    const [editedFields, setEditedFields] = useState<Record<string, TagValue>>({});
    const [parsedMultiValueKeys, setParsedMultiValueKeys] = useState<Set<string>>(new Set());
    const [removedKeys, setRemovedKeys] = useState<Set<string>>(new Set());
    const [loadedArtwork, setLoadedArtwork] = useState<{ kind: ArtworkKind }>({ kind: 'none' });
    const [artworkDisplayUrl, setArtworkDisplayUrl] = useState<null | string>(null);
    const [artworkOp, setArtworkOp] = useState<ArtworkOp | null>(null);

    const setRescan = useCallback(
        (value: boolean) => setSettings({ tagEditor: { triggerRescan: value } }),
        [setSettings],
    );

    /**
     * Merges `tagSummary` (on-disk values) and `editedFields` (unsaved edits) into
     * `displayFields`. Keys present in `tagSummary` with a `null` value (differing
     * across files) are added to `mixedKeys`. `sortedFieldEntries` applies
     * `FIELD_PRIORITY` ordering, then alphabetical by label for unlisted keys.
     */
    const multiValueKeys = useMemo(
        () => new Set([...multiValueFields, ...parsedMultiValueKeys]),
        [multiValueFields, parsedMultiValueKeys],
    );

    const { displayFields, mixedKeys, sortedFieldEntries } = useMemo(() => {
        const allKeys = new Set<string>();
        for (const k of Object.keys(tagSummary)) allKeys.add(k);
        for (const k of Object.keys(editedFields)) allKeys.add(k);

        const displayFields: Record<string, TagValue> = {};
        const mixedKeys = new Set<string>();

        for (const key of allKeys) {
            if (key in editedFields) {
                displayFields[key] = editedFields[key];
                continue;
            }
            const summaryVal = tagSummary[key];
            if (summaryVal === null) {
                mixedKeys.add(key);
                displayFields[key] = multiValueKeys.has(key) ? [] : '';
            } else if (summaryVal !== undefined) {
                displayFields[key] = summaryVal;
            }
        }

        const sortedFieldEntries = Object.entries(displayFields).sort(([a], [b]) => {
            const pa = FIELD_PRIORITY.indexOf(a);
            const pb = FIELD_PRIORITY.indexOf(b);
            if (pa !== -1 && pb !== -1) return pa - pb;
            if (pa !== -1) return -1;
            if (pb !== -1) return 1;
            const labelA = KNOWN_TAG_MAP.get(a)?.label ?? a;
            const labelB = KNOWN_TAG_MAP.get(b)?.label ?? b;
            return labelA.localeCompare(labelB);
        });

        return { displayFields, mixedKeys, sortedFieldEntries };
    }, [tagSummary, editedFields, multiValueKeys]);

    /**
     * Runs once on mount: reads metadata for all songs in batch and populates
     * tag summary and initial artwork state.
     */
    useEffect(() => {
        const initialize = async () => {
            const songs = (songsProp ?? []).filter((s) => s.path);

            if (songs.length === 0) {
                setError(t('page.itemDetail.noLocalSongs', 'No songs with local file paths found'));
                setIsLoading(false);
                return;
            }

            setResolvedSongs(songs);
            const paths = songs.map((s) => resolveSongPath(s.path)).filter(Boolean) as string[];

            const batchResult = await withBatchProgress(utils, setLoadProgress, () =>
                utils.readSongMetadataBatch(paths),
            );

            if (!batchResult.success || !batchResult.tagSummary) {
                setError(batchResult.error ?? t('page.itemDetail.fileNotWritable'));
                setIsLoading(false);
                return;
            }

            if (batchResult.failedFiles?.length) {
                const count = batchResult.failedFiles.length;
                const total = batchResult.totalCount ?? paths.length;
                setReadWarning(
                    t('page.itemDetail.readPartialFailure', {
                        count,
                        defaultValue: `Could not read metadata from ${count} of ${total} file(s).`,
                        total,
                    }),
                );
            }

            setTagSummary(batchResult.tagSummary);
            setParsedMultiValueKeys(new Set(batchResult.multiValueKeys ?? []));

            if (
                batchResult.artworkKind === 'common' &&
                batchResult.artworkData &&
                batchResult.artworkMimeType
            ) {
                setArtworkDisplayUrl(
                    `data:${batchResult.artworkMimeType};base64,${batchResult.artworkData}`,
                );
            }
            setLoadedArtwork({ kind: batchResult.artworkKind });
            setIsLoading(false);
        };

        initialize().catch((err) => {
            setError(String(err));
            setIsLoading(false);
        });

        return () => utils.cancelReadSongMetadata();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /** Records an edited value for `key`, overriding the on-disk summary. */
    const handleFieldChange = useCallback((key: string, value: TagValue) => {
        setEditedFields((prev) => ({ ...prev, [key]: value }));
    }, []);

    const handleAddFavoriteValue = useCallback(
        (key: string, value: string) => {
            const trimmed = value.trim();
            if (!trimmed) return;

            const currentValues = favoriteValues[key] ?? [];
            if (currentValues.some((favorite) => favorite.toLowerCase() === trimmed.toLowerCase()))
                return;

            setSettings({
                tagEditor: {
                    favoriteValues: {
                        ...favoriteValues,
                        [key]: [...currentValues, trimmed],
                    },
                },
            });
        },
        [favoriteValues, setSettings],
    );

    /** Marks `key` for deletion while preserving its displayed value for undo. */
    const handleRemoveField = useCallback((key: string) => {
        setRemovedKeys((prev) => new Set(prev).add(key));
    }, []);

    /** Re-enables a field that was marked for deletion. */
    const handleResetField = useCallback((key: string) => {
        setRemovedKeys((prev) => {
            const next = new Set(prev);
            next.delete(key);
            return next;
        });
    }, []);

    /** Restores a field to its original on-disk value and removal state. */
    const handleRevertField = useCallback((key: string) => {
        setEditedFields((prev) => {
            const next = { ...prev };
            delete next[key];
            return next;
        });
        setRemovedKeys((prev) => {
            const next = new Set(prev);
            next.delete(key);
            return next;
        });
    }, []);

    // Refs so the functional updater inside handleAddField can see latest values without needing them in the dependency array.
    const tagSummaryRef = useRef(tagSummary);
    tagSummaryRef.current = tagSummary;
    const removedKeysRef = useRef(removedKeys);
    removedKeysRef.current = removedKeys;

    /** Adds `key` to `editedFields` with an empty value and un-marks it from removal. */
    const handleAddField = useCallback(
        (key: null | string) => {
            if (!key) return;
            setEditedFields((prev) => {
                const wasRemoved = removedKeysRef.current.has(key);
                if (wasRemoved) return prev;
                const alreadyVisible = (key in tagSummaryRef.current || key in prev) && !wasRemoved;
                if (alreadyVisible) return prev;
                return { ...prev, [key]: multiValueKeys.has(key) ? [] : '' };
            });
            setRemovedKeys((prev) => {
                const next = new Set(prev);
                next.delete(key);
                return next;
            });
        },
        [multiValueKeys],
    );

    /** Creates a blob URL from raw image bytes and queues a `set` artwork operation. */
    const applyArtworkBytes = useCallback((bytes: Uint8Array, mimeType: string) => {
        const blob = new Blob([bytes.buffer as ArrayBuffer], { type: mimeType });
        setArtworkDisplayUrl(URL.createObjectURL(blob));
        setArtworkOp({ bytes, mimeType, type: 'set' });
    }, []);

    /** Opens a native file picker, reads the selected image, and applies it as the new artwork. */
    const handleChangeArtwork = useCallback(async () => {
        const path = await window.api.localSettings.openFileSelector({
            filters: [{ extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'], name: 'Images' }],
        });
        if (!path) return;
        const result = await utils.readLocalImage(path);
        if (result.success && result.data && result.mimeType) {
            applyArtworkBytes(base64ToBytes(result.data), result.mimeType);
        }
    }, [applyArtworkBytes, utils]);

    /** Clears the artwork preview and queues a `clear` artwork operation. */
    const handleRemoveArtwork = useCallback(() => {
        setArtworkDisplayUrl(null);
        setArtworkOp({ type: 'clear' });
    }, []);

    /** Returns the `KnownTag` descriptor for `key`, falling back to a generic string entry. */
    const getFieldMeta = useCallback(
        (key: string): KnownTag => KNOWN_TAG_MAP.get(key) ?? { key, label: key, type: 'string' },
        [],
    );

    /**
     * Validates that no editable fields are empty, writes all tag and artwork
     * changes to disk in batch, then optionally triggers a server rescan and
     * closes the modal.
     */
    const handleSave = useCallback(async () => {
        if (resolvedSongs.length === 0) return;

        const activeEdits = Object.fromEntries(
            Object.entries(editedFields).filter(([key]) => !removedKeys.has(key)),
        ) as Record<string, TagValue>;
        const emptyFields = Object.entries(activeEdits)
            .filter(([key, value]) => {
                const meta = KNOWN_TAG_MAP.get(key);
                if (meta?.type === 'boolean') return false;
                return Array.isArray(value)
                    ? value.length === 0 || value.some((part) => part.trim() === '')
                    : value.trim() === '';
            })
            .map(([key]) => KNOWN_TAG_MAP.get(key)?.label ?? key);

        if (emptyFields.length > 0) {
            toast.error({
                message: `${t('page.itemDetail.emptyFields', 'Fields cannot be empty')}: ${emptyFields.join(', ')}`,
                title: t('error.generalError', 'Error'),
            });
            return;
        }

        setIsSaving(true);
        const paths = resolvedSongs.map((s) => resolveSongPath(s.path)).filter(Boolean) as string[];

        try {
            const writeResult = await withBatchProgress(utils, setLoadProgress, () =>
                utils.writeSongTagsBatch(
                    paths,
                    activeEdits,
                    [...removedKeys],
                    artworkOp ?? undefined,
                ),
            );

            if (!writeResult.success) {
                const failed = writeResult.failedFiles ?? [];
                const message =
                    failed.length > 0
                        ? formatBatchFileErrors(
                              failed,
                              t('page.itemDetail.writePartialFailure', {
                                  count: failed.length,
                                  defaultValue: `Failed to save ${failed.length} file(s).`,
                              }),
                          )
                        : (writeResult.error ?? t('page.itemDetail.fileNotWritable'));
                toast.error({ message, title: t('error.generalError', 'Error') });
                return;
            }

            if (artworkOp) {
                await browser?.clearCache();
            }

            if (triggerRescan && server) {
                try {
                    await controller.refreshItems({
                        apiClientProps: { serverId: server.id },
                        query: { ids: resolvedSongs.map((s) => s.id) },
                    });
                } catch {
                    // non-fatal
                }
            }

            closeAllModals();
        } finally {
            setLoadProgress(null);
            setIsSaving(false);
        }
    }, [
        artworkOp,
        browser,
        editedFields,
        removedKeys,
        resolvedSongs,
        server,
        t,
        triggerRescan,
        utils,
    ]);

    /** Known tags not yet present in `displayFields`, sorted alphabetically for the add-field dropdown. */
    const availableToAdd = useMemo(
        () =>
            KNOWN_TAGS.filter((tag) => !(tag.key in displayFields))
                .map((tag) => ({ label: tag.label, value: tag.key }))
                .sort((a, b) => a.label.localeCompare(b.label)),
        [displayFields],
    );

    const artworkIsMixed = artworkOp === null && loadedArtwork.kind === 'mixed';
    const showRemoveArtworkButton =
        artworkOp?.type !== 'clear' && (artworkOp?.type === 'set' || loadedArtwork.kind !== 'none');

    const mixedPlaceholder = t('page.itemDetail.multipleValues', '(Multiple Values)');

    return {
        applyArtworkBytes,
        artworkDisplayUrl,
        artworkIsMixed,
        availableToAdd,
        editedFields,
        error,
        favoriteValues,
        getFieldMeta,
        handleAddFavoriteValue,
        handleAddField,
        handleChangeArtwork,
        handleFieldChange,
        handleRemoveArtwork,
        handleRemoveField,
        handleResetField,
        handleRevertField,
        handleSave,
        isLoading,
        isSaving,
        loadProgress,
        mixedKeys,
        mixedPlaceholder,
        multiValueKeys,
        readWarning,
        removedKeys,
        rescan: triggerRescan,
        setRescan,
        showRemoveArtworkButton,
        sortedFieldEntries,
    };
};
