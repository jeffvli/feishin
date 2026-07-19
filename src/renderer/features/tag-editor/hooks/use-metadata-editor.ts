import type {
    ArtworkKind,
    ArtworkOp,
    BatchProgress,
    FileArtworkData,
    TagEditorUtils,
    TagValue,
} from '/@/shared/types/tag-editor';

import { closeAllModals } from '@mantine/modals';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { FIELD_PRIORITY, KNOWN_TAG_MAP, KNOWN_TAGS, type KnownTag } from '../utils/known-tags';
import { base64ToBytes, bytesToBase64, formatBatchFileErrors } from '../utils/utils';

import { controller } from '/@/renderer/api/controller';
import { useCurrentServer, useSettingsStoreActions, useTagEditorSettings } from '/@/renderer/store';
import { resolveSongPath } from '/@/renderer/utils/resolve-song-path';
import { toast } from '/@/shared/components/toast/toast';
import { Song } from '/@/shared/types/domain-types';

export const EDIT_SCOPE_ALL = '__all__';

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

const toArtworkDataUrl = (artwork: FileArtworkData): string =>
    `data:${artwork.mimeType};base64,${artwork.data}`;

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

const rebuildMergedTagSummary = (
    tagsByPath: Record<string, Record<string, TagValue>>,
): Record<string, null | TagValue> => {
    const paths = Object.keys(tagsByPath);
    if (paths.length === 0) return {};

    const summary: Record<string, null | TagValue> = { ...tagsByPath[paths[0]] };
    for (let index = 1; index < paths.length; index++) {
        const tags = tagsByPath[paths[index]];
        for (const key of Object.keys(summary)) {
            if (summary[key] !== null && !tagValuesEqual(summary[key] as TagValue, tags[key])) {
                summary[key] = null;
            }
        }
        for (const key of Object.keys(tags)) {
            if (!(key in summary)) summary[key] = null;
        }
    }
    return summary;
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
    const { tagConfigs, triggerRescan } = useTagEditorSettings();
    const { setSettings } = useSettingsStoreActions();
    const multiValueFields = useMemo(
        () =>
            Object.entries(tagConfigs)
                .filter(([, config]) => config.multiValue)
                .map(([key]) => key),
        [tagConfigs],
    );

    const [isLoading, setIsLoading] = useState(true);
    const [loadProgress, setLoadProgress] = useState<BatchProgress | null>(null);
    const [error, setError] = useState<null | string>(null);
    const [isFileNotFound, setIsFileNotFound] = useState(false);
    const [readWarning, setReadWarning] = useState<null | string>(null);
    const [resolvedSongs, setResolvedSongs] = useState<Song[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [editScope, setEditScopeState] = useState<string>(EDIT_SCOPE_ALL);
    const [mergedTagSummary, setMergedTagSummary] = useState<Record<string, null | TagValue>>({});
    const [fileTags, setFileTags] = useState<Record<string, Record<string, TagValue>>>({});
    const [fileArtwork, setFileArtwork] = useState<Record<string, FileArtworkData>>({});
    const [mergedArtworkKind, setMergedArtworkKind] = useState<ArtworkKind>('none');
    const [mergedArtwork, setMergedArtwork] = useState<FileArtworkData | null>(null);
    const [batchMultiValueKeys, setBatchMultiValueKeys] = useState<Set<string>>(new Set());
    const [editedFields, setEditedFields] = useState<Record<string, TagValue>>({});
    const [removedKeys, setRemovedKeys] = useState<Set<string>>(new Set());
    const [artworkDisplayUrl, setArtworkDisplayUrl] = useState<null | string>(null);
    const [artworkOp, setArtworkOp] = useState<ArtworkOp | null>(null);

    const setRescan = useCallback(
        (value: boolean) => setSettings({ tagEditor: { triggerRescan: value } }),
        [setSettings],
    );

    const scopedSong = useMemo(
        () =>
            editScope === EDIT_SCOPE_ALL
                ? null
                : (resolvedSongs.find((song) => song.id === editScope) ?? null),
        [editScope, resolvedSongs],
    );

    const scopedPath = useMemo(() => {
        if (!scopedSong?.path) return null;
        return resolveSongPath(scopedSong.path);
    }, [scopedSong]);

    const tagSummary = useMemo((): Record<string, null | TagValue> => {
        if (editScope === EDIT_SCOPE_ALL) return mergedTagSummary;
        if (!scopedPath) return {};
        return fileTags[scopedPath] ?? {};
    }, [editScope, fileTags, mergedTagSummary, scopedPath]);

    const parsedMultiValueKeys = useMemo(() => {
        if (editScope === EDIT_SCOPE_ALL) return batchMultiValueKeys;
        if (!scopedPath) return new Set<string>();
        const tags = fileTags[scopedPath] ?? {};
        return new Set(
            Object.entries(tags)
                .filter(([, value]) => Array.isArray(value))
                .map(([key]) => key),
        );
    }, [batchMultiValueKeys, editScope, fileTags, scopedPath]);

    const loadedArtworkKind = useMemo((): ArtworkKind => {
        if (editScope === EDIT_SCOPE_ALL) return mergedArtworkKind;
        if (!scopedPath) return 'none';
        return fileArtwork[scopedPath] ? 'common' : 'none';
    }, [editScope, fileArtwork, mergedArtworkKind, scopedPath]);

    const applyBaselineArtwork = useCallback(
        (scope: string, songs: Song[]) => {
            if (scope === EDIT_SCOPE_ALL) {
                if (mergedArtworkKind === 'common' && mergedArtwork) {
                    setArtworkDisplayUrl(toArtworkDataUrl(mergedArtwork));
                } else {
                    setArtworkDisplayUrl(null);
                }
                return;
            }

            const song = songs.find((item) => item.id === scope);
            const path = song?.path ? resolveSongPath(song.path) : null;
            const artwork = path ? fileArtwork[path] : undefined;
            setArtworkDisplayUrl(artwork ? toArtworkDataUrl(artwork) : null);
        },
        [fileArtwork, mergedArtwork, mergedArtworkKind],
    );

    const setEditScope = useCallback(
        (scope: string) => {
            setEditScopeState(scope);
            setEditedFields({});
            setRemovedKeys(new Set());
            setArtworkOp(null);
            applyBaselineArtwork(scope, resolvedSongs);
        },
        [applyBaselineArtwork, resolvedSongs],
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
            const tagNameA = KNOWN_TAG_MAP.get(a)?.tagName ?? a;
            const tagNameB = KNOWN_TAG_MAP.get(b)?.tagName ?? b;
            return tagNameA.localeCompare(tagNameB);
        });

        return { displayFields, mixedKeys, sortedFieldEntries };
    }, [tagSummary, editedFields, multiValueKeys]);

    /** Reads metadata for all songs and populates the editor state. */
    const initialize = useCallback(async () => {
        setError(null);
        setIsFileNotFound(false);
        setIsLoading(true);
        setLoadProgress(null);
        setReadWarning(null);
        setEditScopeState(EDIT_SCOPE_ALL);
        setEditedFields({});
        setRemovedKeys(new Set());
        setArtworkOp(null);

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
            const failedFiles = batchResult.failedFiles ?? [];
            setIsFileNotFound(
                failedFiles.length === paths.length &&
                    failedFiles.every((file) => file.code === 'ENOENT'),
            );
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

        setMergedTagSummary(batchResult.tagSummary);
        setFileTags(batchResult.fileTags ?? {});
        setFileArtwork(batchResult.fileArtwork ?? {});
        setBatchMultiValueKeys(new Set(batchResult.multiValueKeys ?? []));
        setMergedArtworkKind(batchResult.artworkKind);

        const nextMergedArtwork =
            batchResult.artworkKind === 'common' &&
            batchResult.artworkData &&
            batchResult.artworkMimeType
                ? { data: batchResult.artworkData, mimeType: batchResult.artworkMimeType }
                : null;
        setMergedArtwork(nextMergedArtwork);
        setArtworkDisplayUrl(nextMergedArtwork ? toArtworkDataUrl(nextMergedArtwork) : null);
        setIsLoading(false);
    }, [songsProp, t, utils]);

    const reload = useCallback(() => {
        initialize().catch((err) => {
            setIsFileNotFound(false);
            setError(String(err));
            setIsLoading(false);
        });
    }, [initialize]);

    /** Loads on mount and cancels an in-flight read when the editor unmounts. */
    useEffect(() => {
        reload();

        return () => utils.cancelReadSongMetadata();
    }, [reload, utils]);

    /** Records an edited value for `key`, overriding the on-disk summary. */
    const handleFieldChange = useCallback((key: string, value: TagValue) => {
        setEditedFields((prev) => ({ ...prev, [key]: value }));
    }, []);

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
        (key: string): KnownTag => KNOWN_TAG_MAP.get(key) ?? { key, tagName: key, type: 'string' },
        [],
    );

    const songsInScope = useMemo(
        () =>
            editScope === EDIT_SCOPE_ALL
                ? resolvedSongs
                : resolvedSongs.filter((song) => song.id === editScope),
        [editScope, resolvedSongs],
    );

    /**
     * Validates that no editable fields are empty, writes tag and artwork changes
     * to disk for the current scope, optionally triggers a server rescan, then
     * either closes the modal or refreshes in-memory baselines so editing can continue.
     */
    const handleSave = useCallback(
        async ({ close = true }: { close?: boolean } = {}) => {
            if (songsInScope.length === 0) return;

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
                .map(([key]) => KNOWN_TAG_MAP.get(key)?.tagName ?? key);

            if (emptyFields.length > 0) {
                toast.error({
                    message: `${t('page.itemDetail.emptyFields', 'Fields cannot be empty')}: ${emptyFields.join(', ')}`,
                    title: t('error.generalError', 'Error'),
                });
                return;
            }

            setIsSaving(true);
            const paths = songsInScope
                .map((s) => resolveSongPath(s.path))
                .filter(Boolean) as string[];
            const removedKeyList = [...removedKeys];

            try {
                const writeResult = await withBatchProgress(utils, setLoadProgress, () =>
                    utils.writeSongTagsBatch(
                        paths,
                        activeEdits,
                        removedKeyList,
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
                            query: { ids: songsInScope.map((s) => s.id) },
                        });
                    } catch {
                        // non-fatal
                    }
                }

                if (close) {
                    closeAllModals();
                    return;
                }

                const nextFileTags = { ...fileTags };
                for (const path of paths) {
                    const tags = { ...(nextFileTags[path] ?? {}) };
                    for (const [key, value] of Object.entries(activeEdits)) {
                        tags[key] = value;
                    }
                    for (const key of removedKeyList) {
                        delete tags[key];
                    }
                    nextFileTags[path] = tags;
                }
                setFileTags(nextFileTags);
                setMergedTagSummary(rebuildMergedTagSummary(nextFileTags));

                const nextFileArtwork = { ...fileArtwork };
                if (artworkOp?.type === 'set') {
                    const nextArtwork = {
                        data: bytesToBase64(artworkOp.bytes),
                        mimeType: artworkOp.mimeType,
                    };
                    for (const path of paths) {
                        nextFileArtwork[path] = nextArtwork;
                    }
                    setFileArtwork(nextFileArtwork);
                    if (editScope === EDIT_SCOPE_ALL || Object.keys(nextFileTags).length === 1) {
                        setMergedArtwork(nextArtwork);
                        setMergedArtworkKind('common');
                    } else {
                        const artworkEntries = Object.values(nextFileArtwork);
                        const allHaveArt = Object.keys(nextFileTags).every(
                            (path) => nextFileArtwork[path],
                        );
                        const sameArt =
                            allHaveArt &&
                            artworkEntries.length > 0 &&
                            artworkEntries.every(
                                (entry) =>
                                    entry.data === artworkEntries[0].data &&
                                    entry.mimeType === artworkEntries[0].mimeType,
                            );
                        setMergedArtwork(sameArt ? artworkEntries[0] : null);
                        setMergedArtworkKind(sameArt ? 'common' : 'mixed');
                    }
                    setArtworkDisplayUrl(toArtworkDataUrl(nextArtwork));
                } else if (artworkOp?.type === 'clear') {
                    for (const path of paths) {
                        delete nextFileArtwork[path];
                    }
                    setFileArtwork(nextFileArtwork);
                    const remaining = Object.values(nextFileArtwork);
                    if (remaining.length === 0) {
                        setMergedArtwork(null);
                        setMergedArtworkKind('none');
                    } else if (
                        remaining.every(
                            (entry) =>
                                entry.data === remaining[0].data &&
                                entry.mimeType === remaining[0].mimeType,
                        )
                    ) {
                        setMergedArtwork(remaining[0]);
                        setMergedArtworkKind('common');
                    } else {
                        setMergedArtwork(null);
                        setMergedArtworkKind('mixed');
                    }
                    setArtworkDisplayUrl(null);
                }

                const nextMultiValueKeys = new Set(batchMultiValueKeys);
                for (const [key, value] of Object.entries(activeEdits)) {
                    if (Array.isArray(value)) nextMultiValueKeys.add(key);
                    else nextMultiValueKeys.delete(key);
                }
                for (const key of removedKeyList) {
                    nextMultiValueKeys.delete(key);
                }
                setBatchMultiValueKeys(nextMultiValueKeys);

                setEditedFields({});
                setRemovedKeys(new Set());
                setArtworkOp(null);
            } finally {
                setLoadProgress(null);
                setIsSaving(false);
            }
        },
        [
            artworkOp,
            batchMultiValueKeys,
            browser,
            editScope,
            editedFields,
            fileArtwork,
            fileTags,
            removedKeys,
            server,
            songsInScope,
            t,
            triggerRescan,
            utils,
        ],
    );

    /** Tags not yet present in `displayFields`: known tags plus configured custom tags. */
    const availableToAdd = useMemo(() => {
        const options = new Map<string, { label: string; value: string }>();

        for (const tag of KNOWN_TAGS) {
            if (tag.key in displayFields) continue;
            options.set(tag.key, { label: tag.tagName, value: tag.key });
        }

        for (const key of Object.keys(tagConfigs)) {
            if (key in displayFields || options.has(key)) continue;
            options.set(key, {
                label: KNOWN_TAG_MAP.get(key)?.tagName ?? key,
                value: key,
            });
        }

        return [...options.values()].sort((a, b) => a.label.localeCompare(b.label));
    }, [displayFields, tagConfigs]);

    const artworkIsMixed = artworkOp === null && loadedArtworkKind === 'mixed';
    const showRemoveArtworkButton =
        artworkOp?.type !== 'clear' && (artworkOp?.type === 'set' || loadedArtworkKind !== 'none');

    const mixedPlaceholder = t('page.itemDetail.multipleValues', '(Multiple Values)');

    const getTagConfig = useCallback(
        (key: string) =>
            tagConfigs[key] ?? {
                autocompleteSource: 'none' as const,
                customValues: [] as string[],
                multiValue: false,
            },
        [tagConfigs],
    );

    const hasTagConfig = useCallback((key: string) => key in tagConfigs, [tagConfigs]);

    return {
        applyArtworkBytes,
        artworkDisplayUrl,
        artworkIsMixed,
        availableToAdd,
        editedFields,
        editScope,
        error,
        getFieldMeta,
        getTagConfig,
        handleAddField,
        handleChangeArtwork,
        handleFieldChange,
        handleRemoveArtwork,
        handleRemoveField,
        handleResetField,
        handleRevertField,
        handleSave,
        hasTagConfig,
        isFileNotFound,
        isLoading,
        isSaving,
        loadProgress,
        mixedKeys,
        mixedPlaceholder,
        multiValueKeys,
        readWarning,
        reload,
        removedKeys,
        rescan: triggerRescan,
        resolvedSongs,
        setEditScope,
        setRescan,
        showRemoveArtworkButton,
        sortedFieldEntries,
    };
};
