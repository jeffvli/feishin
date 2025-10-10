import {
    ItemTableListInnerColumn,
    TableColumnContainer,
} from '/@/renderer/components/item-list/item-table-list/item-table-list-column';
import { useSetRating } from '/@/renderer/features/shared/mutations/set-rating-mutation';
import { Rating } from '/@/shared/components/rating/rating';

export const RatingColumn = (props: ItemTableListInnerColumn) => {
    const row: null | number | undefined = (props.data as (any | undefined)[])[props.rowIndex]?.[
        props.columns[props.columnIndex].id
    ];

    const setRatingMutation = useSetRating({});

    const handleChangeRating = (rating: number) => {
        const previousRating = row || 0;

        let newRating = rating;

        if (previousRating === rating) {
            newRating = 0;
        }

        const item = props.data[props.rowIndex] as any;

        setRatingMutation.mutate({
            query: {
                item: [item],
                rating: newRating,
            },
            serverId: item.serverId as string,
        });
    };

    if (typeof row === 'number' || row === null) {
        return (
            <TableColumnContainer {...props}>
                <Rating
                    className={row ? undefined : 'hover-only-flex'}
                    onChange={handleChangeRating}
                    size="xs"
                    value={row || 0}
                />
            </TableColumnContainer>
        );
    }

    return <TableColumnContainer {...props}>&nbsp;</TableColumnContainer>;
};
