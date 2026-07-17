import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { KNOWN_TAG_MAP, resolveTagKey } from '../utils/known-tags';

import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Autocomplete } from '/@/shared/components/autocomplete/autocomplete';
import { Group } from '/@/shared/components/group/group';

interface AddFieldInputProps {
    availableFields: Array<{ label: string; value: string }>;
    existingFieldKeys: string[];
    onAddField: (key: string) => void;
}

export const AddFieldInput = ({
    availableFields,
    existingFieldKeys,
    onAddField,
}: AddFieldInputProps) => {
    const { t } = useTranslation();
    const skipNextEnterRef = useRef(false);
    const skipNextOnChangeResetRef = useRef(false);
    const [input, setInput] = useState('');
    const [duplicateAttempted, setDuplicateAttempted] = useState(false);

    const trimmedInput = input.trim();
    const customKeyError =
        trimmedInput && !KNOWN_TAG_MAP.has(trimmedInput)
            ? trimmedInput.includes('=')
                ? "Tag key cannot contain '='"
                : // eslint-disable-next-line no-control-regex
                  /[^\x00-\x7F]/.test(trimmedInput)
                  ? 'Tag key must use ASCII characters only'
                  : null
            : null;

    const resolvedInputKey = trimmedInput ? resolveTagKey(trimmedInput) : '';
    const duplicateError =
        trimmedInput && !customKeyError && existingFieldKeys.includes(resolvedInputKey)
            ? 'Field already exists'
            : null;
    const fieldError = customKeyError ?? (duplicateAttempted ? duplicateError : null);

    const addField = (key: string): boolean => {
        const trimmed = key.trim();
        if (!trimmed) return false;
        if (
            !KNOWN_TAG_MAP.has(trimmed) &&
            (trimmed.includes('=') || // eslint-disable-next-line no-control-regex
                /[^\x00-\x7F]/.test(trimmed))
        )
            return false;

        const normalizedKey = resolveTagKey(trimmed);
        if (existingFieldKeys.includes(normalizedKey)) {
            setDuplicateAttempted(true);
            return false;
        }

        setDuplicateAttempted(false);
        setInput('');
        onAddField(normalizedKey);
        return true;
    };

    return (
        <Group gap="xs">
            <Autocomplete
                data={availableFields}
                error={fieldError}
                flex={1}
                onChange={(value) => {
                    setInput(value);
                    if (skipNextOnChangeResetRef.current) {
                        skipNextOnChangeResetRef.current = false;
                    } else {
                        setDuplicateAttempted(false);
                    }
                }}
                onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                        if (skipNextEnterRef.current) {
                            skipNextEnterRef.current = false;
                            return;
                        }
                        addField(input);
                    }
                }}
                onOptionSubmit={(value) => {
                    skipNextEnterRef.current = true;
                    skipNextOnChangeResetRef.current = true;
                    const added = addField(value);
                    if (added) {
                        queueMicrotask(() => setInput(''));
                    }
                }}
                placeholder={t('page.itemDetail.addField', 'Add field…')}
                value={input}
            />
            <ActionIcon
                disabled={!!fieldError}
                icon="add"
                onClick={() => addField(input)}
                variant="filled"
            />
        </Group>
    );
};
