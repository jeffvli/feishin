import {
    Pagination as MantinePagination,
    PaginationProps as MantinePaginationProps,
} from '@mantine/core';
import clsx from 'clsx';
import { useRef } from 'react';

import styles from './pagination.module.css';

import { Icon } from '/@/shared/components/icon/icon';
import { Separator } from '/@/shared/components/separator/separator';
import { Text } from '/@/shared/components/text/text';
import { useContainerQuery } from '/@/shared/hooks/use-container-query';

interface PaginationProps extends MantinePaginationProps {
    containerClassName?: string;
    itemsPerPage: number;
    totalItemCount: number;
}

export const Pagination = ({
    classNames,
    containerClassName,
    itemsPerPage,
    style,
    totalItemCount,
    ...props
}: PaginationProps) => {
    const { ref: containerRef, ...containerQuery } = useContainerQuery();

    const paginationRef = useRef<HTMLDivElement>(null);

    // !IMPORTANT: Mantine Pagination is 1-indexed
    const currentPageIndex = props.value || 0;
    const currentPageValue = currentPageIndex + 1;

    const handleChange = (e: number) => {
        props.onChange?.(e - 1);
    };

    const currentPageStartIndex = itemsPerPage * currentPageIndex + 1;
    const currentPageEndIndex = Math.min(currentPageValue * itemsPerPage, totalItemCount);

    return (
        <div className={clsx(styles.container, containerClassName)} ref={containerRef}>
            <MantinePagination
                boundaries={1}
                classNames={{
                    control: styles.control,
                    root: styles.root,
                    ...classNames,
                }}
                nextIcon={() => <Icon icon="arrowRightS" />}
                previousIcon={() => <Icon icon="arrowLeftS" />}
                radius="md"
                ref={paginationRef}
                siblings={containerQuery.isXl ? 3 : containerQuery.isMd ? 2 : 1}
                size="md"
                style={{
                    ...style,
                }}
                {...props}
                onChange={handleChange}
                value={currentPageValue}
            />
            {containerQuery.isSm && totalItemCount && (
                <Text isNoSelect weight={500}>
                    {currentPageStartIndex} - {currentPageEndIndex} <Separator /> {totalItemCount}
                </Text>
            )}
        </div>
    );
};
