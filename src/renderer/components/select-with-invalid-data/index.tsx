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
            error={hasError ? t('error.badValue', { value: defaultValue }) : undefined}
            {...props}
        />
    );
};

export const MultiSelectWithInvalidData = ({
    data,
    defaultValue,
    value,
    ...props
}: MultiSelectProps) => {
    const { t } = useTranslation();
    const currentValue = value ?? defaultValue;
    const [fullData, missing] = useMemo(() => {
        if (currentValue?.length) {
            const validValues = new Set<string>();
            for (const item of data || []) {
                if (typeof item === 'string') {
                    validValues.add(item);
                } else {
                    validValues.add((item as any).value);
                }
            }

            const missingFields: string[] = [];

            for (const val of currentValue) {
                if (!validValues.has(val)) {
                    missingFields.push(val);
                }
            }

            if (missingFields.length > 0) {
                return [data?.concat(missingFields), missingFields];
            }
        }

        return [data, []];
    }, [data, currentValue]);

    const error = useMemo(
        () => (missing.length ? t('error.badValue', { value: missing }) : undefined),
        [missing, t],
    );

    return (
        <MultiSelect
            data={fullData}
            defaultValue={defaultValue}
            error={error}
            value={value}
            {...props}
        />
    );
};
