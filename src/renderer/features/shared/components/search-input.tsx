import { useHotkeys } from '@mantine/hooks';
import { ChangeEvent, CSSProperties, KeyboardEvent, useRef, useState } from 'react';
import { shallow } from 'zustand/shallow';

import { useSettingsStore } from '/@/renderer/store';
import { ActionIcon, ActionIconProps } from '/@/shared/components/action-icon/action-icon';
import { Box } from '/@/shared/components/box/box';
import { Icon } from '/@/shared/components/icon/icon';
import { TextInput, TextInputProps } from '/@/shared/components/text-input/text-input';

interface SearchInputProps extends TextInputProps {
    buttonProps?: Partial<ActionIconProps>;
    enableHotkey?: boolean;
    inputProps?: Partial<TextInputProps>;
    value?: string;
}

export const SearchInput = ({
    buttonProps,
    enableHotkey = true,
    inputProps,
    onChange,
    ...props
}: SearchInputProps) => {
    const ref = useRef<HTMLInputElement>(null);
    const binding = useSettingsStore((state) => state.hotkeys.bindings.localSearch, shallow);
    const [isInputMode, setIsInputMode] = useState(false);

    useHotkeys([
        [
            binding.hotkey,
            () => {
                if (enableHotkey) {
                    setIsInputMode(true);
                    ref?.current?.focus();
                    ref?.current?.select();
                }
            },
        ],
    ]);

    const handleEscape = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.code === 'Escape') {
            onChange?.({ target: { value: '' } } as ChangeEvent<HTMLInputElement>);
            if (ref.current) {
                ref.current.value = '';
                ref.current.blur();
            }
            setIsInputMode(false);
        }
    };

    const handleClear = () => {
        if (ref.current) {
            ref.current.value = '';
            ref.current.focus();
            onChange?.({ target: { value: '' } } as ChangeEvent<HTMLInputElement>);
        }
    };

    const handleButtonClick = () => {
        setIsInputMode(true);
        setTimeout(() => {
            ref?.current?.focus();
        }, 0);
    };

    const handleBlur = () => {
        const hasValue = props.value || ref.current?.value;
        if (!hasValue) {
            setIsInputMode(false);
        }
    };

    const hasValue = props.value || ref.current?.value;
    const shouldShowInput = isInputMode || hasValue;
    const shouldExpand = isInputMode || hasValue;

    const containerStyle: CSSProperties = {
        display: 'inline-flex',
        overflow: 'hidden',
        position: 'relative',
        transition: 'width 0.3s ease-in-out',
        width: shouldExpand ? '200px' : '36px',
    };

    const buttonStyle: CSSProperties = {
        left: 0,
        opacity: shouldShowInput ? 0 : 1,
        pointerEvents: shouldShowInput ? 'none' : 'auto',
        position: 'absolute',
        top: 0,
        transition: 'opacity 0.2s ease-in-out',
        zIndex: 10,
    };

    const inputStyle: CSSProperties = {
        opacity: shouldShowInput ? 1 : 0,
        transition: 'opacity 0.2s ease-in-out',
        width: '100%',
    };

    return (
        <Box style={containerStyle}>
            <TextInput
                leftSection={<Icon icon="search" />}
                maw="20dvw"
                {...inputProps}
                onBlur={handleBlur}
                onChange={onChange}
                onFocus={() => setIsInputMode(true)}
                onKeyDown={handleEscape}
                ref={ref}
                size="sm"
                style={inputStyle}
                {...props}
                rightSection={
                    ref.current?.value ? (
                        <ActionIcon icon="x" onClick={handleClear} variant="transparent" />
                    ) : null
                }
            />
            <ActionIcon
                {...buttonProps}
                icon="search"
                iconProps={{ size: 'lg' }}
                onClick={handleButtonClick}
                style={buttonStyle}
                tooltip={{ label: 'Search' }}
                variant="subtle"
            />
        </Box>
    );
};
