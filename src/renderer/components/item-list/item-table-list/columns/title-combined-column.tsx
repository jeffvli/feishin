import { CSSProperties, useMemo } from 'react';
import { generatePath, Link } from 'react-router-dom';

import styles from './title-combined-column.module.css';

import { getTitlePath } from '/@/renderer/components/item-list/helpers/get-title-path';
import {
    ItemTableListInnerColumn,
    TableColumnContainer,
    TableColumnTextContainer,
} from '/@/renderer/components/item-list/item-table-list/item-table-list-column';
import { AppRoute } from '/@/renderer/router/routes';
import { Image } from '/@/shared/components/image/image';
import { Skeleton } from '/@/shared/components/skeleton/skeleton';
import { Text } from '/@/shared/components/text/text';
import { RelatedAlbumArtist } from '/@/shared/types/domain-types';

export const TitleCombinedColumn = (props: ItemTableListInnerColumn) => {
    const row: object | undefined = (props.data as (any | undefined)[])[props.rowIndex];

    const artists = useMemo(() => {
        if (row && 'artists' in row && Array.isArray(row.artists)) {
            return (row.artists as RelatedAlbumArtist[]).map((artist) => {
                const path = generatePath(AppRoute.LIBRARY_ARTISTS_DETAIL, {
                    artistId: artist.id,
                });
                return { ...artist, path };
            });
        }
        return [];
    }, [row]);

    if (row && 'name' in row && 'imageUrl' in row && 'artists' in row) {
        const rowHeight = props.getRowHeight(props.rowIndex, props);
        const path = getTitlePath(props.itemType, (props.data[props.rowIndex] as any).id as string);

        const titleLinkProps = path
            ? {
                  component: Link,
                  isLink: true,
                  to: path,
              }
            : {};

        return (
            <TableColumnContainer
                className={styles['title-combined']}
                containerStyle={{ '--row-height': `${rowHeight}px` } as CSSProperties}
                {...props}
            >
                <Image containerClassName={styles.image} src={row.imageUrl as string} />
                <div className={styles['text-container']}>
                    <Text className={styles.title} isNoSelect {...titleLinkProps}>
                        {row.name as string}
                    </Text>
                    <div className={styles.artists}>
                        {artists.map((artist, index) => (
                            <span key={artist.id}>
                                <Text component={Link} isLink isMuted isNoSelect to={artist.path}>
                                    {artist.name}
                                </Text>
                                {index < artists.length - 1 && ', '}
                            </span>
                        ))}
                    </div>
                </div>
            </TableColumnContainer>
        );
    }

    return (
        <TableColumnTextContainer {...props}>
            <Skeleton />
        </TableColumnTextContainer>
    );
};
