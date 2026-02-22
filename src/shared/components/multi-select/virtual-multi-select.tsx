import clsx from 'clsx';
import { useOverlayScrollbars } from 'overlayscrollbars-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { List, RowComponentProps, useDynamicRowHeight, useListRef } from 'react-window-v2';

import styles from './virtual-multi-select.module.css';

import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Center } from '/@/shared/components/center/center';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { Spinner } from '/@/shared/components/spinner/spinner';
import { Stack } from '/@/shared/components/stack/stack';
import { TextInput } from '/@/shared/components/text-input/text-input';
import { Text } from '/@/shared/components/text/text';

export type VirtualMultiSelectOption<T> = T & { label: string; value: string };

interface VirtualMultiSelectProps<T> {
    disabled?: boolean;
    displayCountType?: 'album' | 'song';
    height: number;
    isLoading?: boolean;
    label?: React.ReactNode | string;
    onChange: (value: null | string[]) => void;
    options: VirtualMultiSelectOption<T>[];
    RowComponent: (
        props: RowComponentProps<{
            disabled?: boolean;
            displayCountType?: 'album' | 'song';
            focusedIndex: null | number;
            onToggle: (value: string) => void;
            options: VirtualMultiSelectOption<T>[];
            value: string[];
        }>,
    ) => React.ReactElement;
    singleSelect?: boolean;
    value: string[];
}

