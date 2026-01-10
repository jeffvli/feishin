import { useEffect, useState } from 'react';

import { Filters } from '/@/renderer/components/query-builder';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { DateInput } from '/@/shared/components/date-picker/date-picker';
import { Group } from '/@/shared/components/group/group';
import { NumberInput } from '/@/shared/components/number-input/number-input';
import { Select } from '/@/shared/components/select/select';
import { TextInput } from '/@/shared/components/text-input/text-input';
import { QueryBuilderRule } from '/@/shared/types/types';

type DeleteArgs = {
    groupIndex: number[];
    level: number;
    uniqueId: string;
};

interface QueryOptionProps {
    data: QueryBuilderRule;
    filters: Filters;
    groupIndex: number[];
    level: number;
    noRemove: boolean;
    onChangeField: (args: any) => void;
    onChangeOperator: (args: any) => void;
    onChangeValue: (args: any) => void;
    onDeleteRule: (args: DeleteArgs) => void;
    operators: {
        boolean: { label: string; value: string }[];
        date: { label: string; value: string }[];
        number: { label: string; value: string }[];
        string: { label: string; value: string }[];
    };
    selectData?: { label: string; value: string }[];
}

const QueryValueInput = ({
    data,
    defaultValue,
    onChange,
    operator,
    type,
    value: valueProp,
    ...props
}: any) => {
    const [numberRange, setNumberRange] = useState<number[]>([0, 0]);

    // Parse date value helper - converts date string (YYYY-MM-DD) to Date for display
    const parseDateValue = (val: any): Date | null => {
        if (!val) return null;
        if (val instanceof Date) return val;
        if (typeof val === 'string') {
            // Handle YYYY-MM-DD format strings
            const parsed = new Date(val);
            if (isNaN(parsed.getTime())) return null;
            return parsed;
        }
        return null;
    };

    const value = valueProp !== undefined ? valueProp : defaultValue;

    // Store date range as strings for state management
    const [dateRange, setDateRange] = useState<[null | string, null | string]>(() => {
        const currentValue = value !== undefined ? value : defaultValue;
        if (currentValue && Array.isArray(currentValue)) {
            return [
                typeof currentValue[0] === 'string' ? currentValue[0] : null,
                typeof currentValue[1] === 'string' ? currentValue[1] : null,
            ];
        }
        return [null, null];
    });

    // Sync dateRange state when value changes
    useEffect(() => {
        const currentValue = value !== undefined ? value : defaultValue;
        if (operator === 'inTheRangeDate' && currentValue && Array.isArray(currentValue)) {
            setDateRange([
                typeof currentValue[0] === 'string' ? currentValue[0] : null,
                typeof currentValue[1] === 'string' ? currentValue[1] : null,
            ]);
        }
    }, [value, defaultValue, operator]);

    // Sync numberRange state when value changes
    useEffect(() => {
        const currentValue = value !== undefined ? value : defaultValue;
        if (operator === 'inTheRange' && currentValue && Array.isArray(currentValue)) {
            setNumberRange([
                typeof currentValue[0] === 'number'
                    ? currentValue[0]
                    : Number(currentValue[0]) || 0,
                typeof currentValue[1] === 'number'
                    ? currentValue[1]
                    : Number(currentValue[1]) || 0,
            ]);
        }
    }, [value, defaultValue, operator]);

    // Check if operator requires DatePicker
    const isDatePickerOperator =
        operator === 'beforeDate' || operator === 'afterDate' || operator === 'inTheRangeDate';

    switch (type) {
        case 'boolean':
            return (
                <Select
                    data={[
                        { label: 'true', value: 'true' },
                        { label: 'false', value: 'false' },
                    ]}
                    onChange={onChange}
                    value={value}
                    {...props}
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
                        onChange={(date) => {
                            // DateInput returns string in 'YYYY-MM-DD' format (local timezone)
                            // Return raw string value - no transformation needed
                            onChange(date || '');
                        }}
                        size="sm"
                        value={dateValue}
                        valueFormat="YYYY-MM-DD"
                        width="25%"
                    />
                );
            }
            return <TextInput onChange={onChange} size="sm" value={value} {...props} />;
        case 'dateRange':
            if (operator === 'inTheRangeDate') {
                return (
                    <Group gap="sm" wrap="nowrap">
                        <DateInput
                            clearable
                            defaultLevel="year"
                            maxWidth={81}
                            onChange={(date) => {
                                // DateInput returns string in 'YYYY-MM-DD' format (local timezone)
                                const newRange: [null | string, null | string] = [
                                    date || null,
                                    dateRange[1],
                                ];
                                setDateRange(newRange);
                                // Return raw string values - no transformation needed
                                onChange([date || null, dateRange[1] || null]);
                            }}
                            size="sm"
                            value={dateRange[0] ? parseDateValue(dateRange[0]) : null}
                            valueFormat="YYYY-MM-DD"
                            width="10%"
                        />
                        <DateInput
                            clearable
                            defaultLevel="year"
                            maxWidth={81}
                            onChange={(date) => {
                                // DateInput returns string in 'YYYY-MM-DD' format (local timezone)
                                const newRange: [null | string, null | string] = [
                                    dateRange[0],
                                    date || null,
                                ];
                                setDateRange(newRange);
                                // Return raw string values - no transformation needed
                                onChange([dateRange[0] || null, date || null]);
                            }}
                            size="sm"
                            value={dateRange[1] ? parseDateValue(dateRange[1]) : null}
                            valueFormat="YYYY-MM-DD"
                            width="10%"
                        />
                    </Group>
                );
            }

            return (
                <>
                    <NumberInput
                        {...props}
                        maxWidth={81}
                        onChange={(e) => {
                            const newRange = [Number(e) || 0, numberRange[1]];
                            setNumberRange(newRange);
                            onChange(newRange);
                        }}
                        value={numberRange[0] || undefined}
                        width="10%"
                    />
                    <NumberInput
                        {...props}
                        maxWidth={81}
                        onChange={(e) => {
                            const newRange = [numberRange[0], Number(e) || 0];
                            setNumberRange(newRange);
                            onChange(newRange);
                        }}
                        value={numberRange[1] || undefined}
                        width="10%"
                    />
                </>
            );
        case 'number':
            return (
                <NumberInput
                    onChange={onChange}
                    size="sm"
                    value={
                        value !== undefined && value !== null && value !== ''
                            ? Number(value)
                            : undefined
                    }
                    {...props}
                />
            );
        case 'playlist':
            return <Select data={data} onChange={onChange} value={value} {...props} />;
        case 'string':
            return <TextInput onChange={onChange} size="sm" value={value || ''} {...props} />;

        default:
            return <></>;
    }
};

