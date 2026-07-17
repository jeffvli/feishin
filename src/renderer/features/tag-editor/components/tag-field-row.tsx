import type { TagValue } from '/@/shared/types/tag-editor';

import clsx from 'clsx';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { KnownTag } from '../utils/known-tags';

import { useTagAutocompleteSuggestions } from '../hooks/use-tag-autocomplete-suggestions';
import styles from './tag-field-row.module.css';

import { type TagAutocompleteSource } from '/@/renderer/store';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Autocomplete } from '/@/shared/components/autocomplete/autocomplete';
import { Checkbox } from '/@/shared/components/checkbox/checkbox';
import { NumberInput } from '/@/shared/components/number-input/number-input';
import { Table } from '/@/shared/components/table/table';
import { TagsInput } from '/@/shared/components/tags-input/tags-input';
import { TextInput } from '/@/shared/components/text-input/text-input';
import { Textarea } from '/@/shared/components/textarea/textarea';

interface CustomTagsInputProps {
    autocompleteSource: TagAutocompleteSource;
    customValues: string[];
    disabled: boolean;
    mixedPlaceholder?: string;
    onAddCustom: (value: string) => void;
    onChange: (value: string[]) => void;
    value: string[];
}

interface StringAutocompleteInputProps {
    autocompleteSource: TagAutocompleteSource;
    customValues: string[];
    disabled: boolean;
    mixedPlaceholder?: string;
    onAddCustom: (value: string) => void;
    onChange: (value: string) => void;
    value: string;
}

interface TagFieldRowProps {
    autocompleteSource: TagAutocompleteSource;
    customValues: string[];
    hasTagConfig: boolean;
    isDirty?: boolean;
    isMixed: boolean;
    isMultiValue: boolean;
    isRemoved: boolean;
    meta: KnownTag;
    mixedPlaceholder?: string;
    onAddCustom: (value: string) => void;
    onChange: (value: TagValue) => void;
    onRemove: () => void;
    onReset: () => void;
    onRevert: () => void;
    tagKey: string;
    value: TagValue;
}

const ADD_CUSTOM_PREFIX = '__feishin_add_custom__:';

const useSuggestionData = (
    autocompleteSource: TagAutocompleteSource,
    customValues: string[],
    searchValue: string,
) => {
    const { t } = useTranslation();
    const { groups, isLoading } = useTagAutocompleteSuggestions({
        customValues,
        search: searchValue,
        source: autocompleteSource,
    });
    const candidate = searchValue.trim();
    const canAddCustom =
        candidate.length > 0 &&
        !customValues.some((value) => value.toLowerCase() === candidate.toLowerCase());

    const data = useMemo(() => {
        const nextData: { group: string; items: (string | { label: string; value: string })[] }[] =
            groups.map((group) => ({
                group: group.group,
                items: [...group.items],
            }));

        if (canAddCustom) {
            const addOption = {
                label: t('page.itemDetail.addCustomValueOption', {
                    defaultValue: `Add "{{value}}" as a custom value…`,
                    value: candidate,
                }),
                value: `${ADD_CUSTOM_PREFIX}${candidate}`,
            };
            const customGroupLabel = t('page.itemDetail.customValues', 'Custom values');
            const existingCustomGroup = nextData.find((group) => group.group === customGroupLabel);
            if (existingCustomGroup) {
                existingCustomGroup.items.push(addOption);
            } else {
                nextData.unshift({
                    group: customGroupLabel,
                    items: [addOption],
                });
            }
        }

        return nextData;
    }, [canAddCustom, candidate, groups, t]);

    return { data, isLoading };
};

const CustomTagsInput = ({
    autocompleteSource,
    customValues,
    disabled,
    mixedPlaceholder,
    onAddCustom,
    onChange,
    value,
}: CustomTagsInputProps) => {
    const [searchValue, setSearchValue] = useState('');
    const { data, isLoading } = useSuggestionData(autocompleteSource, customValues, searchValue);

    return (
        <TagsInput
            clearable
            data={data}
            disabled={disabled}
            loading={isLoading}
            onChange={(values) => {
                const normalizedValues = values.map((item) =>
                    item.startsWith(ADD_CUSTOM_PREFIX)
                        ? item.slice(ADD_CUSTOM_PREFIX.length)
                        : item,
                );
                onChange(
                    normalizedValues.filter(
                        (item, index) =>
                            normalizedValues.findIndex(
                                (other) => other.toLowerCase() === item.toLowerCase(),
                            ) === index,
                    ),
                );
            }}
            onOptionSubmit={(submittedValue) => {
                if (submittedValue.startsWith(ADD_CUSTOM_PREFIX))
                    onAddCustom(submittedValue.slice(ADD_CUSTOM_PREFIX.length));
            }}
            onSearchChange={setSearchValue}
            placeholder={mixedPlaceholder}
            searchValue={searchValue}
            size="sm"
            splitChars={[]}
            value={value}
        />
    );
};

