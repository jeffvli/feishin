import clsx from 'clsx';

import { ItemTableListColumn } from '/@/renderer/components/item-list/item-table-list/item-table-list-column';
import { TableColumn } from '/@/shared/types/types';

export const TableColumnHeader = (
    props: ItemTableListColumn & {
        children: React.ReactNode;
        className?: string;
        containerClassName?: string;
        type: TableColumn;
    },
) => {
    return <div className={clsx(props.className)}>{props.children}</div>;
};
