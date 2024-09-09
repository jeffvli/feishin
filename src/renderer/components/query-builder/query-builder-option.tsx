import { Group } from '@mantine/core';
import { useState } from 'react';
import { RiSubtractLine } from 'react-icons/ri';
import { Button } from '/@/renderer/components/button';
import { NumberInput, TextInput } from '/@/renderer/components/input';
import { Select } from '/@/renderer/components/select';
import { QueryBuilderRule } from '/@/renderer/types';

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

const QueryValueInput = ({ onChange, type, data, ...props }: any) => {
    const [numberRange, setNumberRange] = useState([0, 0]);

    switch (type) {
        case 'string':
            return (
                <TextInput
                    size="sm"
                    onChange={onChange}
                    {...props}
                />
            );
        case 'number':
            return (
                <NumberInput
                    size="sm"
                    onChange={onChange}
                    {...props}
                    defaultValue={props.defaultValue && Number(props.defaultValue)}
                />
            );
        case 'date':
            return (
                <TextInput
                    size="sm"
                    onChange={onChange}
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
                        width="10%"
                        onChange={(e) => {
                            const newRange = [e || 0, numberRange[1]];
                            setNumberRange(newRange);
                            onChange(newRange);
                        }}
                    />
                    <NumberInput
                        {...props}
                        defaultValue={props.defaultValue && Number(props.defaultValue?.[1])}
                        maxWidth={81}
                        width="10%"
                        onChange={(e) => {
                            const newRange = [numberRange[0], e || 0];
                            setNumberRange(newRange);
                            onChange(newRange);
                        }}
                    />
                </>
            );
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
        case 'playlist':
            return (
                <Select
                    data={data}
                    onChange={onChange}
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
    level,
    onDeleteRule,
    operators,
    groupIndex,
    noRemove,
    onChangeField,
    onChangeOperator,
    onChangeValue,
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
            ml={ml}
            spacing="sm"
        >
            <Select
                searchable
                data={filters}
                maxWidth={170}
                size="sm"
                value={field}
                width="25%"
                onChange={handleChangeField}
            />
            <Select
                searchable
                data={operatorsByFieldType || []}
                disabled={!field}
                maxWidth={170}
                size="sm"
                value={operator}
                width="25%"
                onChange={handleChangeOperator}
            />
            {field ? (
                <QueryValueInput
                    data={selectData || []}
                    defaultValue={value}
                    maxWidth={170}
                    size="sm"
                    type={operator === 'inTheRange' ? 'dateRange' : fieldType}
                    width="25%"
                    onChange={handleChangeValue}
                />
            ) : (
                <TextInput
                    disabled
                    defaultValue={value}
                    maxWidth={170}
                    size="sm"
                    width="25%"
                    onChange={handleChangeValue}
                />
            )}
            <Button
                disabled={noRemove}
                px={5}
                size="sm"
                tooltip={{ label: 'Remove rule' }}
                variant="default"
                onClick={handleDeleteRule}
            >
                <RiSubtractLine size={20} />
            </Button>
        </Group>
    );
};
