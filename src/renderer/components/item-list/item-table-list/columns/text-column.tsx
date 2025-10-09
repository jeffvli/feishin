import clsx from 'clsx';

import styles from './text-column.module.css';

import {
    ItemTableListInnerColumn,
    TableColumnTextContainer,
} from '/@/renderer/components/item-list/item-table-list/item-table-list-column';
import { Skeleton } from '/@/shared/components/skeleton/skeleton';

export const TextColumn = (props: ItemTableListInnerColumn) => {
    const row: string | undefined = (props.data as (any | undefined)[])[props.rowIndex]?.[
        props.columns[props.columnIndex].id
    ];

    if (typeof row === 'string' && row) {
        return (
            <TableColumnTextContainer
                className={clsx(styles.textContainer, {
                    [styles.compact]: props.size === 'compact',
                    [styles.large]: props.size === 'large',
                })}
                {...props}
            >
                {row}
            </TableColumnTextContainer>
        );
    }

    return (
        <TableColumnTextContainer {...props}>
            <Skeleton />
        </TableColumnTextContainer>
    );
};
