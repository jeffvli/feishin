import clsx from 'clsx';
import { Fragment, memo, useMemo } from 'react';
import { generatePath, Link } from 'react-router';

import styles from './genre-column.module.css';

import {
    ColumnNullFallback,
    ColumnSkeletonVariable,
    ItemTableListInnerColumn,
    TableColumnContainer,
} from '/@/renderer/components/item-list/item-table-list/item-table-list-column';
import { AppRoute } from '/@/renderer/router/routes';
import { Text } from '/@/shared/components/text/text';
import { Genre } from '/@/shared/types/domain-types';

const GenreColumn = (props: ItemTableListInnerColumn) => {
    const row: Genre[] | undefined = (props.data as (Genre[] | undefined)[])[props.rowIndex]?.[
        props.columns[props.columnIndex].id
    ];

    const genres = useMemo(() => {
        if (!row) return [];
        return row.map((genre) => {
            const path = generatePath(AppRoute.LIBRARY_GENRES_ALBUMS, {
                genreId: genre.id,
            });
            return { ...genre, path };
        });
    }, [row]);

    if (Array.isArray(row)) {
        return (
            <TableColumnContainer {...props}>
                <div
                    className={clsx(styles.genresContainer, {
                        [styles.compact]: props.size === 'compact',
                        [styles.large]: props.size === 'large',
                    })}
                >
                    {genres.map((genre, index) => (
                        <Fragment key={genre.id}>
                            <Text
                                component={Link}
                                isLink
                                isMuted
                                isNoSelect
                                state={{ item: genre }}
                                to={genre.path}
                            >
                                {genre.name}
                            </Text>
                            {index < genres.length - 1 && ', '}
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

export const GenreColumnMemo = memo(GenreColumn);

export { GenreColumnMemo as GenreColumn };
