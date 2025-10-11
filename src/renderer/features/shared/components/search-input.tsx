import { useHotkeys } from '@mantine/hooks';
import { ChangeEvent, KeyboardEvent, useRef, useState } from 'react';
import { shallow } from 'zustand/shallow';

import { useSettingsStore } from '/@/renderer/store';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Icon } from '/@/shared/components/icon/icon';
import { TextInput, TextInputProps } from '/@/shared/components/text-input/text-input';

interface SearchInputProps extends TextInputProps {
    value?: string;
}

export const SearchInput = ({ onChange, ...props }: SearchInputProps) => {
    const ref = useRef<HTMLInputElement>(null);
    const binding = useSettingsStore((state) => state.hotkeys.bindings.localSearch, shallow);

    useHotkeys([[binding.hotkey, () => ref?.current?.select()]]);

    const handleEscape = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.code === 'Escape') {
            onChange?.({ target: { value: '' } } as ChangeEvent<HTMLInputElement>);
            if (ref.current) {
                ref.current.value = '';
                ref.current.blur();
            }
        }
    };

    const handleClear = () => {
        if (ref.current) {
            ref.current.value = '';
            ref.current.focus();
            onChange?.({ target: { value: '' } } as ChangeEvent<HTMLInputElement>);
        }
    };

    const [isFocused, setIsFocused] = useState(false);

    const hasValue = props.value || ref.current?.value;

    return (
        <TextInput
            leftSection={<Icon icon="search" />}
            maw="20dvw"
            onBlur={() => setIsFocused(false)}
            onChange={onChange}
            onFocus={() => setIsFocused(true)}
            onKeyDown={handleEscape}
            ref={ref}
            size="sm"
            width={isFocused || hasValue ? '200px' : '100px'}
            {...props}
            rightSection={
                ref.current?.value ? (
                    <ActionIcon icon="x" onClick={handleClear} variant="transparent" />
                ) : null
            }
        />
    );
};
