import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RiAddLine, RiCloseLine } from 'react-icons/ri';

import { KNOWN_TAG_MAP, KNOWN_TAGS, resolveTagKey } from '../utils/known-tags';

import { sharedQueries } from '/@/renderer/features/shared/api/shared-api';
import {
    type TagAutocompleteSource,
    type TagConfig,
    toServerTagAutocompleteSource,
    useCurrentServerId,
    useSettingsStore,
    useSettingsStoreActions,
    useTagEditorSettings,
} from '/@/renderer/store';
import { titleCase } from '/@/renderer/utils';
import { NDSongQueryFieldsLabelMap } from '/@/shared/api/navidrome/navidrome-types';
import { Accordion } from '/@/shared/components/accordion/accordion';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Autocomplete } from '/@/shared/components/autocomplete/autocomplete';
import { Group } from '/@/shared/components/group/group';
import { SegmentedControl } from '/@/shared/components/segmented-control/segmented-control';
import { Select } from '/@/shared/components/select/select';
import { Stack } from '/@/shared/components/stack/stack';
import { TagsInput } from '/@/shared/components/tags-input/tags-input';
import { Text } from '/@/shared/components/text/text';
import { LibraryItem } from '/@/shared/types/domain-types';

const DEFAULT_TAG_CONFIG: TagConfig = {
    autocompleteSource: 'none',
    customValues: [],
    multiValue: false,
};

