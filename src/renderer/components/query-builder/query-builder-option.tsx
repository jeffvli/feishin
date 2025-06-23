import { useState } from 'react';

import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
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
    filters: { label: string; type: string; value: string }[];
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

const QueryValueInput = ({ data, onChange, type, ...props }: any) => {
    const [numberRange, setNumberRange] = useState<number[]>([0, 0]);

    switch (type) {
        case 'boolean':
            return (
                <Select
                    data={[
                        { label: 'true', value: 'true' },
                        { label: 'false', value: 'false' },
                    ]}
                    onChange={onChange}
                    {...props}
                />
            );
        case 'date':
            return (
                <TextInput
                    onChange={onChange}
                    size="sm"
                    {...props}
                />
            );
        case 'dateRange':
            return (
                <>
                    <NumberInput
                        {...props}
                        defaultValue={props.defaultValue && Number(props.defaultValue?.[0])}
                        maxWidth={81}
                        onChange={(e) => {
                            const newRange = [Number(e) || 0, numberRange[1]];
                            setNumberRange(newRange);
                            onChange(newRange);
                        }}
                        width="10%"
                    />
                    <NumberInput
                        {...props}
                        defaultValue={props.defaultValue && Number(props.defaultValue?.[1])}
                        maxWidth={81}
                        onChange={(e) => {
                            const newRange = [numberRange[0], Number(e) || 0];
                            setNumberRange(newRange);
                            onChange(newRange);
                        }}
                        width="10%"
                    />
                </>
            );
        case 'number':
            return (
                <NumberInput
                    onChange={onChange}
                    size="sm"
                    {...props}
                    defaultValue={props.defaultValue && Number(props.defaultValue)}
                />
            );
        case 'playlist':
            return (
                <Select
                    data={data}
                    onChange={onChange}
                    {...props}
                />
            );
        case 'string':
            return (
                <TextInput
                    onChange={onChange}
                    size="sm"
                    {...props}
                />
            );

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

    const fieldType = filters.find((f) => f.value === field)?.type;
    const operatorsByFieldType = operators[fieldType as keyof typeof operators];
    const ml = (level + 1) * 10;

    return (
        <Group
            gap="sm"
            ml={ml}
        >
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
                    defaultValue={value}
                    maxWidth={170}
                    onChange={handleChangeValue}
                    size="sm"
                    type={operator === 'inTheRange' ? 'dateRange' : fieldType}
                    width="25%"
                />
            ) : (
                <TextInput
                    defaultValue={value}
                    disabled
                    maxWidth={170}
                    onChange={handleChangeValue}
                    size="sm"
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
