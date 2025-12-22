import { nanoid } from 'nanoid/non-secure';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import {
    SettingOption,
    SettingsSection,
} from '/@/renderer/features/settings/components/settings-section';
import {
    PlayerFilter,
    PlayerFilterField,
    PlayerFilterOperator,
    useSettingsStore,
    useSettingsStoreActions,
} from '/@/renderer/store';
import {
    NDSongQueryBooleanOperators,
    NDSongQueryDateOperators,
    NDSongQueryNumberOperators,
    NDSongQueryStringOperators,
} from '/@/shared/api/navidrome/navidrome-types';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Button } from '/@/shared/components/button/button';
import { DateInput } from '/@/shared/components/date-picker/date-picker';
import { Group } from '/@/shared/components/group/group';
import { NumberInput } from '/@/shared/components/number-input/number-input';
import { Select } from '/@/shared/components/select/select';
import { Stack } from '/@/shared/components/stack/stack';
import { TextInput } from '/@/shared/components/text-input/text-input';

type FilterFieldConfig = {
    label: string;
    type: 'boolean' | 'date' | 'number' | 'string';
    value: PlayerFilterField;
};

const getFilterFields = (t: (key: string, options?: any) => string): FilterFieldConfig[] => [
    {
        label: t('table.config.label.title', { postProcess: 'titleCase' }),
        type: 'string',
        value: 'name',
    },
    {
        label: t('table.config.label.albumArtist', { postProcess: 'titleCase' }),
        type: 'string',
        value: 'albumArtist',
    },
    {
        label: t('table.config.label.artist', { postProcess: 'titleCase' }),
        type: 'string',
        value: 'artist',
    },
    {
        label: t('table.config.label.duration', { postProcess: 'titleCase' }),
        type: 'number',
        value: 'duration',
    },
    {
        label: t('table.config.label.genre', { postProcess: 'titleCase' }),
        type: 'string',
        value: 'genre',
    },
    {
        label: t('table.config.label.year', { postProcess: 'titleCase' }),
        type: 'number',
        value: 'year',
    },
    {
        label: t('table.config.label.note', { postProcess: 'titleCase' }),
        type: 'string',
        value: 'note',
    },
    {
        label: t('table.config.label.path', { postProcess: 'titleCase' }),
        type: 'string',
        value: 'path',
    },
    {
        label: t('table.config.label.playCount', { postProcess: 'titleCase' }),
        type: 'number',
        value: 'playCount',
    },
    {
        label: t('table.config.label.favorite', { postProcess: 'titleCase' }),
        type: 'boolean',
        value: 'favorite',
    },
    {
        label: t('table.config.label.rating', { postProcess: 'titleCase' }),
        type: 'number',
        value: 'rating',
    },
];

