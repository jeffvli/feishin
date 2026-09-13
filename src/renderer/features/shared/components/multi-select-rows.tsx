import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { RowComponentProps } from 'react-window-v2';

import styles from './multi-select-rows.module.css';

import { ItemImage } from '/@/renderer/components/item-image/item-image';
import { Group } from '/@/shared/components/group/group';
import { VirtualMultiSelectOption } from '/@/shared/components/multi-select/virtual-multi-select';
import { Text } from '/@/shared/components/text/text';
import { LibraryItem } from '/@/shared/types/domain-types';

export function ArtistMultiSelectRow({
    disabled = false,
    displayCountType = 'album',
    focusedIndex,
    index,
    onToggle,
    options,
    style,
}: RowComponentProps<{
    disabled?: boolean;
    displayCountType?: 'album' | 'song';
    focusedIndex: null | number;
    onToggle: (value: string) => void;
    options: VirtualMultiSelectOption<{
        albumCount: null | number;
        blurHash?: null | string;
        imageUrl: string | undefined;
        songCount: null | number;
        thumbHash?: null | string;
    }>[];
    value: string[];
}>) {
    const { t } = useTranslation();

    const handleClick = useCallback(() => {
        onToggle(options[index].value);
    }, [onToggle, options, index]);

    const isFocused = focusedIndex === index;
    const count =
        displayCountType === 'song' ? options[index].songCount : options[index].albumCount;
    const countEntity = displayCountType === 'song' ? 'song' : 'album';

    return (
        <Group
            className={`${styles.row} ${disabled ? styles.disabled : ''}`}
            gap="sm"
            onClick={disabled ? undefined : handleClick}
            style={{ ...style }}
            {...(isFocused && !disabled && { 'data-focused': true })}
        >
            <ItemImage
                blurHash={options[index].blurHash}
                containerClassName={styles.rowImage}
                enableDebounce={true}
                enableViewport={false}
                itemType={LibraryItem.ARTIST}
                src={options[index].imageUrl}
                thumbHash={options[index].thumbHash}
                type="table"
            />
            <div className={styles.rowContent}>
                <Text isNoSelect overflow="hidden" size="sm">
                    {options[index].label}
                </Text>
                <Text isMuted overflow="hidden" size="xs">
                    {count ? (
                        <>
                            {count} {t(`entity.${countEntity}`, { count })}
                        </>
                    ) : null}
                </Text>
            </div>
        </Group>
    );
}

export function GenreMultiSelectRow({
    disabled = false,
    displayCountType = 'album',
    focusedIndex,
    index,
    onToggle,
    options,
    style,
}: RowComponentProps<{
    disabled?: boolean;
    displayCountType?: 'album' | 'song';
    focusedIndex: null | number;
    onToggle: (value: string) => void;
    options: VirtualMultiSelectOption<{
        albumCount: null | number;
        songCount: null | number;
    }>[];
    value: string[];
}>) {
    const { t } = useTranslation();

    const handleClick = useCallback(() => {
        onToggle(options[index].value);
    }, [onToggle, options, index]);

    const isFocused = focusedIndex === index;
    const count =
        displayCountType === 'song' ? options[index].songCount : options[index].albumCount;
    const countEntity = displayCountType === 'song' ? 'song' : 'album';

    return (
        <Group
            className={`${styles.row} ${disabled ? styles.disabled : ''}`}
            gap="sm"
            onClick={disabled ? undefined : handleClick}
            style={{ ...style }}
            {...(isFocused && !disabled && { 'data-focused': true })}
        >
            <div className={styles.rowContent}>
                <Text isNoSelect overflow="hidden" size="sm">
                    {options[index].label}
                </Text>
                <Text isMuted overflow="hidden" size="xs">
                    {count ? (
                        <>
                            {count} {t(`entity.${countEntity}`, { count })}
                        </>
                    ) : null}
                </Text>
            </div>
        </Group>
    );
}
