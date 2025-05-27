import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { MultiSelect, MultiSelectProps } from '/@/shared/components/multi-select/multi-select';
import { Select, SelectProps } from '/@/shared/components/select/select';

export const SelectWithInvalidData = ({ data, defaultValue, ...props }: SelectProps) => {
    const { t } = useTranslation();

    const [fullData, hasError] = useMemo(() => {
        if (typeof defaultValue === 'string') {
            const missingField =
                data?.find((item) =>
                    typeof item === 'string'
                        ? item === defaultValue
                        : (item as any).value === defaultValue,
                ) === undefined;

            if (missingField) {
                return [data?.concat(defaultValue), true];
            }
        }

        return [data, false];
    }, [data, defaultValue]);

    return (
        <Select
            data={fullData}
            defaultValue={defaultValue}
            error={
                hasError
                    ? t('error.badValue', { postProcess: 'sentenceCase', value: defaultValue })
                    : undefined
            }
            {...props}
        />
    );
};

export const MultiSelectWithInvalidData = ({ data, defaultValue, ...props }: MultiSelectProps) => {
    const { t } = useTranslation();
    const [fullData, missing] = useMemo(() => {
        if (defaultValue?.length) {
            const validValues = new Set<string>();
            for (const item of data || []) {
                if (typeof item === 'string') {
                    validValues.add(item);
                } else {
                    validValues.add((item as any).value);
                }
            }

            const missingFields: string[] = [];

            for (const value of defaultValue) {
                if (!validValues.has(value)) {
                    missingFields.push(value);
                }
            }

            if (missingFields.length > 0) {
                return [data?.concat(missingFields), missingFields];
            }
        }

        return [data, []];
    }, [data, defaultValue]);

    return (
        <MultiSelect
            data={fullData}
            defaultValue={defaultValue}
            error={
                missing.length
                    ? t('error.badValue', { postProcess: 'sentenceCase', value: missing })
                    : undefined
            }
            {...props}
        />
    );
};