const StringAutocompleteInput = ({
    autocompleteSource,
    customValues,
    disabled,
    mixedPlaceholder,
    onAddCustom,
    onChange,
    value,
}: StringAutocompleteInputProps) => {
    const { data, isLoading } = useSuggestionData(autocompleteSource, customValues, value);

    return (
        <Autocomplete
            data={data}
            disabled={disabled}
            limit={100}
            loading={isLoading}
            onChange={(next) => {
                if (next.startsWith(ADD_CUSTOM_PREFIX)) {
                    const custom = next.slice(ADD_CUSTOM_PREFIX.length);
                    onAddCustom(custom);
                    onChange(custom);
                    return;
                }
                onChange(next);
            }}
            placeholder={mixedPlaceholder}
            size="sm"
            value={value}
        />
    );
};

export const TagFieldRow = ({
    autocompleteSource,
    customValues,
    hasTagConfig,
    isDirty,
    isMixed,
    isMultiValue,
    isRemoved,
    meta,
    mixedPlaceholder,
    onAddCustom,
    onChange,
    onRemove,
    onReset,
    onRevert,
    tagKey,
    value,
}: TagFieldRowProps) => {
    const { t } = useTranslation();
    const stringValue = Array.isArray(value) ? value.join('; ') : value;
    const useStringAutocomplete =
        !isMultiValue && meta.type === 'string' && tagKey !== 'lyrics' && hasTagConfig;

    return (
        <Table.Tr
            className={clsx({
                [styles.removedRow]: isRemoved,
            })}
            data-field-key={tagKey}
            key={tagKey}
        >
            <Table.Th className={clsx({ [styles.dirtyLabel]: isDirty })}>{meta.tagName}</Table.Th>
            <Table.Td>
                {isMultiValue && tagKey !== 'lyrics' ? (
                    <CustomTagsInput
                        autocompleteSource={autocompleteSource}
                        customValues={customValues}
                        disabled={isRemoved}
                        mixedPlaceholder={mixedPlaceholder}
                        onAddCustom={onAddCustom}
                        onChange={onChange}
                        value={Array.isArray(value) ? value : value ? [value] : []}
                    />
                ) : meta.type === 'textarea' ? (
                    <Textarea
                        autosize
                        disabled={isRemoved}
                        maxRows={6}
                        minRows={2}
                        onChange={(e) => onChange(e.currentTarget.value)}
                        placeholder={mixedPlaceholder}
                        size="sm"
                        value={Array.isArray(value) ? value.join('\n\n') : value}
                    />
                ) : meta.type === 'number' ? (
                    <NumberInput
                        disabled={isRemoved}
                        onChange={(v) => onChange(v === undefined ? '' : String(v))}
                        placeholder={mixedPlaceholder}
                        size="sm"
                        value={
                            isMixed || value === '' || Array.isArray(value)
                                ? undefined
                                : Number(value)
                        }
                    />
                ) : meta.type === 'boolean' ? (
                    <Checkbox
                        checked={!isMixed && value === '1'}
                        disabled={isRemoved}
                        indeterminate={isMixed}
                        onChange={(e) => onChange(e.currentTarget.checked ? '1' : '0')}
                        size="sm"
                    />
                ) : useStringAutocomplete ? (
                    <StringAutocompleteInput
                        autocompleteSource={autocompleteSource}
                        customValues={customValues}
                        disabled={isRemoved}
                        mixedPlaceholder={mixedPlaceholder}
                        onAddCustom={onAddCustom}
                        onChange={onChange}
                        value={stringValue}
                    />
                ) : (
                    <TextInput
                        disabled={isRemoved}
                        onChange={(e) => onChange(e.currentTarget.value)}
                        placeholder={mixedPlaceholder}
                        size="sm"
                        value={stringValue}
                    />
                )}
            </Table.Td>
            <Table.Td className={styles.removeCell}>
                <ActionIcon
                    aria-label={isRemoved || isDirty ? t('common.undo') : t('common.delete')}
                    className={clsx(styles.removeButton, {
                        [styles.removeButtonVisible]: isRemoved || isDirty,
                    })}
                    icon={isRemoved || isDirty ? 'undo' : 'x'}
                    iconProps={{
                        color: isRemoved || isDirty ? 'default' : 'error',
                        size: 'lg',
                    }}
                    onClick={isRemoved ? onReset : isDirty ? onRevert : onRemove}
                    size="sm"
                    tooltip={{
                        label: isRemoved || isDirty ? t('common.undo') : t('common.delete'),
                        openDelay: 0,
                    }}
                    variant="subtle"
                />
            </Table.Td>
        </Table.Tr>
    );
};
