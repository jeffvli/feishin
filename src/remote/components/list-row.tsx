import clsx from 'clsx';
import { ComponentPropsWithoutRef } from 'react';

import styles from './list-row.module.css';

import { Group } from '/@/shared/components/group/group';

interface ListRowProps extends ComponentPropsWithoutRef<typeof Group> {
    isCurrent?: boolean;
}

export const ListRow = ({ children, className, isCurrent, ...props }: ListRowProps) => {
    return (
        <Group
            className={clsx(styles.row, { [styles.rowCurrent]: isCurrent }, className)}
            gap="sm"
            wrap="nowrap"
            {...props}
        >
            {children}
        </Group>
    );
};
