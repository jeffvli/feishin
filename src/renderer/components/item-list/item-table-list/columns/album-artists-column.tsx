import clsx from 'clsx';
import { Fragment, memo, useMemo } from 'react';
import { generatePath, Link } from 'react-router';

import styles from './album-artists-column.module.css';

import {
    ColumnNullFallback,
    ColumnSkeletonVariable,
    ItemTableListInnerColumn,
    TableColumnContainer,
} from '/@/renderer/components/item-list/item-table-list/item-table-list-column';
import { AppRoute } from '/@/renderer/router/routes';
import { Text } from '/@/shared/components/text/text';
import { RelatedAlbumArtist } from '/@/shared/types/domain-types';

const AlbumArtistsColumn = (props: ItemTableListInnerColumn) => {
    const row: RelatedAlbumArtist[] | undefined = (
        props.data as (RelatedAlbumArtist[] | undefined)[]
    )[props.rowIndex]?.[props.columns[props.columnIndex].id];

    const albumArtists = useMemo(() => {
        if (!row) return [];
        return row.map((albumArtist) => {
            const path = generatePath(AppRoute.LIBRARY_ALBUM_ARTISTS_DETAIL, {
                albumArtistId: albumArtist.id,
            });
            return { ...albumArtist, path };
        });
    }, [row]);

    if (Array.isArray(row)) {
        return (
            <TableColumnContainer {...props}>
                <div
                    className={clsx(styles.artistsContainer, {
                        [styles.compact]: props.size === 'compact',
                        [styles.large]: props.size === 'large',
                    })}
                >
                    {albumArtists.map((albumArtist, index) => (
                        <Fragment key={albumArtist.id}>
                            <Text component={Link} isLink isMuted isNoSelect to={albumArtist.path}>
                                {albumArtist.name}
                            </Text>
                            {index < albumArtists.length - 1 && ', '}
                        </Fragment>
                    ))}
                </div>
            </TableColumnContainer>
        );
    }

    if (row === null) {
        return <ColumnNullFallback {...props} />;
    }

    return <ColumnSkeletonVariable {...props} />;
};

export const AlbumArtistsColumnMemo = memo(AlbumArtistsColumn);

export { AlbumArtistsColumnMemo as AlbumArtistsColumn };
