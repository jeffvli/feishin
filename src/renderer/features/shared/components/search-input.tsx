import {
    ChangeEvent,
    CSSProperties,
    KeyboardEvent,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { shallow } from 'zustand/shallow';

import { useSettingsStore } from '/@/renderer/store';
import { ActionIcon, ActionIconProps } from '/@/shared/components/action-icon/action-icon';
import { Box } from '/@/shared/components/box/box';
import { Icon } from '/@/shared/components/icon/icon';
import { TextInput, TextInputProps } from '/@/shared/components/text-input/text-input';
import { useHotkeys } from '/@/shared/hooks/use-hotkeys';

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

    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    const handleButtonClick = () => {
        setIsInputMode(true);
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
            ref?.current?.focus();
            timeoutRef.current = null;
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

    const containerStyle: CSSProperties = useMemo(
        () => ({
            display: 'inline-flex',
            overflow: 'hidden',
            position: 'relative',
            transition: 'width 0.3s ease-in-out',
            width: shouldExpand ? '200px' : '36px',
        }),
        [shouldExpand],
    );

    const buttonStyle: CSSProperties = useMemo(
        () => ({
            left: 0,
            opacity: shouldShowInput ? 0 : 1,
            pointerEvents: shouldShowInput ? 'none' : 'auto',
            position: 'absolute',
            top: 0,
            transition: 'opacity 0.2s ease-in-out',
            zIndex: 10,
        }),
        [shouldShowInput],
    );

    const inputStyle: CSSProperties = useMemo(
        () => ({
            opacity: shouldShowInput ? 1 : 0,
            transition: 'opacity 0.2s ease-in-out',
            width: '100%',
        }),
        [shouldShowInput],
    );

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
