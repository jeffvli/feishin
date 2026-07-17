import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RiAddLine, RiCloseLine } from 'react-icons/ri';

import { KNOWN_TAG_MAP, KNOWN_TAGS, resolveTagKey } from '../utils/known-tags';

import { useSettingsStoreActions, useTagEditorSettings } from '/@/renderer/store';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Autocomplete } from '/@/shared/components/autocomplete/autocomplete';
import { Fieldset } from '/@/shared/components/fieldset/fieldset';
import { Group } from '/@/shared/components/group/group';
import { Stack } from '/@/shared/components/stack/stack';
import { TagsInput } from '/@/shared/components/tags-input/tags-input';
import { Text } from '/@/shared/components/text/text';

export const TagEditorSettings = () => {
    const { t } = useTranslation();
    const { favoriteValues, multiValueFields } = useTagEditorSettings();
    const { setSettings } = useSettingsStoreActions();
    const [input, setInput] = useState('');

    const updateFields = (fields: string[]) => {
        setSettings({ tagEditor: { multiValueFields: fields } });
    };

    const updateFavoriteValues = (key: string, values: string[]) => {
        setSettings({
            tagEditor: {
                favoriteValues: { ...favoriteValues, [key]: values },
            },
        });
    };

    const addField = (value: string) => {
        const trimmed = value.trim();
        if (!trimmed) return;

        const key = resolveTagKey(trimmed);
        if (key === 'lyrics' || multiValueFields.includes(key)) {
            setInput('');
            return;
        }

        updateFields([...multiValueFields, key]);
        setInput('');
    };

    const availableFields = KNOWN_TAGS.filter(
        ({ key }) => key !== 'lyrics' && !multiValueFields.includes(key),
    )
        .map(({ key, label }) => ({ label, value: key }))
        .sort((a, b) => a.label.localeCompare(b.label));

    return (
        <Stack gap="xs">
            <Text fw={500} size="md">
                {t('page.itemDetail.multiValueFields')}
            </Text>
            <Text isMuted size="sm">
                {t('page.itemDetail.multiValueFieldsDescription')}
            </Text>
            <Autocomplete
                data={availableFields}
                onChange={setInput}
                onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                        event.preventDefault();
                        addField(input);
                    }
                }}
                onOptionSubmit={addField}
                placeholder={t('page.itemDetail.addMultiValueField')}
                py="md"
                rightSection={
                    <ActionIcon onClick={() => addField(input)} variant="filled">
                        <RiAddLine size={16} />
                    </ActionIcon>
                }
                rightSectionPointerEvents="all"
                value={input}
            />
            {multiValueFields.map((key) => {
                const label = KNOWN_TAG_MAP.get(key)?.label ?? key;
                return (
                    <Fieldset key={key}>
                        <Stack gap="xs">
                            <Group justify="space-between" wrap="nowrap">
                                <div>
                                    <Text size="sm">{label}</Text>
                                    <Text ff="monospace" isMuted size="xs">
                                        {key}
                                    </Text>
                                </div>
                                <ActionIcon
                                    aria-label={t('common.remove', 'Remove')}
                                    onClick={() =>
                                        updateFields(
                                            multiValueFields.filter((field) => field !== key),
                                        )
                                    }
                                    variant="subtle"
                                >
                                    <RiCloseLine size={16} />
                                </ActionIcon>
                            </Group>
                            <TagsInput
                                aria-label={`${t('page.itemDetail.favoriteValues')} - ${label}`}
                                onChange={(values) => updateFavoriteValues(key, values)}
                                placeholder={t('page.itemDetail.addFavoriteValue')}
                                splitChars={[]}
                                value={favoriteValues[key] ?? []}
                            />
                        </Stack>
                    </Fieldset>
                );
            })}
        </Stack>
    );
};
