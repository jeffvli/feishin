import { Fragment } from 'react';
import { generatePath, Link } from 'react-router';

import { ItemDetailListCellProps } from '/@/renderer/components/item-list/item-detail-list/columns/types';
import { AppRoute } from '/@/renderer/router/routes';
import { Text } from '/@/shared/components/text/text';

const TEXT_PROPS = { isMuted: true, isNoSelect: true, size: 'sm' as const } as const;

export const GenreColumn = ({ isRowHovered, song }: ItemDetailListCellProps) => {
    const genres = song.genres ?? [];
    if (!genres.length) return <>&nbsp;</>;

    return (
        <>
            {genres.map((genre, index) => (
                <Fragment key={genre.id}>
                    {isRowHovered ? (
                        <Text
                            component={Link}
                            isLink
                            state={{ item: genre }}
                            to={generatePath(AppRoute.LIBRARY_GENRES_DETAIL, {
                                genreId: genre.id,
                            })}
                            {...TEXT_PROPS}
                        >
                            {genre.name}
                        </Text>
                    ) : (
                        <Text component="span" {...TEXT_PROPS}>
                            {genre.name}
                        </Text>
                    )}
                    {index < genres.length - 1 && ', '}
                </Fragment>
            ))}
        </>
    );
};
