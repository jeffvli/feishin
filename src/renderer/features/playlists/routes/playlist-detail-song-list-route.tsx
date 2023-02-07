import { useRef, useState } from 'react';
import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { Group } from '@mantine/core';
import { closeAllModals, openModal } from '@mantine/modals';
import { AnimatePresence, motion, Variants } from 'framer-motion';
import { RiArrowDownSLine, RiArrowUpSLine } from 'react-icons/ri';
import { generatePath, useNavigate, useParams } from 'react-router';
import { PlaylistDetailSongListContent } from '../components/playlist-detail-song-list-content';
import { PlaylistDetailSongListHeader } from '../components/playlist-detail-song-list-header';
import { AnimatedPage } from '/@/renderer/features/shared';
import { PlaylistQueryBuilder } from '/@/renderer/features/playlists/components/playlist-query-builder';
import { usePlaylistDetail } from '/@/renderer/features/playlists/queries/playlist-detail-query';
import { useCreatePlaylist } from '/@/renderer/features/playlists/mutations/create-playlist-mutation';
import { AppRoute } from '/@/renderer/router/routes';
import { useDeletePlaylist } from '/@/renderer/features/playlists/mutations/delete-playlist-mutation';
import { Button, Paper, Text, toast, VirtualGridContainer } from '/@/renderer/components';
import { SaveAsPlaylistForm } from '/@/renderer/features/playlists/components/save-as-playlist-form';
import { useCurrentServer, usePlaylistDetailStore } from '/@/renderer/store';
import { PlaylistSongListQuery, ServerType, SongListSort, SortOrder } from '/@/renderer/api/types';
import { usePlaylistSongList } from '/@/renderer/features/playlists/queries/playlist-song-list-query';

const PlaylistDetailSongListRoute = () => {
  const navigate = useNavigate();
  const tableRef = useRef<AgGridReactType | null>(null);
  const { playlistId } = useParams() as { playlistId: string };
  const currentServer = useCurrentServer();

  const detailQuery = usePlaylistDetail({ id: playlistId });
  const createPlaylistMutation = useCreatePlaylist();
  const deletePlaylistMutation = useDeletePlaylist();

  const handleSave = (
    filter: Record<string, any>,
    extraFilters: { limit?: number; sortBy?: string; sortOrder?: string },
  ) => {
    const rules = {
      ...filter,
      limit: extraFilters.limit || undefined,
      order: extraFilters.sortOrder || 'desc',
      sort: extraFilters.sortBy || 'dateAdded',
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

  const smartPlaylistVariants: Variants = {
    animate: (custom: { isQueryBuilderExpanded: boolean }) => {
      return {
        maxHeight: custom.isQueryBuilderExpanded ? '35vh' : '3.5em',
        opacity: 1,
        transition: {
          duration: 0.3,
          ease: 'easeInOut',
        },
        y: 0,
      };
    },
    exit: {
      opacity: 0,
      y: -25,
    },
    initial: {
      opacity: 0,
      y: -25,
    },
  };

  const isSmartPlaylist =
    !detailQuery?.isLoading &&
    detailQuery?.data?.rules &&
    currentServer?.type === ServerType.NAVIDROME;

  const [showQueryBuilder, setShowQueryBuilder] = useState(false);
  const [isQueryBuilderExpanded, setIsQueryBuilderExpanded] = useState(false);

  const handleToggleExpand = () => {
    setIsQueryBuilderExpanded((prev) => !prev);
  };

  const handleToggleShowQueryBuilder = () => {
    setShowQueryBuilder((prev) => !prev);
    setIsQueryBuilderExpanded(true);
  };

  const page = usePlaylistDetailStore();
  const filters: Partial<PlaylistSongListQuery> = {
    sortBy: page?.table.id[playlistId]?.filter?.sortBy || SongListSort.ID,
    sortOrder: page?.table.id[playlistId]?.filter?.sortOrder || SortOrder.ASC,
  };

  const itemCountCheck = usePlaylistSongList(
    {
      id: playlistId,
      limit: 1,
      startIndex: 0,
      ...filters,
    },
    {
      cacheTime: 1000 * 60 * 60 * 2,
      staleTime: 1000 * 60 * 60 * 2,
    },
  );

  const itemCount =
    itemCountCheck.data?.totalRecordCount === null
      ? undefined
      : itemCountCheck.data?.totalRecordCount;

  return (
    <AnimatedPage key={`playlist-detail-songList-${playlistId}`}>
      <VirtualGridContainer>
        <PlaylistDetailSongListHeader
          handleToggleShowQueryBuilder={handleToggleShowQueryBuilder}
          itemCount={itemCount}
          tableRef={tableRef}
        />
        <AnimatePresence
          custom={{ isQueryBuilderExpanded }}
          initial={false}
        >
          {(isSmartPlaylist || showQueryBuilder) && (
            <motion.div
              animate="animate"
              custom={{ isQueryBuilderExpanded }}
              exit="exit"
              initial="initial"
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              variants={smartPlaylistVariants}
            >
              <Paper
                h="100%"
                pos="relative"
                w="100%"
              >
                <Group
                  pt="1rem"
                  px="1rem"
                >
                  <Button
                    compact
                    variant="default"
                    onClick={handleToggleExpand}
                  >
                    {isQueryBuilderExpanded ? (
                      <RiArrowUpSLine size={20} />
                    ) : (
                      <RiArrowDownSLine size={20} />
                    )}
                  </Button>
                  <Text>Query Editor</Text>
                </Group>
                <PlaylistQueryBuilder
                  key={JSON.stringify(detailQuery?.data?.rules)}
                  isSaving={createPlaylistMutation?.isLoading}
                  limit={detailQuery?.data?.rules?.limit}
                  query={detailQuery?.data?.rules}
                  sortBy={detailQuery?.data?.rules?.sort || SongListSort.ALBUM}
                  sortOrder={detailQuery?.data?.rules?.order || 'asc'}
                  onSave={handleSave}
                  onSaveAs={handleSaveAs}
                />
              </Paper>
            </motion.div>
          )}
        </AnimatePresence>
        <PlaylistDetailSongListContent tableRef={tableRef} />
      </VirtualGridContainer>
    </AnimatedPage>
  );
};

export default PlaylistDetailSongListRoute;