export const QueryBuilderOption = ({
    data,
    filters,
    groupIndex,
    level,
    noRemove,
    onChangeField,
    onChangeOperator,
    onChangeValue,
    onDeleteRule,
    operators,
    selectData,
}: QueryOptionProps) => {
    const { field, operator, uniqueId, value } = data;

    const handleDeleteRule = () => {
        onDeleteRule({ groupIndex, level, uniqueId });
    };

    const handleChangeField = (e: any) => {
        onChangeField({ groupIndex, level, uniqueId, value: e });
    };

    const handleChangeOperator = (e: any) => {
        onChangeOperator({ groupIndex, level, uniqueId, value: e });
    };

    const handleChangeValue = (e: any) => {
        const isDirectValue =
            typeof e === 'string' || typeof e === 'number' || typeof e === 'undefined';

        if (isDirectValue) {
            return onChangeValue({
                groupIndex,
                level,
                uniqueId,
                value: e,
            });
        }

        // const isDate = e instanceof Date;

        // if (isDate) {
        //   return onChangeValue({
        //     groupIndex,
        //     level,
        //     uniqueId,
        //     value: dayjs(e).format('YYYY-MM-DD'),
        //   });
        // }

        const isArray = Array.isArray(e);

        if (isArray) {
            return onChangeValue({
                groupIndex,
                level,
                uniqueId,
                value: e,
            });
        }

        return onChangeValue({
            groupIndex,
            level,
            uniqueId,
            value: e.currentTarget.value,
        });
    };

    // Handle both grouped and flat filter data
    const flatFilters = filters.some((f: any) => f.group && f.items)
        ? filters.flatMap((group: any) => group.items || [])
        : filters;
    const fieldType = flatFilters.find((f: any) => f.value === field)?.type;
    const operatorsByFieldType = operators[fieldType as keyof typeof operators];
    const ml = 20;

    return (
        <Group gap="sm" ml={ml}>
            <Select
                data={filters}
                maxWidth={170}
                onChange={handleChangeField}
                searchable
                size="sm"
                value={field}
                width="25%"
            />
            <Select
                data={operatorsByFieldType || []}
                disabled={!field}
                maxWidth={170}
                onChange={handleChangeOperator}
                searchable
                size="sm"
                value={operator}
                width="25%"
            />
            {field ? (
                <QueryValueInput
                    data={selectData || []}
                    maxWidth={170}
                    onChange={handleChangeValue}
                    operator={operator}
                    size="sm"
                    type={
                        operator === 'inTheRange' || operator === 'inTheRangeDate'
                            ? 'dateRange'
                            : fieldType
                    }
                    value={value}
                    width="25%"
                />
            ) : (
                <TextInput
                    disabled
                    maxWidth={170}
                    onChange={handleChangeValue}
                    size="sm"
                    value={value || ''}
                    width="25%"
                />
            )}
            <ActionIcon
                disabled={noRemove}
                icon="remove"
                onClick={handleDeleteRule}
                px={5}
                size="sm"
                variant="subtle"
            />
        </Group>
    );
};
