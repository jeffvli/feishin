import clsx from 'clsx';
import { CSSProperties } from 'react';
import { Link } from 'react-router';

import styles from './title-artist-column.module.css';

import { getTitlePath } from '/@/renderer/components/item-list/helpers/get-title-path';
import {
    ColumnNullFallback,
    ColumnSkeletonVariable,
    ItemTableListInnerColumn,
    TableColumnContainer,
} from '/@/renderer/components/item-list/item-table-list/item-table-list-column';
import { useIsActiveRow } from '/@/renderer/components/item-list/item-table-list/item-table-list-context';
import { JoinedArtists } from '/@/renderer/features/albums/components/joined-artists';
import { ExplicitIndicator } from '/@/shared/components/explicit-indicator/explicit-indicator';
import { Icon } from '/@/shared/components/icon/icon';
import { Text } from '/@/shared/components/text/text';
import { Folder, LibraryItem, QueueSong } from '/@/shared/types/domain-types';

export const DefaultTitleArtistColumn = (props: ItemTableListInnerColumn) => {
    const rowItem = props.getRowItem?.(props.rowIndex) ?? (props.data as any[])[props.rowIndex];
    const row: object | undefined = (rowItem as any)?.id;
    const item = rowItem as any;
    const align = props.columns[props.columnIndex]?.align || 'start';

    if (item && 'name' in item && 'artists' in item) {
        const rowHeight = props.getRowHeight(props.rowIndex, props);
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
            <TableColumnContainer
                className={clsx(styles.titleArtist)}
                containerStyle={{ '--row-height': `${rowHeight}px` } as CSSProperties}
                {...props}
            >
                <div
                    className={clsx(styles.textContainer, {
                        [styles.alignCenter]: align === 'center',
                        [styles.alignLeft]: align === 'start',
                        [styles.alignRight]: align === 'end',
                        [styles.compact]: props.size === 'compact',
                    })}
                >
                    <Text className={styles.title} isNoSelect size="md" {...titleLinkProps}>
                        <ExplicitIndicator explicitStatus={item?.explicitStatus} />
                        {item.name as string}
                    </Text>
                    <div className={styles.artists}>
                        <JoinedArtists
                            artistName={item.albumArtist}
                            artists={item.albumArtists}
                            linkProps={{ fw: 400, isMuted: true }}
                            rootTextProps={{ fw: 400, isMuted: true, size: 'sm' }}
                        />
                    </div>
                </div>
            </TableColumnContainer>
        );
    }

    if (row === null) {
        return <ColumnNullFallback {...props} />;
    }

    return <ColumnSkeletonVariable {...props} />;
};

export const QueueSongTitleArtistColumn = (props: ItemTableListInnerColumn) => {
    const rowItem = props.getRowItem?.(props.rowIndex) ?? (props.data as any[])[props.rowIndex];
    const row: object | undefined = rowItem as any;

    const song = rowItem as QueueSong;
    const isActive = useIsActiveRow(song?.id, song?._uniqueId);
    const align = props.columns[props.columnIndex]?.align || 'start';
    const alignClass =
        align === 'center' ? 'align-center' : align === 'end' ? 'align-right' : 'align-left';

    if (row && 'name' in row && 'artists' in row) {
        const rowHeight = props.getRowHeight(props.rowIndex, props);
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
            <TableColumnContainer
                className={clsx(styles.titleArtist, styles[alignClass])}
                containerStyle={{ '--row-height': `${rowHeight}px` } as CSSProperties}
                {...props}
            >
                <div
                    className={clsx(styles.textContainer, styles[alignClass], {
                        [styles.active]: isActive,
                        [styles.compact]: props.size === 'compact',
                    })}
                >
                    <Text
                        className={clsx({
                            [styles.active]: isActive,
                            [styles.title]: true,
                        })}
                        isNoSelect
                        size="md"
                        {...titleLinkProps}
                    >
                        <ExplicitIndicator explicitStatus={song?.explicitStatus} />
                        {row.name as string}
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
                    <div className={styles.artists}>
                        <JoinedArtists
                            artistName={item.artistName}
                            artists={item.artists}
                            linkProps={{ fw: 400, isMuted: true }}
                            rootTextProps={{ fw: 400, isMuted: true, size: 'sm' }}
                        />
                    </div>
                </div>
            </TableColumnContainer>
        );
    }

    if ((rowItem as unknown as Folder)?._itemType === LibraryItem.FOLDER) {
        const rowHeight = props.getRowHeight(props.rowIndex, props);
        const path = getTitlePath(props.itemType, (rowItem as any).id as string);

        const item = rowItem as any;
        const textStyles = isActive ? { color: 'var(--theme-colors-primary)' } : {};

        const titleLinkProps = path
            ? {
                  component: Link,
                  isLink: true,
                  state: { item },
                  to: path,
              }
            : {};

        const title = (rowItem as unknown as Folder)?.name;

        return (
            <TableColumnContainer
                className={clsx(styles.titleArtist, styles[alignClass])}
                containerStyle={{ '--row-height': `${rowHeight}px` } as CSSProperties}
                {...props}
            >
                <Icon className={styles.folderIcon} icon="folder" size="2xl" />
                <Text
                    className={styles.title}
                    isNoSelect
                    size="md"
                    {...titleLinkProps}
                    style={textStyles}
                >
                    {title}
                </Text>
            </TableColumnContainer>
        );
    }

    if (row === null) {
        return <ColumnNullFallback {...props} />;
    }

    return <ColumnSkeletonVariable {...props} />;
};

const TitleArtistColumnBase = (props: ItemTableListInnerColumn) => {
    const { itemType } = props;

    switch (itemType) {
        case LibraryItem.FOLDER:
        case LibraryItem.PLAYLIST_SONG:
        case LibraryItem.QUEUE_SONG:
        case LibraryItem.SONG:
            return <QueueSongTitleArtistColumn {...props} />;
        default:
            return <DefaultTitleArtistColumn {...props} />;
    }
};

export const TitleArtistColumn = TitleArtistColumnBase;
