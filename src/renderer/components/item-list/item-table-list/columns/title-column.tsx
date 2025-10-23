import clsx from 'clsx';
import { Link } from 'react-router';

import styles from './title-column.module.css';

import { getTitlePath } from '/@/renderer/components/item-list/helpers/get-title-path';
import {
    ItemTableListInnerColumn,
    TableColumnContainer,
    TableColumnTextContainer,
} from '/@/renderer/components/item-list/item-table-list/item-table-list-column';
import { Skeleton } from '/@/shared/components/skeleton/skeleton';
import { Text } from '/@/shared/components/text/text';

export const TitleColumn = (props: ItemTableListInnerColumn) => {
    const row: string | undefined = (props.data as (any | undefined)[])[props.rowIndex]?.[
        props.columns[props.columnIndex].id
    ];

    if (typeof row === 'string') {
        const path = getTitlePath(props.itemType, (props.data[props.rowIndex] as any).id as string);

        const titleLinkProps = path
            ? {
                  component: Link,
                  isLink: true,
                  to: path,
              }
            : {};

        return (
            <TableColumnContainer {...props}>
                <Text
                    className={clsx({
                        [styles.compact]: props.size === 'compact',
                        [styles.large]: props.size === 'large',
                        [styles.nameContainer]: true,
                    })}
                    {...titleLinkProps}
                >
                    {row}
                </Text>
            </TableColumnContainer>
        );
    }

    return (
        <TableColumnTextContainer {...props}>
            <Skeleton />
        </TableColumnTextContainer>
    );
};