const getOperatorsForFieldType = (
    t: (key: string, options?: any) => string,
    type: 'boolean' | 'date' | 'number' | 'string',
): { label: string; value: PlayerFilterOperator }[] => {
    const translateOperator = (operator: PlayerFilterOperator): string => {
        const operatorKeyMap: Record<PlayerFilterOperator, string> = {
            after: 'filterOperator.after',
            afterDate: 'filterOperator.afterDate',
            before: 'filterOperator.before',
            beforeDate: 'filterOperator.beforeDate',
            contains: 'filterOperator.contains',
            endsWith: 'filterOperator.endsWith',
            gt: 'filterOperator.isGreaterThan',
            inTheLast: 'filterOperator.inTheLast',
            inTheRange: 'filterOperator.inTheRange',
            inTheRangeDate: 'filterOperator.inTheRangeDate',
            is: 'filterOperator.is',
            isNot: 'filterOperator.isNot',
            lt: 'filterOperator.isLessThan',
            notContains: 'filterOperator.notContains',
            notInTheLast: 'filterOperator.notInTheLast',
            regex: 'filterOperator.matchesRegex',
            startsWith: 'filterOperator.startsWith',
        };

        return t(operatorKeyMap[operator] || operator, { postProcess: 'titleCase' });
    };

    switch (type) {
        case 'boolean': {
            return (
                NDSongQueryBooleanOperators as { label: string; value: PlayerFilterOperator }[]
            ).map((op) => ({
                label: translateOperator(op.value),
                value: op.value,
            }));
        }
        case 'date': {
            return (
                NDSongQueryDateOperators as { label: string; value: PlayerFilterOperator }[]
            ).map((op) => ({
                label: translateOperator(op.value),
                value: op.value,
            }));
        }
        case 'number': {
            const numberOperators = (
                NDSongQueryNumberOperators as {
                    label: string;
                    value: PlayerFilterOperator;
                }[]
            ).filter((op) => op.value !== 'inTheRange');
            return numberOperators.map((op) => ({
                label: translateOperator(op.value),
                value: op.value,
            }));
        }
        case 'string': {
            const stringOperators = [
                ...(NDSongQueryStringOperators as { label: string; value: PlayerFilterOperator }[]),
                { label: 'matches regex', value: 'regex' as PlayerFilterOperator },
            ];
            return stringOperators.map((op) => ({
                label: translateOperator(op.value),
                value: op.value,
            }));
        }
        default:
            return [];
    }
};

const FilterValueInput = ({
    field,
    filterFields,
    onChange,
    operator,
    value,
}: {
    field: PlayerFilterField;
    filterFields: FilterFieldConfig[];
    onChange: (value: (number | string)[] | boolean | number | string) => void;
    operator: PlayerFilterOperator;
    value: (number | string)[] | boolean | number | string | undefined;
}) => {
    const fieldConfig = filterFields.find((f) => f.value === field);
    const fieldType = fieldConfig?.type || 'string';

    // Parse date value helper
    const parseDateValue = (val: any): Date | null => {
        if (!val) return null;
        if (val instanceof Date) return val;
        if (typeof val === 'string') {
            const parsed = new Date(val);
            if (isNaN(parsed.getTime())) return null;
            return parsed;
        }
        return null;
    };

    const isDatePickerOperator =
        operator === 'beforeDate' || operator === 'afterDate' || operator === 'inTheRangeDate';

    switch (fieldType) {
        case 'boolean':
            return (
                <Select
                    data={[
                        { label: 'true', value: 'true' },
                        { label: 'false', value: 'false' },
                    ]}
                    onChange={(e) => onChange(e === 'true')}
                    value={value?.toString() || 'false'}
                    width="30%"
                />
            );
        case 'date':
            if (isDatePickerOperator && operator !== 'inTheRangeDate') {
                const dateValue = value ? parseDateValue(value) : null;
                return (
                    <DateInput
                        clearable
                        defaultLevel="year"
                        maxWidth={170}
                        onChange={(date) => onChange(date || '')}
                        size="sm"
                        value={dateValue}
                        valueFormat="YYYY-MM-DD"
                        width="30%"
                    />
                );
            }
            return (
                <TextInput
                    onChange={(e) => onChange(e.currentTarget.value)}
                    size="sm"
                    value={(value as string) || ''}
                    width="30%"
                />
            );
        case 'number':
            return (
                <NumberInput
                    onChange={(e) => onChange(Number(e) || 0)}
                    size="sm"
                    value={value !== undefined && value !== null ? Number(value) : undefined}
                    width="30%"
                />
            );
        case 'string':
        default:
            return (
                <TextInput
                    onChange={(e) => onChange(e.currentTarget.value)}
                    size="sm"
                    value={(value as string) || ''}
                    width="30%"
                />
            );
    }
};

