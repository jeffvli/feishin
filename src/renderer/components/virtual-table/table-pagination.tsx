import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';

import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { MutableRefObject } from 'react';

import { useContainerQuery } from '/@/renderer/hooks';
import { ListKey } from '/@/renderer/store';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Button } from '/@/shared/components/button/button';
import { Flex } from '/@/shared/components/flex/flex';
import { Group } from '/@/shared/components/group/group';
import { NumberInput } from '/@/shared/components/number-input/number-input';
import { Pagination } from '/@/shared/components/pagination/pagination';
import { Popover } from '/@/shared/components/popover/popover';
import { Text } from '/@/shared/components/text/text';
import { TablePagination as TablePaginationType } from '/@/shared/types/types';

interface TablePaginationProps {
    pageKey: ListKey;
    pagination: TablePaginationType;
    setIdPagination?: (id: string, pagination: Partial<TablePaginationType>) => void;
    setPagination?: (args: { data: Partial<TablePaginationType>; key: ListKey }) => void;
    tableRef: MutableRefObject<AgGridReactType | null>;
}

export const TablePagination = ({
    pageKey,
    pagination,
    setIdPagination,
    setPagination,
    tableRef,
}: TablePaginationProps) => {
    const [isGoToPageOpen, handlers] = useDisclosure(false);
    const containerQuery = useContainerQuery();

    const goToForm = useForm({
        initialValues: {
            pageNumber: undefined,
        },
    });

    const handlePagination = (index: number) => {
        const newPage = index - 1;
        tableRef.current?.api.paginationGoToPage(newPage);
        setPagination?.({ data: { currentPage: newPage }, key: pageKey });
        setIdPagination?.(pageKey || '', { currentPage: newPage });
    };

    const handleGoSubmit = goToForm.onSubmit((values) => {
        handlers.close();
        if (
            !values.pageNumber ||
            values.pageNumber < 1 ||
            values.pageNumber > pagination.totalPages
        ) {
            return;
        }

        const newPage = values.pageNumber - 1;
        tableRef.current?.api.paginationGoToPage(newPage);
        setPagination?.({ data: { currentPage: newPage }, key: pageKey });
        setIdPagination?.(pageKey || '', { currentPage: newPage });
    });

    const currentPageStartIndex = pagination.currentPage * pagination.itemsPerPage + 1;
    const currentPageMaxIndex = (pagination.currentPage + 1) * pagination.itemsPerPage;
    const currentPageStopIndex =
        currentPageMaxIndex > pagination.totalItems ? pagination.totalItems : currentPageMaxIndex;

    return (
        <Flex
            align="center"
            justify="space-between"
            p="1rem"
            ref={containerQuery.ref}
            style={{ borderTop: '1px solid var(--theme-generic-border-color)' }}
        >
            <Text
                isMuted
                size="md"
            >
                {containerQuery.isMd ? (
                    <>
                        Showing <b>{currentPageStartIndex}</b> - <b>{currentPageStopIndex}</b> of{' '}
                        <b>{pagination.totalItems}</b> items
                    </>
                ) : containerQuery.isSm ? (
                    <>
                        <b>{currentPageStartIndex}</b> - <b>{currentPageStopIndex}</b> of{' '}
                        <b>{pagination.totalItems}</b> items
                    </>
                ) : (
                    <>
                        <b>{currentPageStartIndex}</b> - <b>{currentPageStopIndex}</b> of{' '}
                        <b>{pagination.totalItems}</b>
                    </>
                )}
            </Text>
            <Group
                gap="sm"
                ref={containerQuery.ref}
                wrap="nowrap"
            >
                <Popover
                    onClose={() => handlers.close()}
                    opened={isGoToPageOpen}
                    position="bottom-start"
                    trapFocus
                >
                    <Popover.Target>
                        <ActionIcon
                            icon="hash"
                            onClick={() => handlers.toggle()}
                            radius="sm"
                            size="sm"
                            style={{ height: '26px', padding: '0', width: '26px' }}
                        />
                    </Popover.Target>
                    <Popover.Dropdown>
                        <form onSubmit={handleGoSubmit}>
                            <Group>
                                <NumberInput
                                    {...goToForm.getInputProps('pageNumber')}
                                    hideControls={false}
                                    max={pagination.totalPages}
                                    min={1}
                                    width={70}
                                />
                                <Button
                                    type="submit"
                                    variant="filled"
                                >
                                    Go
                                </Button>
                            </Group>
                        </form>
                    </Popover.Dropdown>
                </Popover>
                <Pagination
                    boundaries={1}
                    onChange={handlePagination}
                    radius="sm"
                    siblings={containerQuery.isMd ? 2 : containerQuery.isSm ? 1 : 0}
                    total={pagination.totalPages - 1}
                    value={pagination.currentPage + 1}
                />
            </Group>
        </Flex>
    );
};
