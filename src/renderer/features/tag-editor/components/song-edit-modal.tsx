import { closeAllModals } from '@mantine/modals';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { EDIT_SCOPE_ALL, useMetadataEditor } from '../hooks/use-metadata-editor';
import { AddFieldInput } from './add-field-input';
import { ArtworkPanel } from './artwork-panel';
import styles from './song-edit-modal.module.css';
import { TagEditorSettings } from './tag-editor-settings';
import { TagFieldRow } from './tag-field-row';

import { ItemImage } from '/@/renderer/components/item-image/item-image';
import { PathSettings } from '/@/renderer/features/settings/components/general/path-settings';
import { Button } from '/@/shared/components/button/button';
import { Checkbox } from '/@/shared/components/checkbox/checkbox';
import { Group } from '/@/shared/components/group/group';
import { ScrollArea } from '/@/shared/components/scroll-area/scroll-area';
import { Select } from '/@/shared/components/select/select';
import { Spinner } from '/@/shared/components/spinner/spinner';
import { Stack } from '/@/shared/components/stack/stack';
import { Table } from '/@/shared/components/table/table';
import { Tabs } from '/@/shared/components/tabs/tabs';
import { Text } from '/@/shared/components/text/text';
import { LibraryItem, Song } from '/@/shared/types/domain-types';

