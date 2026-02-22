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
import { useIsActiveRow } from '/@/renderer/components/item-list/item-table-list/item-table-list-context';
import { ExplicitIndicator } from '/@/shared/components/explicit-indicator/explicit-indicator';
import { Text } from '/@/shared/components/text/text';
import { LibraryItem, QueueSong } from '/@/shared/types/domain-types';

const TitleColumnBase = (props: ItemTableListInnerColumn) => {
    const { itemType } = props;

    switch (itemType) {
        case LibraryItem.FOLDER:
        case LibraryItem.PLAYLIST_SONG:
        case LibraryItem.QUEUE_SONG:
        case LibraryItem.SONG:
            return <QueueSongTitleColumn {...props} />;
        default:
            return <DefaultTitleColumn {...props} />;
    }
};

export const TitleColumn = TitleColumnBase;

function DefaultTitleColumn(props: ItemTableListInnerColumn) {
    const rowItem = props.getRowItem?.(props.rowIndex) ?? (props.data as any[])[props.rowIndex];
    const row: string | undefined = rowItem?.[props.columns[props.columnIndex].id];

    if (typeof row === 'string') {
        const path = getTitlePath(props.itemType, (rowItem as any).id as string);
        const item = rowItem as any;

        const titleLinkProps = path
            ? {
                  component: Link,
                  isLink: true,
                  state: { item },
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
                    <ExplicitIndicator explicitStatus={item?.explicitStatus} />
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
    const rowItem = props.getRowItem?.(props.rowIndex) ?? (props.data as any[])[props.rowIndex];
    const row: string | undefined = rowItem?.[props.columns[props.columnIndex].id];

    const song = rowItem as QueueSong;
    const isActive = useIsActiveRow(song?.id, song?._uniqueId);

    if (typeof row === 'string') {
        const path = getTitlePath(props.itemType, (rowItem as any).id as string);
        const item = rowItem as any;

        const titleLinkProps = path
            ? {
                  component: Link,
                  isLink: true,
                  state: { item },
                  to: path,
              }
            : {};

        return (
            <TableColumnContainer {...props}>
                <Text
                    className={clsx({
                        [styles.active]: isActive,
                        [styles.compact]: props.size === 'compact',
                        [styles.large]: props.size === 'large',
                        [styles.nameContainer]: true,
                    })}
                    isNoSelect
                    {...titleLinkProps}
                >
                    <ExplicitIndicator explicitStatus={song?.explicitStatus} />
                    {row}
                    {song?.trackSubtitle && props.itemType !== LibraryItem.QUEUE_SONG && (
                        <Text
                            className={clsx({
                                [styles.active]: isActive,
                            })}
                            component="span"
                            isMuted
                            size="sm"
                        >
                            {' ('}
                            {song.trackSubtitle}
                            {')'}
                        </Text>
                    )}
                </Text>
            </TableColumnContainer>
        );
    }

    if (row === null) {
        return <ColumnNullFallback {...props} />;
    }

    return <ColumnSkeletonVariable {...props} />;
}
