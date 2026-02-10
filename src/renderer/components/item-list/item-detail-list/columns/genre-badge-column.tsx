import { useMemo } from 'react';
import { generatePath, Link } from 'react-router';

import styles from './genre-badge-column.module.css';
import { ItemDetailListCellProps } from './types';

import { AppRoute } from '/@/renderer/router/routes';
import { Badge } from '/@/shared/components/badge/badge';
import { Group } from '/@/shared/components/group/group';
import { stringToColor } from '/@/shared/utils/string-to-color';

const MAX_GENRES = 4;

export const GenreBadgeColumn = ({ song }: ItemDetailListCellProps) => {
    const genres = song.genres;

    const genresWithStyle = useMemo(() => {
        if (!genres) return [];
        return genres.slice(0, MAX_GENRES).map((genre) => {
            const { color, isLight } = stringToColor(genre.name);
            const path = generatePath(AppRoute.LIBRARY_GENRES_DETAIL, { genreId: genre.id });
            return { ...genre, color, isLight, path };
        });
    }, [genres]);

    if (!genresWithStyle.length) return <>&nbsp;</>;

    return (
        <Group className={styles.group} wrap="nowrap">
            {genresWithStyle.map((genre) => (
                <Badge
                    component={Link}
                    key={genre.id}
                    state={{ item: genre }}
                    style={{
                        backgroundColor: genre.color,
                        color: genre.isLight ? 'black' : 'white',
                    }}
                    to={genre.path}
                >
                    {genre.name}
                </Badge>
            ))}
        </Group>
    );
};
