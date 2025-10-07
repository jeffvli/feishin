import styles from './image-column.module.css';

import {
    ItemTableListInnerColumn,
    TableColumnContainer,
    TableColumnTextContainer,
} from '/@/renderer/components/item-list/item-table-list/item-table-list-column';
import { Image } from '/@/shared/components/image/image';
import { Skeleton } from '/@/shared/components/skeleton/skeleton';

export const ImageColumn = (props: ItemTableListInnerColumn) => {
    const row: string | undefined = (props.data as (any | undefined)[])[props.rowIndex]?.[
        props.columns[props.columnIndex].id
    ];

    if (typeof row === 'string') {
        return (
            <TableColumnTextContainer {...props}>
                <Image src={row} />
            </TableColumnTextContainer>
        );
    }

    return (
        <TableColumnContainer {...props}>
            <Skeleton containerClassName={styles.skeleton} />
        </TableColumnContainer>
    );
};
