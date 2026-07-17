import type { TagValue } from '/@/shared/types/tag-editor';

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RiCloseLine } from 'react-icons/ri';

import type { KnownTag } from '../utils/known-tags';

import styles from './tag-field-row.module.css';

import { Button } from '/@/shared/components/button/button';
import { Checkbox } from '/@/shared/components/checkbox/checkbox';
import { NumberInput } from '/@/shared/components/number-input/number-input';
import { Table } from '/@/shared/components/table/table';
import { TagsInput } from '/@/shared/components/tags-input/tags-input';
import { TextInput } from '/@/shared/components/text-input/text-input';
import { Textarea } from '/@/shared/components/textarea/textarea';

interface FavoriteTagsInputProps {
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
    meta: KnownTag;
    mixedPlaceholder?: string;
    onAddFavorite: (value: string) => void;
    onChange: (value: TagValue) => void;
    onRemove: () => void;
    tagKey: string;
    value: TagValue;
}

const ADD_FAVORITE_PREFIX = '__feishin_add_favorite__:';

const FavoriteTagsInput = ({
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
    meta,
    mixedPlaceholder,
    onAddFavorite,
    onChange,
    onRemove,
    tagKey,
    value,
}: TagFieldRowProps) => (
    <Table.Tr data-field-key={tagKey} key={tagKey}>
        <Table.Th className={isDirty ? styles.dirtyLabel : undefined}>{meta.label}</Table.Th>
        <Table.Td>
            {isMultiValue && tagKey !== 'lyrics' ? (
                <FavoriteTagsInput
                    favoriteValues={favoriteValues}
                    mixedPlaceholder={mixedPlaceholder}
                    onAddFavorite={onAddFavorite}
                    onChange={onChange}
                    value={Array.isArray(value) ? value : value ? [value] : []}
                />
            ) : meta.type === 'textarea' ? (
                <Textarea
                    autosize
                    maxRows={6}
                    minRows={2}
                    onChange={(e) => onChange(e.currentTarget.value)}
                    placeholder={mixedPlaceholder}
                    size="sm"
                    value={Array.isArray(value) ? value.join('\n\n') : value}
                />
            ) : meta.type === 'number' ? (
                <NumberInput
                    onChange={(v) => onChange(v === undefined ? '' : String(v))}
                    placeholder={mixedPlaceholder}
                    size="sm"
                    value={
                        isMixed || value === '' || Array.isArray(value) ? undefined : Number(value)
                    }
                />
            ) : meta.type === 'boolean' ? (
                <Checkbox
                    checked={!isMixed && value === '1'}
                    indeterminate={isMixed}
                    onChange={(e) => onChange(e.currentTarget.checked ? '1' : '0')}
                    size="sm"
                />
            ) : (
                <TextInput
                    onChange={(e) => onChange(e.currentTarget.value)}
                    placeholder={mixedPlaceholder}
                    size="sm"
                    value={Array.isArray(value) ? value.join('; ') : value}
                />
            )}
        </Table.Td>
        <Table.Td className={styles.removeCell}>
            <Button className={styles.removeButton} onClick={onRemove} size="sm" variant="subtle">
                <RiCloseLine size={16} />
            </Button>
        </Table.Td>
    </Table.Tr>
);
