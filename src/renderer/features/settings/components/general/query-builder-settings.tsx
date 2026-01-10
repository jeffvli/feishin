import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import {
    SettingOption,
    SettingsSection,
} from '/@/renderer/features/settings/components/settings-section';
import { useQueryBuilderSettings, useSettingsStoreActions } from '/@/renderer/store/settings.store';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Button } from '/@/shared/components/button/button';
import { Group } from '/@/shared/components/group/group';
import { Select } from '/@/shared/components/select/select';
import { Stack } from '/@/shared/components/stack/stack';
import { TextInput } from '/@/shared/components/text-input/text-input';

const QUERY_VALUE_INPUT_TYPES = [
    { label: 'Boolean', value: 'boolean' },
    { label: 'Date', value: 'date' },
    { label: 'Date Range', value: 'dateRange' },
    { label: 'Number', value: 'number' },
    { label: 'Playlist', value: 'playlist' },
    { label: 'String', value: 'string' },
] as const;

export const QueryBuilderSettings = memo(() => {
    const { t } = useTranslation();
    const queryBuilder = useQueryBuilderSettings();
    const { setSettings } = useSettingsStoreActions();

    const handleAddCustomField = () => {
        setSettings({
            queryBuilder: {
                tag: [
                    ...queryBuilder.tag,
                    {
                        label: '',
                        type: 'string',
                        value: '',
                    },
                ],
            },
        });
    };

    const handleRemoveCustomField = (index: number) => {
        setSettings({
            queryBuilder: {
                tag: queryBuilder.tag.filter((_, i) => i !== index),
            },
        });
    };

    const handleUpdateCustomField = (
        index: number,
        field: 'label' | 'type' | 'value',
        newValue: string,
    ) => {
        setSettings({
            queryBuilder: {
                tag: queryBuilder.tag.map((item, i) =>
                    i === index ? { ...item, [field]: newValue } : item,
                ),
            },
        });
    };

    const customFieldsOptions: SettingOption[] = [
        {
            control: (
                <Stack gap="md">
                    {queryBuilder.tag.length > 0 && (
                        <Stack gap="sm">
                            {queryBuilder.tag.map((field, index) => (
                                <Group gap="sm" key={index}>
                                    <TextInput
                                        onChange={(e) =>
                                            handleUpdateCustomField(
                                                index,
                                                'label',
                                                e.currentTarget.value,
                                            )
                                        }
                                        placeholder={t(
                                            'setting.queryBuilderCustomFields_inputLabel',
                                            {
                                                postProcess: 'sentenceCase',
                                            },
                                        )}
                                        value={field.label}
                                        width="30%"
                                    />
                                    <Select
                                        data={QUERY_VALUE_INPUT_TYPES}
                                        onChange={(e) =>
                                            handleUpdateCustomField(index, 'type', e || 'string')
                                        }
                                        value={field.type}
                                        width="25%"
                                    />
                                    <TextInput
                                        onChange={(e) =>
                                            handleUpdateCustomField(
                                                index,
                                                'value',
                                                e.currentTarget.value,
                                            )
                                        }
                                        placeholder={t(
                                            'setting.queryBuilderCustomFields_inputTag',
                                            {
                                                postProcess: 'sentenceCase',
                                            },
                                        )}
                                        value={field.value}
                                        width="30%"
                                    />
                                    <ActionIcon
                                        icon="remove"
                                        onClick={() => handleRemoveCustomField(index)}
                                        size="sm"
                                        variant="subtle"
                                    />
                                </Group>
                            ))}
                        </Stack>
                    )}
                    <Group grow>
                        <Button onClick={handleAddCustomField} variant="filled">
                            {t('common.add', { postProcess: 'titleCase' })}
                        </Button>
                    </Group>
                </Stack>
            ),
            description: t('setting.queryBuilderCustomFields', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            title: t('setting.queryBuilderCustomFields', {
                postProcess: 'sentenceCase',
            }),
        },
    ];

    return (
        <SettingsSection
            options={customFieldsOptions}
            title={t('page.setting.queryBuilder', {
                postProcess: 'sentenceCase',
            })}
        />
    );
});
