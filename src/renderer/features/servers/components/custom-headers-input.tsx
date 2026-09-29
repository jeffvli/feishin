import { nanoid } from 'nanoid/non-secure';
import { useTranslation } from 'react-i18next';

import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Button } from '/@/shared/components/button/button';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { Stack } from '/@/shared/components/stack/stack';
import { TextInput } from '/@/shared/components/text-input/text-input';
import { CustomHeaderEntry, HEADER_NAME_PATTERN } from '/@/shared/utils/server-headers';

export type { CustomHeaderEntry };

interface CustomHeadersInputProps {
    entries: CustomHeaderEntry[];
    keyLabel: string;
    onAddLabel: string;
    onChange: (entries: CustomHeaderEntry[]) => void;
    onRemoveLabel: string;
    valueLabel: string;
}

export const CustomHeadersInput = ({
    entries,
    keyLabel,
    onAddLabel,
    onChange,
    onRemoveLabel,
    valueLabel,
}: CustomHeadersInputProps) => {
    const { t } = useTranslation();

    const updateEntry = (index: number, field: 'key' | 'value', value: string) => {
        onChange(
            entries.map((entry, entryIndex) =>
                entryIndex === index ? { ...entry, [field]: value } : entry,
            ),
        );
    };

    const addEntry = () => {
        onChange([...entries, { id: nanoid(), key: '', value: '' }]);
    };

    const removeEntry = (index: number) => {
        onChange(entries.filter((_, entryIndex) => entryIndex !== index));
    };

    return (
        <Stack gap="xs">
            {entries.map((entry, index) => {
                const keyTrimmed = entry.key.trim();
                const valueTrimmed = entry.value.trim();

                let keyError: string | undefined;
                let valueError: string | undefined;

                if (keyTrimmed && !HEADER_NAME_PATTERN.test(keyTrimmed)) {
                    keyError = t('form.addServer.error_customHeaderInvalidName');
                } else if (!keyTrimmed && valueTrimmed) {
                    keyError = t('form.addServer.error_customHeaderKeyRequired');
                }

                if (keyTrimmed && !valueTrimmed) {
                    valueError = t('form.addServer.error_customHeaderValueRequired');
                }

                return (
                    <Group align="flex-start" key={entry.id || index} wrap="nowrap">
                        <TextInput
                            error={keyError}
                            label={index === 0 ? keyLabel : undefined}
                            onChange={(event) =>
                                updateEntry(index, 'key', event.currentTarget.value)
                            }
                            placeholder="X-Custom-Header"
                            style={{ flex: 1 }}
                            value={entry.key}
                        />
                        <TextInput
                            error={valueError}
                            label={index === 0 ? valueLabel : undefined}
                            onChange={(event) =>
                                updateEntry(index, 'value', event.currentTarget.value)
                            }
                            placeholder="Value"
                            style={{ flex: 1 }}
                            value={entry.value}
                        />
                        <ActionIcon
                            aria-label={onRemoveLabel}
                            color="error"
                            icon="delete"
                            iconProps={{ size: 'sm' }}
                            onClick={() => removeEntry(index)}
                            size="sm"
                            style={{ marginTop: index === 0 ? 25 : 6 }}
                            tooltip={{ label: onRemoveLabel }}
                            variant="subtle"
                        />
                    </Group>
                );
            })}
            <Group justify="flex-start">
                <Button
                    leftSection={<Icon icon="add" size="sm" />}
                    onClick={addEntry}
                    size="xs"
                    type="button"
                    variant="subtle"
                >
                    {onAddLabel}
                </Button>
            </Group>
        </Stack>
    );
};
