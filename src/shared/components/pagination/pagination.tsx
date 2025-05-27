import {
    Pagination as MantinePagination,
    PaginationProps as MantinePaginationProps,
} from '@mantine/core';

import styles from './pagination.module.css';

interface PaginationProps extends MantinePaginationProps {}

export const Pagination = ({ classNames, style, ...props }: PaginationProps) => {
    return (
        <MantinePagination
            classNames={{
                control: styles.control,
                ...classNames,
            }}
            radius="xl"
            style={{
                ...style,
            }}
            {...props}
        />
    );
};