export function VirtualMultiSelect<T>({
    disabled = false,
    displayCountType = 'album',
    height,
    isLoading = false,
    label,
    onChange,
    options,
    RowComponent,
    singleSelect = false,
    value,
}: VirtualMultiSelectProps<T>) {
    const { t } = useTranslation();
    const [search, setSearch] = useState('');
    const [focusedIndex, setFocusedIndex] = useState<null | number>(null);
    const listContainerRef = useRef<HTMLDivElement>(null);
    const listRef = useListRef(null);

    const rowHeight = useDynamicRowHeight({
        defaultRowHeight: 50,
    });

    const [initialize, osInstance] = useOverlayScrollbars({
        defer: false,
        options: {
            overflow: { x: 'hidden', y: 'scroll' },
            paddingAbsolute: true,
            scrollbars: {
                autoHide: 'leave',
                autoHideDelay: 500,
                pointers: ['mouse', 'pen', 'touch'],
                theme: 'feishin-os-scrollbar',
            },
        },
    });

    const selectedOptions = useMemo(
        () => options.filter((option) => value.includes(option.value)),
        [options, value],
    );

    const stableOptions = useMemo(
        () =>
            options.filter(
                (option) =>
                    !value.includes(option.value) &&
                    option.label.toLowerCase().includes(search.toLowerCase()),
            ),
        [options, search, value],
    );

    useEffect(() => {
        const { current: container } = listContainerRef;
        if (!container) return;

        const isListVisible = !isLoading && stableOptions.length > 0;

        if (!isListVisible) {
            osInstance()?.destroy();
            return;
        }

        const viewport = container.firstElementChild as HTMLElement;
        if (!viewport) return;

        initialize({
            elements: {
                viewport,
            },
            target: container,
        });

        return () => osInstance()?.destroy();
    }, [initialize, osInstance, isLoading, stableOptions.length]);

    const handleToggle = useCallback(
        (optionValue: string) => {
            if (disabled) return;
            if (value.includes(optionValue)) {
                const newValue = value.filter((v) => v !== optionValue);
                onChange(newValue.length > 0 ? newValue : null);
            } else {
                onChange(singleSelect ? [optionValue] : [...value, optionValue]);
            }
        },
        [disabled, onChange, singleSelect, value],
    );

    const handleDeselect = useCallback(
        (optionValue: string) => {
            if (disabled) return;
            const newValue = value.filter((v) => v !== optionValue);
            onChange(newValue.length > 0 ? newValue : null);
        },
        [disabled, onChange, value],
    );

    const placeholder = useMemo(
        () => (value.length > 0 ? t('common.countSelected', { count: value.length }) : undefined),
        [t, value.length],
    );

    const labelWithClear = useMemo(() => {
        if (!label) return undefined;
        return label;
    }, [label]);

    const scrollToIndex = useCallback(
        (index: number) => {
            const list = listRef.current;
            list?.scrollToRow({
                align: 'auto',
                behavior: 'auto',
                index,
            });
        },
        [listRef],
    );

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLDivElement>) => {
            if (disabled || stableOptions.length === 0) return;

            switch (e.key) {
                case ' ':
                case 'Enter': {
                    e.preventDefault();
                    e.stopPropagation();
                    if (focusedIndex !== null && stableOptions[focusedIndex]) {
                        handleToggle(stableOptions[focusedIndex].value);
                    }
                    break;
                }
                case 'ArrowDown': {
                    e.preventDefault();
                    e.stopPropagation();
                    const newIndex =
                        focusedIndex === null
                            ? 0
                            : Math.min(focusedIndex + 1, stableOptions.length - 1);
                    setFocusedIndex(newIndex);
                    scrollToIndex(newIndex);
                    break;
                }
                case 'ArrowUp': {
                    e.preventDefault();
                    e.stopPropagation();
                    const newIndex = focusedIndex === null ? 0 : Math.max(focusedIndex - 1, 0);
                    setFocusedIndex(newIndex);
                    scrollToIndex(newIndex);
                    break;
                }
                case 'Tab': {
                    setFocusedIndex(null);
                    break;
                }
                default:
                    break;
            }
        },
        [disabled, focusedIndex, handleToggle, scrollToIndex, stableOptions],
    );

    return (
        <div
            className={clsx(styles.container, {
                [styles.disabled]: disabled,
            })}
        >
            <TextInput
                disabled={disabled}
                label={labelWithClear}
                leftSection={
                    value.length > 0 && !disabled ? (
                        <ActionIcon
                            icon="x"
                            iconProps={{ size: 'md' }}
                            onClick={() => {
                                onChange(null);
                                setSearch('');
                            }}
                            size="xs"
                            variant="subtle"
                        />
                    ) : undefined
                }
                onChange={(e) => {
                    if (!disabled) {
                        setSearch(e.currentTarget.value);
                    }
                }}
                placeholder={placeholder}
                rightSection={
                    <Group gap="xs" wrap="nowrap">
                        {search && !disabled ? (
                            <ActionIcon
                                icon="x"
                                iconProps={{ size: 'md' }}
                                onClick={() => setSearch('')}
                                size="xs"
                                variant="subtle"
                            />
                        ) : (
                            <Icon icon="search" />
                        )}
                    </Group>
                }
                styles={{
                    input: disabled ? { opacity: 0.6 } : undefined,
                    label: { width: '100%' },
                    section: disabled ? { opacity: 0.6 } : undefined,
                    wrapper: disabled ? { opacity: 0.6 } : undefined,
                }}
                value={search}
            />
            <div
                className={styles.listContainer}
                onKeyDown={handleKeyDown}
                onMouseDown={(e) => {
                    if (disabled) return;
                    const element = e.currentTarget as HTMLDivElement;
                    if (element.focus) {
                        element.focus({ preventScroll: true });
                    }
                }}
                ref={listContainerRef}
                style={{ height: `${height}px` }}
                tabIndex={disabled ? -1 : 0}
            >
                {isLoading ? (
                    <Center h="100%" w="100%">
                        <Spinner container />
                    </Center>
                ) : stableOptions.length === 0 ? (
                    <Center h="100%" w="100%">
                        <Text isMuted isNoSelect size="sm">
                            {t('common.noResultsFromQuery', { postProcess: 'sentenceCase' })}
                        </Text>
                    </Center>
                ) : (
                    <List
                        listRef={listRef}
                        rowComponent={RowComponent}
                        rowCount={stableOptions.length}
                        rowHeight={rowHeight}
                        rowProps={{
                            disabled,
                            displayCountType,
                            focusedIndex,
                            onToggle: handleToggle,
                            options: stableOptions,
                            value,
                        }}
                    />
                )}
            </div>
            {selectedOptions.length > 0 && (
                <Stack gap="xs" mt="sm">
                    {selectedOptions.map((option) => (
                        <Group
                            className={clsx(styles.selectedOption, {
                                [styles.disabled]: disabled,
                            })}
                            gap="sm"
                            key={option.value}
                            onClick={() => handleDeselect(option.value)}
                            wrap="nowrap"
                        >
                            {!disabled && (
                                <ActionIcon
                                    icon="minus"
                                    iconProps={{ size: 'sm' }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeselect(option.value);
                                    }}
                                    size="xs"
                                    stopsPropagation
                                    variant="transparent"
                                />
                            )}
                            <Text isNoSelect overflow="hidden" size="sm">
                                {option.label}
                            </Text>
                        </Group>
                    ))}
                </Stack>
            )}
        </div>
    );
}
