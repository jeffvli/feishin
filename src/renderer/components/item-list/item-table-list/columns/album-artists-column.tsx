import { memo, useMemo } from 'react';
import { generatePath, Link } from 'react-router-dom';

import styles from './album-artists-column.module.css';

import {
    ItemTableListInnerColumn,
    TableColumnContainer,
    TableColumnTextContainer,
} from '/@/renderer/components/item-list/item-table-list/item-table-list-column';
import { AppRoute } from '/@/renderer/router/routes';
import { Group } from '/@/shared/components/group/group';
import { Skeleton } from '/@/shared/components/skeleton/skeleton';
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
                <Group className={styles.group} wrap="wrap">
                    {albumArtists.map((albumArtist, index) => (
                        <Text
                            component={Link}
                            isLink
                            isMuted
                            isNoSelect
                            key={albumArtist.id}
                            to={albumArtist.path}
                        >
                            {albumArtist.name}
                            {index < albumArtists.length - 1 && ','}
                        </Text>
                    ))}
                </Group>
            </TableColumnContainer>
        );
    }

    return (
        <TableColumnTextContainer {...props}>
            <Skeleton />
        </TableColumnTextContainer>
    );
};

export const AlbumArtistsColumnMemo = memo(AlbumArtistsColumn);

export { AlbumArtistsColumnMemo as AlbumArtistsColumn };
