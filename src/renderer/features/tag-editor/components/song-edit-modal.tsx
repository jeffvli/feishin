import { Autocomplete } from '@mantine/core';
import { closeAllModals } from '@mantine/modals';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RiAddLine } from 'react-icons/ri';

import { useMetadataEditor } from '../hooks/use-metadata-editor';
import { KNOWN_TAG_MAP, resolveTagKey } from '../utils/known-tags';
import { ArtworkPanel } from './artwork-panel';
import styles from './song-edit-modal.module.css';
import { TagEditorSettings } from './tag-editor-settings';
import { TagFieldRow } from './tag-field-row';

import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Button } from '/@/shared/components/button/button';
import { Checkbox } from '/@/shared/components/checkbox/checkbox';
import { Group } from '/@/shared/components/group/group';
import { Spinner } from '/@/shared/components/spinner/spinner';
import { Stack } from '/@/shared/components/stack/stack';
import { Table } from '/@/shared/components/table/table';
import { Tabs } from '/@/shared/components/tabs/tabs';
import { Text } from '/@/shared/components/text/text';
import { Song } from '/@/shared/types/domain-types';

export const SongEditModal = ({ songs }: { songs: Song[] }) => {
    const { t } = useTranslation();
    const tableContainerRef = useRef<HTMLDivElement>(null);
    const skipNextEnterRef = useRef(false);
    const skipNextOnChangeResetRef = useRef(false);
    const [addFieldInput, setAddFieldInput] = useState('');
    const [duplicateAttempted, setDuplicateAttempted] = useState(false);

    const editor = useMetadataEditor({
        browser: window.api.browser,
        songs,
        utils: window.api.utils,
    });

    const trimmedInput = addFieldInput.trim();
    const customKeyError =
        trimmedInput && !KNOWN_TAG_MAP.has(trimmedInput)
            ? trimmedInput.includes('=')
                ? "Tag key cannot contain '='"
                : // eslint-disable-next-line no-control-regex
                  /[^\x00-\x7F]/.test(trimmedInput)
                  ? 'Tag key must use ASCII characters only'
                  : null
            : null;

    const resolvedInputKey = trimmedInput ? resolveTagKey(trimmedInput) : '';
    const duplicateError =
        trimmedInput &&
        !customKeyError &&
        editor.sortedFieldEntries.some(([k]) => k === resolvedInputKey)
            ? 'Field already exists'
            : null;
    const fieldError = customKeyError ?? (duplicateAttempted ? duplicateError : null);

    const handleAddField = (key: string): boolean => {
        const trimmed = key.trim();
        if (!trimmed) return false;
        if (
            !KNOWN_TAG_MAP.has(trimmed) &&
            (trimmed.includes('=') || // eslint-disable-next-line no-control-regex
                /[^\x00-\x7F]/.test(trimmed))
        )
            return false;
        const normalizedKey = resolveTagKey(trimmed);
        if (editor.sortedFieldEntries.some(([k]) => k === normalizedKey)) {
            setDuplicateAttempted(true);
            return false;
        }
        setDuplicateAttempted(false);
        editor.handleAddField(normalizedKey);
        setAddFieldInput('');

        requestAnimationFrame(() => {
            const row = tableContainerRef.current?.querySelector<HTMLElement>(
                `[data-field-key="${normalizedKey}"]`,
            );
            row?.scrollIntoView({ block: 'nearest' });
            row?.querySelector<HTMLElement>('input, textarea')?.focus();
        });
        return true;
    };

    // While loading, shows a spinner
    if (editor.isLoading) {
        return (
            <Stack align="center" gap="xs" p="xl">
                <Spinner />
                {editor.loadProgress && editor.loadProgress.total > 1 && (
                    <Text c="dimmed" size="sm">
                        {editor.loadProgress.processed} / {editor.loadProgress.total}
                    </Text>
                )}
            </Stack>
        );
    }

    // If there was an error loading the metadata, shows the error message
    if (editor.error) {
        return (
            <Stack p="md">
                <Text c="red">{editor.error}</Text>
            </Stack>
        );
    }

    return (
        <Stack gap="xs">
            <Tabs defaultValue="tags" keepMounted={false}>
                <Tabs.List>
                    <Tabs.Tab className={styles.tabLabel} value="tags">
                        {t('page.itemDetail.tagsTab', 'Tags')}
                    </Tabs.Tab>
                    <Tabs.Tab className={styles.tabLabel} value="artwork">
                        {t('page.itemDetail.artworkTab', 'Artwork')}
                    </Tabs.Tab>
                    <Tabs.Tab className={styles.tabLabel} value="settings">
                        {t('common.settings', 'Settings')}
                    </Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="tags">
                    <Stack gap="xs" pt="xs">
                        {editor.readWarning && (
                            <Text c="orange" size="sm">
                                {editor.readWarning}
                            </Text>
                        )}
                        <Autocomplete
                            data={editor.availableToAdd}
                            error={fieldError}
                            onChange={(v) => {
                                setAddFieldInput(v);
                                if (skipNextOnChangeResetRef.current) {
                                    skipNextOnChangeResetRef.current = false;
                                } else {
                                    setDuplicateAttempted(false);
                                }
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    if (skipNextEnterRef.current) {
                                        skipNextEnterRef.current = false;
                                        return;
                                    }
                                    handleAddField(addFieldInput);
                                }
                            }}
                            onOptionSubmit={(value) => {
                                skipNextEnterRef.current = true;
                                skipNextOnChangeResetRef.current = true;
                                const added = handleAddField(value);
                                if (added) {
                                    queueMicrotask(() => setAddFieldInput(''));
                                }
                            }}
                            placeholder={t('page.itemDetail.addField', 'Add field…')}
                            rightSection={
                                <ActionIcon
                                    disabled={!!fieldError}
                                    onClick={() => handleAddField(addFieldInput)}
                                    variant="filled"
                                >
                                    <RiAddLine size={16} />
                                </ActionIcon>
                            }
                            rightSectionPointerEvents="all"
                            value={addFieldInput}
                        />
                        <div className={styles.tableScroller} ref={tableContainerRef}>
                            <Table
                                classNames={{ td: styles.tableCell, th: styles.tableHeader }}
                                highlightOnHover={false}
                                withRowBorders
                            >
                                <Table.Tbody>
                                    {editor.sortedFieldEntries.map(([key, value]) => (
                                        <TagFieldRow
                                            favoriteValues={editor.favoriteValues[key] ?? []}
                                            isDirty={key in editor.editedFields}
                                            isMixed={editor.mixedKeys.has(key)}
                                            isMultiValue={
                                                editor.multiValueKeys.has(key) ||
                                                Array.isArray(value)
                                            }
                                            key={key}
                                            meta={editor.getFieldMeta(key)}
                                            mixedPlaceholder={
                                                editor.mixedKeys.has(key)
                                                    ? editor.mixedPlaceholder
                                                    : undefined
                                            }
                                            onAddFavorite={(value) =>
                                                editor.handleAddFavoriteValue(key, value)
                                            }
                                            onChange={(v) => editor.handleFieldChange(key, v)}
                                            onRemove={() => editor.handleRemoveField(key)}
                                            tagKey={key}
                                            value={value}
                                        />
                                    ))}
                                </Table.Tbody>
                            </Table>
                        </div>
                    </Stack>
                </Tabs.Panel>

                <Tabs.Panel value="artwork">
                    <ArtworkPanel
                        artworkDisplayUrl={editor.artworkDisplayUrl}
                        artworkIsMixed={editor.artworkIsMixed}
                        multipleArtworksLabel={t(
                            'page.itemDetail.multipleArtworks',
                            'Multiple Artworks',
                        )}
                        noArtworkLabel={t('page.itemDetail.noArtwork', 'No Artwork')}
                        onApplyBytes={editor.applyArtworkBytes}
                        onBrowse={editor.handleChangeArtwork}
                        onRemove={editor.handleRemoveArtwork}
                        removeArtworkLabel={t('page.itemDetail.removeArtwork', 'Remove Artwork')}
                        showRemoveButton={editor.showRemoveArtworkButton}
                    />
                </Tabs.Panel>

                <Tabs.Panel value="settings">
                    <TagEditorSettings />
                </Tabs.Panel>
            </Tabs>

            <Checkbox
                checked={editor.rescan}
                label={t('page.itemDetail.triggerRescan')}
                onChange={(e) => editor.setRescan(e.currentTarget.checked)}
            />

            <Group justify="flex-end">
                <Button onClick={() => closeAllModals()} variant="subtle">
                    {t('common.cancel', 'Cancel')}
                </Button>
                <Button loading={editor.isSaving} onClick={editor.handleSave} variant="filled">
                    {editor.isSaving && editor.loadProgress && editor.loadProgress.total > 1
                        ? `${t('common.save', 'Save')} (${editor.loadProgress.processed}/${editor.loadProgress.total})`
                        : t('common.save', 'Save')}
                </Button>
            </Group>
        </Stack>
    );
};
