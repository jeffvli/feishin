import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { Group } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { MutableRefObject } from 'react';
import { RiHashtag } from 'react-icons/ri';
import { Button } from '/@/renderer/components/button';
import { MotionFlex } from '../motion';
import { NumberInput } from '/@/renderer/components/input';
import { Pagination } from '/@/renderer/components/pagination';
import { Popover } from '/@/renderer/components/popover';
import { Text } from '/@/renderer/components/text';
import { useContainerQuery } from '/@/renderer/hooks';
import { TablePagination as TablePaginationType } from '/@/renderer/types';

interface TablePaginationProps {
  id?: string;
  pagination: TablePaginationType;
  setIdPagination?: (id: string, pagination: Partial<TablePaginationType>) => void;
  setPagination?: (pagination: Partial<TablePaginationType>) => void;
  tableRef: MutableRefObject<AgGridReactType | null>;
}

export const TablePagination = ({
  id,
  tableRef,
  pagination,
  setPagination,
  setIdPagination,
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
    setPagination?.({ currentPage: newPage });
    setIdPagination?.(id || '', { currentPage: newPage });
  };

  const handleGoSubmit = goToForm.onSubmit((values) => {
    handlers.close();
    if (!values.pageNumber || values.pageNumber < 1 || values.pageNumber > pagination.totalPages) {
      return;
    }

    const newPage = values.pageNumber - 1;
    tableRef.current?.api.paginationGoToPage(newPage);
    setPagination?.({ currentPage: newPage });
    setIdPagination?.(id || '', { currentPage: newPage });
  });

  const currentPageStartIndex = pagination.currentPage * pagination.itemsPerPage + 1;
  const currentPageMaxIndex = (pagination.currentPage + 1) * pagination.itemsPerPage;
  const currentPageStopIndex =
    currentPageMaxIndex > pagination.totalItems ? pagination.totalItems : currentPageMaxIndex;

  return (
    <MotionFlex
      ref={containerQuery.ref}
      layout
      align="center"
      animate={{ y: 0 }}
      exit={{ y: 50 }}
      initial={{ y: 50 }}
      justify="space-between"
      p="1rem"
      sx={{ borderTop: '1px solid var(--generic-border-color)' }}
    >
      <Text
        $secondary
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
        ref={containerQuery.ref}
        noWrap
        spacing="sm"
      >
        <Popover
          trapFocus
          opened={isGoToPageOpen}
          position="bottom-start"
          transition="fade"
          onClose={() => handlers.close()}
        >
          <Popover.Target>
            <Button
              radius="sm"
              size="sm"
              sx={{ height: '26px', padding: '0', width: '26px' }}
              tooltip={{ label: 'Go to page' }}
              variant="default"
              onClick={() => handlers.toggle()}
            >
              <RiHashtag size={15} />
            </Button>
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
          noWrap
          $hideDividers={!containerQuery.isSm}
          boundaries={1}
          page={pagination.currentPage + 1}
          radius="sm"
          siblings={containerQuery.isMd ? 2 : containerQuery.isSm ? 1 : 0}
          total={pagination.totalPages - 1}
          onChange={handlePagination}
        />
      </Group>
    </MotionFlex>
  );
};
