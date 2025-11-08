import {
    ItemTableListInnerColumn,
    TableColumnContainer,
} from '/@/renderer/components/item-list/item-table-list/item-table-list-column';
import { useCreateFavorite } from '/@/renderer/features/shared/mutations/create-favorite-mutation';
import { useDeleteFavorite } from '/@/renderer/features/shared/mutations/delete-favorite-mutation';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { LibraryItem } from '/@/shared/types/domain-types';

export const FavoriteColumn = (props: ItemTableListInnerColumn) => {
    const row: boolean | undefined = (props.data as (any | undefined)[])[props.rowIndex]?.[
        props.columns[props.columnIndex].id
    ];

    const createFavorite = useCreateFavorite({});
    const deleteFavorite = useDeleteFavorite({});

    if (typeof row === 'boolean') {
        return (
            <TableColumnContainer {...props}>
                <ActionIcon
                    className={row ? undefined : 'hover-only'}
                    icon="favorite"
                    iconProps={{
                        color: row ? 'primary' : 'muted',
                        fill: row ? 'primary' : undefined,
                        size: 'md',
                    }}
                    onClick={() => {
                        if (!props.data?.[props.rowIndex]) {
                            return;
                        }

                        if (row) {
                            deleteFavorite.mutate({
                                apiClientProps: {
                                    serverId: (props.data as any)[props.rowIndex]
                                        .serverId as string,
                                },
                                query: {
                                    id: [(props.data as any)[props.rowIndex].id as string],
                                    type: (props.data as any)[props.rowIndex]
                                        .itemType as LibraryItem,
                                },
                            });
                        } else {
                            createFavorite.mutate({
                                apiClientProps: {
                                    serverId: (props.data as any)[props.rowIndex]
                                        .serverId as string,
                                },
                                query: {
                                    id: [(props.data as any)[props.rowIndex].id as string],
                                    type: (props.data as any)[props.rowIndex]
                                        .itemType as LibraryItem,
                                },
                            });
                        }
                    }}
                    size="xs"
                    variant="subtle"
                />
            </TableColumnContainer>
        );
    }

    return <TableColumnContainer {...props}>&nbsp;</TableColumnContainer>;
};