export const SongEditModal = ({ songs }: { songs: Song[] }) => {
    const { t } = useTranslation();
    const tableContainerRef = useRef<HTMLDivElement>(null);

    const editor = useMetadataEditor({
        browser: window.api.browser,
        songs,
        utils: window.api.utils,
    });

    const [tab, setTab] = useState<'artwork' | 'settings' | 'tags'>('tags');

    const songsById = useMemo(
        () => new Map(editor.resolvedSongs.map((song) => [song.id, song])),
        [editor.resolvedSongs],
    );

    const scopeOptions = useMemo(
        () => [
            {
                label: t('common.countSelected', {
                    count: editor.resolvedSongs.length,
                }),
                value: EDIT_SCOPE_ALL,
            },
            ...editor.resolvedSongs.map((song) => ({
                label: song.name,
                value: song.id,
            })),
        ],
        [editor.resolvedSongs, t],
    );

    const renderScopeOption = useCallback(
        ({ option }: { option: { label: string; value: string } }) => {
            if (option.value === EDIT_SCOPE_ALL) {
                return (
                    <Text className={styles.scopeOptionLabel} fw={500}>
                        {option.label}
                    </Text>
                );
            }

            const song = songsById.get(option.value);
            if (!song) {
                return option.label;
            }

            return (
                <Group className={styles.scopeOption} gap="sm" wrap="nowrap">
                    <ItemImage
                        containerClassName={styles.scopeOptionImage}
                        enableViewport={false}
                        explicitStatus={song.explicitStatus}
                        id={song.imageId}
                        itemType={LibraryItem.SONG}
                        serverId={song._serverId}
                        src={song.imageUrl}
                        type="table"
                    />
                    <Stack className={styles.scopeOptionMeta} gap={2}>
                        <Text fw={500} lineClamp={1}>
                            {song.name || '—'}
                        </Text>
                        <Text c="dimmed" lineClamp={1} size="sm">
                            {song.artistName || '—'}
                        </Text>
                        <Text c="dimmed" lineClamp={1} size="sm">
                            {song.album || '—'}
                        </Text>
                    </Stack>
                </Group>
            );
        },
        [songsById],
    );

    const handleAddField = (key: string) => {
        editor.handleAddField(key);
        requestAnimationFrame(() => {
            const row = tableContainerRef.current?.querySelector<HTMLElement>(
                `[data-field-key="${key}"]`,
            );
            row?.scrollIntoView({ block: 'nearest' });
            row?.querySelector<HTMLElement>('input, textarea')?.focus();
        });
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
                {editor.isFileNotFound && (
                    <>
                        <PathSettings persistImmediately previewPath={songs[0]?.path} />
                        <Group justify="flex-end">
                            <Button onClick={editor.reload} variant="filled">
                                {t('common.reload', 'Reload')}
                            </Button>
                        </Group>
                    </>
                )}
            </Stack>
        );
    }

    return (
        <Stack gap="xs">
            {editor.resolvedSongs.length > 1 ? (
                <Select
                    allowDeselect={false}
                    classNames={{
                        option: styles.scopeSelectOption,
                    }}
                    data={scopeOptions}
                    onChange={(value) => {
                        if (value) editor.setEditScope(value);
                    }}
                    renderOption={renderScopeOption}
                    searchable
                    value={editor.editScope}
                />
            ) : null}
            <Tabs
                keepMounted={false}
                onChange={(value) => setTab(value as 'artwork' | 'settings' | 'tags')}
                value={tab}
            >
                <Tabs.List>
                    <Tabs.Tab value="tags">{t('page.itemDetail.tagsTab', 'Tags')}</Tabs.Tab>
                    <Tabs.Tab value="artwork">
                        {t('page.itemDetail.artworkTab', 'Artwork')}
                    </Tabs.Tab>
                    <Tabs.Tab ml="auto" value="settings">
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
                        <AddFieldInput
                            availableFields={editor.availableToAdd}
                            existingFieldKeys={editor.sortedFieldEntries.map(([key]) => key)}
                            onAddField={handleAddField}
                        />
                        <ScrollArea className={styles.tableScroller} ref={tableContainerRef}>
                            <Table
                                classNames={{
                                    table: styles.table,
                                    td: styles.tableCell,
                                    th: styles.tableHeader,
                                }}
                                highlightOnHover={false}
                                withRowBorders
                            >
                                <Table.Tbody>
                                    {editor.sortedFieldEntries.map(([key, value]) => {
                                        const tagConfig = editor.getTagConfig(key);
                                        return (
                                            <TagFieldRow
                                                autocompleteSource={tagConfig.autocompleteSource}
                                                customValues={tagConfig.customValues}
                                                hasTagConfig={editor.hasTagConfig(key)}
                                                isDirty={
                                                    key in editor.editedFields ||
                                                    editor.removedKeys.has(key)
                                                }
                                                isMixed={editor.mixedKeys.has(key)}
                                                isMultiValue={
                                                    editor.multiValueKeys.has(key) ||
                                                    Array.isArray(value)
                                                }
                                                isRemoved={editor.removedKeys.has(key)}
                                                key={key}
                                                meta={editor.getFieldMeta(key)}
                                                mixedPlaceholder={
                                                    editor.mixedKeys.has(key)
                                                        ? editor.mixedPlaceholder
                                                        : undefined
                                                }
                                                onChange={(v) => editor.handleFieldChange(key, v)}
                                                onRemove={() => editor.handleRemoveField(key)}
                                                onReset={() => editor.handleResetField(key)}
                                                onRevert={() => editor.handleRevertField(key)}
                                                tagKey={key}
                                                value={value}
                                            />
                                        );
                                    })}
                                </Table.Tbody>
                            </Table>
                        </ScrollArea>
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

            {tab !== 'settings' && (
                <>
                    <Checkbox
                        checked={editor.rescan}
                        label={t('page.itemDetail.triggerRescan')}
                        onChange={(e) => editor.setRescan(e.currentTarget.checked)}
                    />

                    <Group justify="flex-end">
                        <Button
                            disabled={editor.isSaving}
                            onClick={() => closeAllModals()}
                            variant="subtle"
                        >
                            {t('common.cancel', 'Cancel')}
                        </Button>
                        <Button
                            disabled={editor.isSaving}
                            loading={editor.isSaving}
                            onClick={() => editor.handleSave({ close: false })}
                            variant="default"
                        >
                            {editor.isSaving && editor.loadProgress && editor.loadProgress.total > 1
                                ? `${t('common.save', 'Save')} (${editor.loadProgress.processed}/${editor.loadProgress.total})`
                                : t('common.save', 'Save')}
                        </Button>
                        <Button
                            loading={editor.isSaving}
                            onClick={() => editor.handleSave({ close: true })}
                            variant="filled"
                        >
                            {editor.isSaving && editor.loadProgress && editor.loadProgress.total > 1
                                ? `${t('common.saveAndClose', 'Save and close')} (${editor.loadProgress.processed}/${editor.loadProgress.total})`
                                : t('common.saveAndClose', 'Save and close')}
                        </Button>
                    </Group>
                </>
            )}
        </Stack>
    );
};