export const PlayerFilterSettings = () => {
    const { t } = useTranslation();
    const filters = useSettingsStore((state) => state.playback.filters);
    const { setPlaybackFilters } = useSettingsStoreActions();

    const filterFields = useMemo(() => getFilterFields(t), [t]);

    const handleAddFilter = useCallback(() => {
        const newFilter: PlayerFilter = {
            field: 'name',
            id: nanoid(),
            operator: 'is',
            value: '',
        };
        setPlaybackFilters([...filters, newFilter]);
    }, [filters, setPlaybackFilters]);

    const handleRemoveFilter = useCallback(
        (id: string) => {
            setPlaybackFilters(filters.filter((f) => f.id !== id));
        },
        [filters, setPlaybackFilters],
    );

    const handleFieldChange = useCallback(
        (id: string, field: PlayerFilterField) => {
            const fieldConfig = filterFields.find((f) => f.value === field);
            const defaultOperator = getOperatorsForFieldType(t, fieldConfig?.type || 'string')[0]
                .value;
            const defaultValue =
                fieldConfig?.type === 'boolean'
                    ? false
                    : fieldConfig?.type === 'number'
                      ? 0
                      : fieldConfig?.type === 'date'
                        ? ''
                        : '';

            setPlaybackFilters(
                filters.map((f) =>
                    f.id === id
                        ? {
                              ...f,
                              field,
                              operator: defaultOperator,
                              value: defaultValue,
                          }
                        : f,
                ),
            );
        },
        [filterFields, filters, setPlaybackFilters, t],
    );

    const handleOperatorChange = useCallback(
        (id: string, operator: PlayerFilterOperator) => {
            setPlaybackFilters(filters.map((f) => (f.id === id ? { ...f, operator } : f)));
        },
        [filters, setPlaybackFilters],
    );

    const handleValueChange = useCallback(
        (id: string, value: (number | string)[] | boolean | number | string) => {
            setPlaybackFilters(filters.map((f) => (f.id === id ? { ...f, value } : f)));
        },
        [filters, setPlaybackFilters],
    );

    const fieldOptions = useMemo(
        () => filterFields.map((f) => ({ label: f.label, value: f.value })),
        [filterFields],
    );

    const filterOptions: SettingOption[] = [
        {
            control: (
                <Stack gap="md">
                    {filters.length > 0 && (
                        <Stack gap="sm">
                            {filters.map((filter) => {
                                const fieldConfig = filterFields.find(
                                    (f) => f.value === filter.field,
                                );
                                const operators = getOperatorsForFieldType(
                                    t,
                                    fieldConfig?.type || 'string',
                                );

                                return (
                                    <Group gap="sm" key={filter.id}>
                                        <Select
                                            data={fieldOptions}
                                            onChange={(e) =>
                                                handleFieldChange(filter.id, e as PlayerFilterField)
                                            }
                                            value={filter.field}
                                            width="25%"
                                        />
                                        <Select
                                            data={operators}
                                            onChange={(e) =>
                                                handleOperatorChange(
                                                    filter.id,
                                                    e as PlayerFilterOperator,
                                                )
                                            }
                                            value={filter.operator}
                                            width="25%"
                                        />
                                        <FilterValueInput
                                            field={filter.field}
                                            filterFields={filterFields}
                                            onChange={(value) =>
                                                handleValueChange(filter.id, value)
                                            }
                                            operator={filter.operator}
                                            value={filter.value}
                                        />
                                        <ActionIcon
                                            icon="remove"
                                            onClick={() => handleRemoveFilter(filter.id)}
                                            size="sm"
                                            variant="subtle"
                                        />
                                    </Group>
                                );
                            })}
                        </Stack>
                    )}
                    <Group grow>
                        <Button onClick={handleAddFilter} variant="filled">
                            {t('common.add', { postProcess: 'titleCase' })}
                        </Button>
                    </Group>
                </Stack>
            ),
            description: t('setting.playerFilters', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            title: t('setting.playerFilters', { postProcess: 'sentenceCase' }),
        },
    ];

    return (
        <SettingsSection
            options={filterOptions}
            title={t('page.setting.playerFilters', { postProcess: 'sentenceCase' })}
        />
    );
};
