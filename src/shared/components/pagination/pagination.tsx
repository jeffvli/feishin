import {
    Pagination as MantinePagination,
    PaginationProps as MantinePaginationProps,
} from '@mantine/core';
import clsx from 'clsx';
import { useRef, useState } from 'react';

import styles from './pagination.module.css';

import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { NumberInput } from '/@/shared/components/number-input/number-input';
import { Popover } from '/@/shared/components/popover/popover';
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

    const [goToPage, setGoToPage] = useState(currentPageValue);

    const handleGoToPage = () => {
        handleChange(Math.max(1, Math.min(goToPage, props.total)));
    };

    const handleGoToKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleGoToPage();
        }
    };

    return (
        <div className={clsx(styles.container, containerClassName)} ref={containerRef}>
            <Group gap="xs">
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
                <Popover position="top">
                    <Popover.Target>
                        <ActionIcon
                            className={styles.control}
                            icon="ellipsisHorizontal"
                            size="xs"
                            style={{
                                height: 'calc(2rem * 1)',
                                minWidth: 'calc(2rem * 1)',
                            }}
                        />
                    </Popover.Target>
                    <Popover.Dropdown>
                        <Group gap={0}>
                            <NumberInput
                                autoFocus
                                hideControls={false}
                                max={props.total}
                                min={1}
                                onChange={(e) => setGoToPage(Number(e))}
                                onKeyDown={handleGoToKeyDown}
                                value={currentPageValue}
                                width={120}
                            />
                            <ActionIcon
                                icon="arrowRight"
                                onClick={handleGoToPage}
                                variant="default"
                            />
                        </Group>
                    </Popover.Dropdown>
                </Popover>
            </Group>
            {containerQuery.isSm && totalItemCount && (
                <Text isNoSelect weight={500}>
                    {currentPageStartIndex} - {currentPageEndIndex} <Separator /> {totalItemCount}
                </Text>
            )}
        </div>
    );
};
