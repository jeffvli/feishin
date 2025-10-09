import clsx from 'clsx';
import { memo, useMemo } from 'react';
import { generatePath, Link } from 'react-router-dom';

import styles from './album-artists-column.module.css';

import {
    ItemTableListInnerColumn,
    TableColumnContainer,
    TableColumnTextContainer,
} from '/@/renderer/components/item-list/item-table-list/item-table-list-column';
import { AppRoute } from '/@/renderer/router/routes';
import { Skeleton } from '/@/shared/components/skeleton/skeleton';
import { Text } from '/@/shared/components/text/text';
import { RelatedAlbumArtist } from '/@/shared/types/domain-types';

const ArtistsColumn = (props: ItemTableListInnerColumn) => {
    const row: RelatedAlbumArtist[] | undefined = (
        props.data as (RelatedAlbumArtist[] | undefined)[]
    )[props.rowIndex]?.[props.columns[props.columnIndex].id];

    const artists = useMemo(() => {
        if (!row) return [];
        return row.map((artist) => {
            const path = generatePath(AppRoute.LIBRARY_ARTISTS_DETAIL, {
                artistId: artist.id,
            });
            return { ...artist, path };
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
                    {artists.map((artist, index) => (
                        <Text
                            component={Link}
                            isLink
                            isMuted
                            isNoSelect
                            key={artist.id}
                            to={artist.path}
                        >
                            {artist.name}
                            {index < artists.length - 1 && ', '}
                        </Text>
                    ))}
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

export const ArtistsColumnMemo = memo(ArtistsColumn);

export { ArtistsColumnMemo as ArtistsColumn };
