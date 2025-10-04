import {
    ItemTableListInnerColumn,
    TableColumnContainer,
    TableColumnTextContainer,
} from '/@/renderer/components/item-list/item-table-list/item-table-list-column';
import { Badge } from '/@/shared/components/badge/badge';
import { Group } from '/@/shared/components/group/group';
import { Skeleton } from '/@/shared/components/skeleton/skeleton';
import { Genre } from '/@/shared/types/domain-types';
import { stringToColor } from '/@/shared/utils/string-to-color';

export const GenreColumn = (props: ItemTableListInnerColumn) => {
    const row: Genre[] | undefined = (props.data as (Genre[] | undefined)[])[props.rowIndex]?.[
        props.columns[props.columnIndex].id
    ];

    const genres = (row || []).map((genre) => {
        const { color, isLight } = stringToColor(genre.name);
        return { ...genre, color, isLight };
    });

    if (Array.isArray(row)) {
        return (
            <TableColumnContainer {...props}>
                <Group gap="xs" wrap="nowrap">
                    {genres.map((genre) => (
                        <Badge
                            key={genre.id}
                            style={{
                                backgroundColor: genre.color,
                                color: genre.isLight ? 'black' : 'white',
                            }}
                        >
                            {genre.name}
                        </Badge>
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
