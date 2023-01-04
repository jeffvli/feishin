import { useRef } from 'react';
import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { Stack } from '@mantine/core';
import { closeAllModals, openModal } from '@mantine/modals';
import { generatePath, useNavigate, useParams } from 'react-router';
import { PlaylistDetailSongListContent } from '../components/playlist-detail-song-list-content';
import { PlaylistDetailSongListHeader } from '../components/playlist-detail-song-list-header';
import { AnimatedPage } from '/@/renderer/features/shared';
import { PlaylistQueryBuilder } from '/@/renderer/features/playlists/components/playlist-query-builder';
import { usePlaylistDetail } from '/@/renderer/features/playlists/queries/playlist-detail-query';
import { useCreatePlaylist } from '/@/renderer/features/playlists/mutations/create-playlist-mutation';
import { AppRoute } from '/@/renderer/router/routes';
import { useDeletePlaylist } from '/@/renderer/features/playlists/mutations/delete-playlist-mutation';
import { Paper, toast } from '/@/renderer/components';
import { SaveAsPlaylistForm } from '/@/renderer/features/playlists/components/save-as-playlist-form';

const PlaylistDetailSongListRoute = () => {
  const navigate = useNavigate();
  const tableRef = useRef<AgGridReactType | null>(null);
  const { playlistId } = useParams() as { playlistId: string };

  const detailQuery = usePlaylistDetail({ id: playlistId });
  const createPlaylistMutation = useCreatePlaylist();
  const deletePlaylistMutation = useDeletePlaylist();

  const handleSave = (filter: Record<string, any>) => {
    const rules = {
      ...filter,
      order: 'desc',
      sort: 'year',
    };

    if (!detailQuery?.data) return;

    createPlaylistMutation.mutate(
      {
        body: {
          comment: detailQuery?.data?.description || '',
          name: detailQuery?.data?.name,
          ndParams: {
            owner: detailQuery?.data?.owner || '',
            ownerId: detailQuery?.data?.ownerId || '',
            public: detailQuery?.data?.public || false,
            rules,
            sync: detailQuery?.data?.sync || false,
          },
        },
      },
      {
        onSuccess: (data) => {
          toast.success({ message: 'Smart playlist saved' });
          navigate(generatePath(AppRoute.PLAYLISTS_DETAIL_SONGS, { playlistId: data?.id || '' }), {
            replace: true,
          });
          deletePlaylistMutation.mutate({ query: { id: playlistId } });
        },
      },
    );
  };

  const handleSaveAs = (filter: Record<string, any>) => {
    openModal({
      children: (
        <SaveAsPlaylistForm
          body={{
            comment: detailQuery?.data?.description || '',
            name: detailQuery?.data?.name,
            ndParams: {
              owner: detailQuery?.data?.owner || '',
              ownerId: detailQuery?.data?.ownerId || '',
              public: detailQuery?.data?.public || false,
              rules: {
                ...filter,
                order: 'desc',
                sort: 'year',
              },
              sync: detailQuery?.data?.sync || false,
            },
          }}
          onCancel={closeAllModals}
          onSuccess={(data) =>
            navigate(generatePath(AppRoute.PLAYLISTS_DETAIL_SONGS, { playlistId: data?.id || '' }))
          }
        />
      ),
      title: 'Save as',
    });
  };

  return (
    <AnimatedPage key={`playlist-detail-songList-${playlistId}`}>
      <Stack
        h="100%"
        spacing={0}
      >
        <PlaylistDetailSongListHeader tableRef={tableRef} />
        <Paper
          sx={{
            maxHeight: '35vh',
            padding: '1rem',
          }}
          w="100%"
        >
          {!detailQuery?.isLoading && (
            <PlaylistQueryBuilder
              query={detailQuery?.data?.rules || { all: [] }}
              onSave={handleSave}
              onSaveAs={handleSaveAs}
            />
          )}
        </Paper>
        <PlaylistDetailSongListContent tableRef={tableRef} />
      </Stack>
    </AnimatedPage>
  );
};

export default PlaylistDetailSongListRoute;
