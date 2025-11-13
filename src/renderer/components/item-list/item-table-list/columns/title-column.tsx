import clsx from 'clsx';
import { Link } from 'react-router';

import styles from './title-column.module.css';

import { getTitlePath } from '/@/renderer/components/item-list/helpers/get-title-path';
import {
    ColumnNullFallback,
    ColumnSkeletonVariable,
    ItemTableListInnerColumn,
    TableColumnContainer,
} from '/@/renderer/components/item-list/item-table-list/item-table-list-column';
import { useIsCurrentSong } from '/@/renderer/features/player/hooks/use-is-current-song';
import { Text } from '/@/shared/components/text/text';
import { LibraryItem, QueueSong } from '/@/shared/types/domain-types';

export const TitleColumn = (props: ItemTableListInnerColumn) => {
    const { itemType } = props;

    switch (itemType) {
        case LibraryItem.QUEUE_SONG:
            return <QueueSongTitleColumn {...props} />;
        default:
            return <DefaultTitleColumn {...props} />;
    }
};

function DefaultTitleColumn(props: ItemTableListInnerColumn) {
    const row: string | undefined = (props.data as (any | undefined)[])[props.rowIndex]?.[
        props.columns[props.columnIndex].id
    ];

    if (typeof row === 'string') {
        const path = getTitlePath(props.itemType, (props.data[props.rowIndex] as any).id as string);

        const titleLinkProps = path
            ? {
                  component: Link,
                  isLink: true,
                  to: path,
              }
            : {};

        return (
            <TableColumnContainer {...props}>
                <Text
                    className={clsx({
                        [styles.compact]: props.size === 'compact',
                        [styles.large]: props.size === 'large',
                        [styles.nameContainer]: true,
                    })}
                    isNoSelect
                    {...titleLinkProps}
                >
                    {row}
                </Text>
            </TableColumnContainer>
        );
    }

    if (row === null) {
        return <ColumnNullFallback {...props} />;
    }

    return <ColumnSkeletonVariable {...props} />;
}

function QueueSongTitleColumn(props: ItemTableListInnerColumn) {
    const row: string | undefined = (props.data as (any | undefined)[])[props.rowIndex]?.[
        props.columns[props.columnIndex].id
    ];

    const { isActive } = useIsCurrentSong(props.data[props.rowIndex] as QueueSong);

    if (typeof row === 'string') {
        const path = getTitlePath(props.itemType, (props.data[props.rowIndex] as any).id as string);

        const textStyles = isActive ? { color: 'var(--theme-colors-primary)' } : {};

        const titleLinkProps = path
            ? {
                  component: Link,
                  isLink: true,
                  to: path,
              }
            : {};

        return (
            <TableColumnContainer {...props}>
                <Text
                    className={clsx({
                        [styles.compact]: props.size === 'compact',
                        [styles.large]: props.size === 'large',
                        [styles.nameContainer]: true,
                    })}
                    isNoSelect
                    {...titleLinkProps}
                    style={textStyles}
                >
                    {row}
                </Text>
            </TableColumnContainer>
        );
    }

    if (row === null) {
        return <ColumnNullFallback {...props} />;
    }

    return <ColumnSkeletonVariable {...props} />;
}
