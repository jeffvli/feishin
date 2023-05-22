import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { Flex, Stack } from '@mantine/core';
import { openModal, closeAllModals } from '@mantine/modals';
import { MutableRefObject } from 'react';
import { PageHeader, SpinnerIcon, Paper, Button } from '/@/renderer/components';
import { CreatePlaylistForm } from '/@/renderer/features/playlists/components/create-playlist-form';
import { PlaylistListHeaderFilters } from '/@/renderer/features/playlists/components/playlist-list-header-filters';
import { LibraryHeaderBar } from '/@/renderer/features/shared';
import { useContainerQuery } from '/@/renderer/hooks';
import { useCurrentServer } from '/@/renderer/store';
import { ServerType } from '/@/renderer/types';

interface PlaylistListHeaderProps {
  itemCount?: number;
  tableRef: MutableRefObject<AgGridReactType | null>;
}

export const PlaylistListHeader = ({ itemCount, tableRef }: PlaylistListHeaderProps) => {
  const cq = useContainerQuery();
  const server = useCurrentServer();

  const handleCreatePlaylistModal = () => {
    openModal({
      children: <CreatePlaylistForm onCancel={() => closeAllModals()} />,
      onClose: () => {
        tableRef?.current?.api?.purgeInfiniteCache();
      },
      size: server?.type === ServerType?.NAVIDROME ? 'xl' : 'sm',
      title: 'Create Playlist',
    });
  };

  return (
    <Stack
      ref={cq.ref}
      spacing={0}
    >
      <PageHeader backgroundColor="var(--titlebar-bg)">
        <Flex
          align="center"
          justify="space-between"
          w="100%"
        >
          <LibraryHeaderBar>
            <LibraryHeaderBar.Title>Playlists</LibraryHeaderBar.Title>
            <Paper
              fw="600"
              px="1rem"
              py="0.3rem"
              radius="sm"
            >
              {itemCount === null || itemCount === undefined ? <SpinnerIcon /> : itemCount}
            </Paper>
          </LibraryHeaderBar>
          <Button onClick={handleCreatePlaylistModal}>Create playlist</Button>
        </Flex>
      </PageHeader>
      <Paper p="1rem">
        <PlaylistListHeaderFilters tableRef={tableRef} />
      </Paper>
    </Stack>
  );
};
