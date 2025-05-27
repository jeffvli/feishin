import { useHotkeys } from '@mantine/hooks';
import { ChangeEvent, KeyboardEvent, useRef } from 'react';
import { RiCloseFill, RiSearchLine } from 'react-icons/ri';
import { shallow } from 'zustand/shallow';

import { useSettingsStore } from '/@/renderer/store';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
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

    return (
        <TextInput
            leftSection={<RiSearchLine />}
            onChange={onChange}
            onKeyDown={handleEscape}
            ref={ref}
            size="sm"
            width={200}
            {...props}
            rightSection={
                ref.current?.value ? (
                    <ActionIcon
                        onClick={handleClear}
                        variant="transparent"
                    >
                        <RiCloseFill />
                    </ActionIcon>
                ) : null
            }
        />
    );
};
