import type { TagValue } from '/@/shared/types/tag-editor';

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { KnownTag } from '../utils/known-tags';

import styles from './tag-field-row.module.css';

import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Checkbox } from '/@/shared/components/checkbox/checkbox';
import { NumberInput } from '/@/shared/components/number-input/number-input';
import { Table } from '/@/shared/components/table/table';
import { TagsInput } from '/@/shared/components/tags-input/tags-input';
import { TextInput } from '/@/shared/components/text-input/text-input';
import { Textarea } from '/@/shared/components/textarea/textarea';

interface FavoriteTagsInputProps {
    disabled: boolean;
    favoriteValues: string[];
    mixedPlaceholder?: string;
    onAddFavorite: (value: string) => void;
    onChange: (value: string[]) => void;
    value: string[];
}

interface TagFieldRowProps {
    favoriteValues: string[];
    isDirty?: boolean;
    isMixed: boolean;
    isMultiValue: boolean;
    isRemoved: boolean;
    meta: KnownTag;
    mixedPlaceholder?: string;
    onAddFavorite: (value: string) => void;
    onChange: (value: TagValue) => void;
    onRemove: () => void;
    onReset: () => void;
    onRevert: () => void;
    tagKey: string;
    value: TagValue;
}

const ADD_FAVORITE_PREFIX = '__feishin_add_favorite__:';

const FavoriteTagsInput = ({
    disabled,
    favoriteValues,
    mixedPlaceholder,
    onAddFavorite,
    onChange,
    value,
}: FavoriteTagsInputProps) => {
    const { t } = useTranslation();
    const [searchValue, setSearchValue] = useState('');
    const candidate = searchValue.trim();
    const canAddFavorite =
        candidate.length > 0 &&
        !favoriteValues.some((favorite) => favorite.toLowerCase() === candidate.toLowerCase());
    const data = useMemo(
        () =>
            canAddFavorite
                ? [
                      ...favoriteValues,
                      {
                          label: t('page.itemDetail.addFavoriteValueOption', {
                              value: candidate,
                          }),
                          value: `${ADD_FAVORITE_PREFIX}${candidate}`,
                      },
                  ]
                : favoriteValues,
        [canAddFavorite, candidate, favoriteValues, t],
    );

    return (
        <TagsInput
            clearable
            data={data}
            disabled={disabled}
            onChange={(values) => {
                const normalizedValues = values.map((item) =>
                    item.startsWith(ADD_FAVORITE_PREFIX)
                        ? item.slice(ADD_FAVORITE_PREFIX.length)
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
                if (submittedValue.startsWith(ADD_FAVORITE_PREFIX))
                    onAddFavorite(submittedValue.slice(ADD_FAVORITE_PREFIX.length));
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

export const TagFieldRow = ({
    favoriteValues,
    isDirty,
    isMixed,
    isMultiValue,
    isRemoved,
    meta,
    mixedPlaceholder,
    onAddFavorite,
    onChange,
    onRemove,
    onReset,
    onRevert,
    tagKey,
    value,
}: TagFieldRowProps) => {
    const { t } = useTranslation();

    return (
        <Table.Tr
            className={isRemoved ? styles.removedRow : undefined}
            data-field-key={tagKey}
            key={tagKey}
        >
            <Table.Th className={isDirty ? styles.dirtyLabel : undefined}>{meta.label}</Table.Th>
            <Table.Td>
                {isMultiValue && tagKey !== 'lyrics' ? (
                    <FavoriteTagsInput
                        disabled={isRemoved}
                        favoriteValues={favoriteValues}
                        mixedPlaceholder={mixedPlaceholder}
                        onAddFavorite={onAddFavorite}
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
                ) : (
                    <TextInput
                        disabled={isRemoved}
                        onChange={(e) => onChange(e.currentTarget.value)}
                        placeholder={mixedPlaceholder}
                        size="sm"
                        value={Array.isArray(value) ? value.join('; ') : value}
                    />
                )}
            </Table.Td>
            <Table.Td className={styles.removeCell}>
                <ActionIcon
                    aria-label={isRemoved || isDirty ? t('common.undo') : t('common.delete')}
                    className={styles.removeButton}
                    icon={isRemoved || isDirty ? 'undo' : 'x'}
                    iconProps={{
                        color: isRemoved ? 'error' : 'default',
                        size: 'md',
                    }}
                    onClick={isRemoved ? onReset : isDirty ? onRevert : onRemove}
                    size="sm"
                    tooltip={{
                        label: isRemoved || isDirty ? t('common.undo') : t('common.delete'),
                    }}
                    variant="subtle"
                />
            </Table.Td>
        </Table.Tr>
    );
};
