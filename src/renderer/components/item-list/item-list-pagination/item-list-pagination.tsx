import { Fragment, ReactNode } from 'react';

import styles from './item-list-pagination.module.css';

import { Pagination } from '/@/shared/components/pagination/pagination';

interface ItemListWithPaginationProps {
    children: ReactNode;
    currentPage: number;
    itemsPerPage: number;
    onChange: (e: number) => void;
    pageCount: number;
    totalItemCount: number;
}

export const ItemListWithPagination = ({
    children,
    currentPage,
    itemsPerPage,
    onChange,
    pageCount,
    totalItemCount,
}: ItemListWithPaginationProps) => {
    return (
        <div className={styles.container}>
            <Fragment key={currentPage}>{children}</Fragment>
            <div className={styles.paginationContainer}>
                <Pagination
                    itemsPerPage={itemsPerPage}
                    onChange={onChange}
                    total={pageCount}
                    totalItemCount={totalItemCount}
                    value={currentPage}
                />
            </div>
        </div>
    );
};
