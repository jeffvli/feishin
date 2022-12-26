import { Group } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { RiHashtag } from 'react-icons/ri';
import { Button } from '/@/renderer/components/button';
import { NumberInput } from '/@/renderer/components/input';
import { Pagination } from '/@/renderer/components/pagination';
import { Popover } from '/@/renderer/components/popover';
import { useContainerQuery } from '/@/renderer/hooks';

interface TablePaginationProps {
  containerQuery: ReturnType<typeof useContainerQuery>;
  pagination: {
    currentPage: number;
    itemsPerPage: number;
    totalPages: number;
  };
  tableRef: any;
}

export const TablePagination = ({ tableRef, containerQuery, pagination }: TablePaginationProps) => {
  const [isGoToPageOpen, handlers] = useDisclosure(false);

  const form = useForm({
    initialValues: {
      pageNumber: undefined,
    },
  });

  const handlePagination = (index: number) => {
    tableRef.current?.api.paginationGoToPage(index - 1);
  };

  const handleGoSubmit = form.onSubmit((values) => {
    handlers.close();
    if (!values.pageNumber || values.pageNumber < 1 || values.pageNumber > pagination.totalPages) {
      return;
    }

    tableRef.current?.api.paginationGoToPage(values.pageNumber - 1);
  });

  return (
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
            compact
            radius="sm"
            size="lg"
            sx={{ height: '32px', padding: 0, width: '32px' }}
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
                {...form.getInputProps('pageNumber')}
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
        $hideDividers={!containerQuery.isMd}
        boundaries={1}
        page={pagination.currentPage + 1}
        radius="sm"
        // siblings={containerQuery.isSm ? 1 : 0}
        siblings={1}
        total={pagination.totalPages - 1}
        withControls={containerQuery.isSm}
        onChange={handlePagination}
      />
    </Group>
  );
};
