import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { Flex, Group, Stack } from '@mantine/core';
import { MutableRefObject } from 'react';
import { PageHeader, SpinnerIcon, Paper } from '/@/renderer/components';
import { PlaylistListHeaderFilters } from '/@/renderer/features/playlists/components/playlist-list-header-filters';
import { LibraryHeaderBar } from '/@/renderer/features/shared';
import { useContainerQuery } from '/@/renderer/hooks';

interface PlaylistListHeaderProps {
  itemCount?: number;
  tableRef: MutableRefObject<AgGridReactType | null>;
}

export const PlaylistListHeader = ({ itemCount, tableRef }: PlaylistListHeaderProps) => {
  const cq = useContainerQuery();

  return (
    <Stack
      ref={cq.ref}
      spacing={0}
    >
      <PageHeader backgroundColor="var(--titlebar-bg)">
        <Flex
          justify="space-between"
          py="1rem"
        >
          <LibraryHeaderBar>
            <Group>
              <LibraryHeaderBar.Title>Playlists</LibraryHeaderBar.Title>
            </Group>
            <Paper
              fw="600"
              px="1rem"
              py="0.3rem"
              radius="sm"
            >
              {itemCount === null || itemCount === undefined ? <SpinnerIcon /> : itemCount}
            </Paper>
          </LibraryHeaderBar>
        </Flex>
      </PageHeader>
      <Paper
        p="1rem"
        shadow="xl"
        sx={{
          boxShadow: '1px 1px 10px 5px rgba(0, 0, 0, 0.3)',
          zIndex: 100,
        }}
      >
        <PlaylistListHeaderFilters tableRef={tableRef} />
      </Paper>
    </Stack>
  );
};