export const TagEditorSettings = () => {
    const { t } = useTranslation();
    const serverId = useCurrentServerId();
    const { tagConfigs } = useTagEditorSettings();
    const { setSettings } = useSettingsStoreActions();
    const [input, setInput] = useState('');

    const tagsQuery = useQuery({
        ...sharedQueries.tagList({
            options: {
                gcTime: 1000 * 60 * 60,
                staleTime: 1000 * 60 * 60,
            },
            query: { type: LibraryItem.SONG },
            serverId,
        }),
        enabled: Boolean(serverId),
    });

    const configuredKeys = Object.keys(tagConfigs).sort((a, b) => {
        const labelA = KNOWN_TAG_MAP.get(a)?.tagName ?? a;
        const labelB = KNOWN_TAG_MAP.get(b)?.tagName ?? b;
        return labelA.localeCompare(labelB);
    });

    const updateTagConfig = (key: string, patch: Partial<TagConfig>) => {
        const nextPatch =
            patch.customValues !== undefined
                ? {
                      ...patch,
                      customValues: [...patch.customValues].sort((a, b) => a.localeCompare(b)),
                  }
                : patch;

        setSettings({
            tagEditor: {
                tagConfigs: {
                    [key]: {
                        ...DEFAULT_TAG_CONFIG,
                        ...tagConfigs[key],
                        ...nextPatch,
                    },
                },
            },
        });
    };

    const setTagConfigs = (next: Record<string, TagConfig>) => {
        useSettingsStore.setState((state) => {
            state.tagEditor.tagConfigs = next;
        });
    };

    const addField = (value: string) => {
        const trimmed = value.trim();
        if (!trimmed) return;

        const key = resolveTagKey(trimmed);
        if (key === 'lyrics' || key in tagConfigs) {
            setInput('');
            return;
        }

        updateTagConfig(key, DEFAULT_TAG_CONFIG);
        setInput('');
    };

    const removeField = (key: string) => {
        const rest = { ...tagConfigs };
        delete rest[key];
        setTagConfigs(rest);
    };

    const availableFields = KNOWN_TAGS.filter(({ key }) => key !== 'lyrics' && !(key in tagConfigs))
        .map(({ key, tagName }) => ({ label: tagName, value: key }))
        .sort((a, b) => a.label.localeCompare(b.label));

    const autocompleteSourceOptions = useMemo(() => {
        const excluded = new Set(tagsQuery.data?.excluded.song ?? []);
        const serverTagOptions =
            tagsQuery.data?.tags
                ?.filter((tag) => !excluded.has(tag.name))
                .map((tag) => ({
                    label: NDSongQueryFieldsLabelMap[tag.name] ?? titleCase(tag.name),
                    value: toServerTagAutocompleteSource(tag.name),
                }))
                .sort((a, b) => a.label.localeCompare(b.label)) ?? [];

        return [
            { label: t('common.none', 'None'), value: 'none' },
            {
                label: t('entity.artist_other'),
                value: 'serverArtists',
            },
            {
                label: t('entity.genre_other', 'Genres'),
                value: 'serverGenres',
            },
            ...serverTagOptions,
        ];
    }, [t, tagsQuery.data?.excluded.song, tagsQuery.data?.tags]);

    const multiValueToggleData = [
        {
            label: t('common.filter_single'),
            value: 'single',
        },
        {
            label: t('common.filter_multiple'),
            value: 'multi',
        },
    ];

    return (
        <Stack gap="xs">
            <Text fw={500} size="md">
                {t('page.itemDetail.tagConfiguration', 'Tag configuration')}
            </Text>
            <Group>
                <Autocomplete
                    data={availableFields}
                    flex={1}
                    onChange={setInput}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                            event.preventDefault();
                            addField(input);
                        }
                    }}
                    onOptionSubmit={addField}
                    placeholder={t('page.itemDetail.addTagConfig', 'Add tag…')}
                    py="md"
                    value={input}
                />
                <ActionIcon onClick={() => addField(input)} variant="filled">
                    <RiAddLine size={16} />
                </ActionIcon>
            </Group>
            {configuredKeys.length > 0 && (
                <Accordion multiple variant="separated">
                    {configuredKeys.map((key) => {
                        const tagName = KNOWN_TAG_MAP.get(key)?.tagName ?? key;
                        const config = tagConfigs[key];
                        return (
                            <Accordion.Item key={key} value={key}>
                                <Accordion.Control
                                    component="div"
                                    role="button"
                                    style={{ userSelect: 'none' }}
                                >
                                    <Group justify="space-between" wrap="nowrap">
                                        <Text>{tagName}</Text>
                                        <Group
                                            gap="xs"
                                            onClick={(event) => event.stopPropagation()}
                                            wrap="nowrap"
                                        >
                                            <SegmentedControl
                                                data={multiValueToggleData}
                                                onChange={(value) =>
                                                    updateTagConfig(key, {
                                                        multiValue: value === 'multi',
                                                    })
                                                }
                                                size="xs"
                                                value={config.multiValue ? 'multi' : 'single'}
                                            />
                                            <ActionIcon
                                                aria-label={t('common.remove', 'Remove')}
                                                onClick={() => removeField(key)}
                                                variant="subtle"
                                            >
                                                <RiCloseLine size={16} />
                                            </ActionIcon>
                                        </Group>
                                    </Group>
                                </Accordion.Control>
                                <Accordion.Panel>
                                    <Stack gap="xs">
                                        <Select
                                            data={autocompleteSourceOptions}
                                            label={t('page.itemDetail.autocompleteSource')}
                                            onChange={(value) => {
                                                if (!value) return;
                                                updateTagConfig(key, {
                                                    autocompleteSource:
                                                        value as TagAutocompleteSource,
                                                });
                                            }}
                                            searchable
                                            value={config.autocompleteSource}
                                        />
                                        <TagsInput
                                            aria-label={`${t('page.itemDetail.customValues', 'Custom values')} - ${tagName}`}
                                            onChange={(values) =>
                                                updateTagConfig(key, { customValues: values })
                                            }
                                            placeholder={t(
                                                'page.itemDetail.addCustomValue',
                                                'Add custom value…',
                                            )}
                                            splitChars={[]}
                                            value={[...config.customValues].sort((a, b) =>
                                                a.localeCompare(b),
                                            )}
                                        />
                                    </Stack>
                                </Accordion.Panel>
                            </Accordion.Item>
                        );
                    })}
                </Accordion>
            )}
        </Stack>
    );
};
