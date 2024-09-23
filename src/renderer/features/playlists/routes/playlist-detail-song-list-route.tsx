import { useRef, useState } from 'react';
import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { Box, Group } from '@mantine/core';
import { closeAllModals, openModal } from '@mantine/modals';
import { useTranslation } from 'react-i18next';
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
import { Button, Paper, Text, toast } from '/@/renderer/components';
import { SaveAsPlaylistForm } from '/@/renderer/features/playlists/components/save-as-playlist-form';
import { useCurrentServer, usePlaylistDetailStore } from '/@/renderer/store';
import { PlaylistSongListQuery, ServerType, SongListSort, SortOrder } from '/@/renderer/api/types';
import { usePlaylistSongList } from '/@/renderer/features/playlists/queries/playlist-song-list-query';

const PlaylistDetailSongListRoute = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const tableRef = useRef<AgGridReactType | null>(null);
    const { playlistId } = useParams() as { playlistId: string };
    const server = useCurrentServer();

    const detailQuery = usePlaylistDetail({ query: { id: playlistId }, serverId: server?.id });
    const createPlaylistMutation = useCreatePlaylist({});
    const deletePlaylistMutation = useDeletePlaylist({});

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
                    _custom: {
                        navidrome: {
                            owner: detailQuery?.data?.owner || '',
                            ownerId: detailQuery?.data?.ownerId || '',
                            rules,
                            sync: detailQuery?.data?.sync || false,
                        },
                    },
                    comment: detailQuery?.data?.description || '',
                    name: detailQuery?.data?.name,
                    public: detailQuery?.data?.public || false,
                },
                serverId: detailQuery?.data?.serverId,
            },
            {
                onSuccess: (data) => {
                    toast.success({ message: 'Playlist has been saved' });
                    navigate(
                        generatePath(AppRoute.PLAYLISTS_DETAIL_SONGS, {
                            playlistId: data?.id || '',
                        }),
                        {
                            replace: true,
                        },
                    );
                    deletePlaylistMutation.mutate({
                        query: { id: playlistId },
                        serverId: detailQuery?.data?.serverId,
                    });
                },
            },
        );
    };

    const handleSaveAs = (
        filter: Record<string, any>,
        extraFilters: { limit?: number; sortBy?: string; sortOrder?: string },
    ) => {
        openModal({
            children: (
                <SaveAsPlaylistForm
                    body={{
                        _custom: {
                            navidrome: {
                                owner: detailQuery?.data?.owner || '',
                                ownerId: detailQuery?.data?.ownerId || '',
                                rules: {
                                    ...filter,
                                    limit: extraFilters.limit || undefined,
                                    order: extraFilters.sortOrder || 'desc',
                                    sort: extraFilters.sortBy || 'dateAdded',
                                },
                                sync: detailQuery?.data?.sync || false,
                            },
                        },
                        comment: detailQuery?.data?.description || '',
                        name: detailQuery?.data?.name,
                        public: detailQuery?.data?.public || false,
                    }}
                    serverId={detailQuery?.data?.serverId}
                    onCancel={closeAllModals}
                    onSuccess={(data) =>
                        navigate(
                            generatePath(AppRoute.PLAYLISTS_DETAIL_SONGS, {
                                playlistId: data?.id || '',
                            }),
                        )
                    }
                />
            ),
            title: t('common.saveAs', { postProcess: 'sentenceCase' }),
        });
    };

    const isSmartPlaylist =
        !detailQuery?.isLoading &&
        detailQuery?.data?.rules &&
        server?.type === ServerType.NAVIDROME;

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

    const itemCountCheck = usePlaylistSongList({
        query: {
            id: playlistId,
            limit: 1,
            startIndex: 0,
            ...filters,
        },
        serverId: server?.id,
    });

    const itemCount = itemCountCheck.data?.totalRecordCount || itemCountCheck.data?.items.length;

    return (
        <AnimatedPage key={`playlist-detail-songList-${playlistId}`}>
            <PlaylistDetailSongListHeader
                handleToggleShowQueryBuilder={handleToggleShowQueryBuilder}
                itemCount={itemCount}
                tableRef={tableRef}
            />

            {(isSmartPlaylist || showQueryBuilder) && (
                <Box>
                    <Paper
                        h="100%"
                        mah="35vh"
                        w="100%"
                    >
                        <Group p="1rem">
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
                        {isQueryBuilderExpanded && (
                            <PlaylistQueryBuilder
                                key={JSON.stringify(detailQuery?.data?.rules)}
                                isSaving={createPlaylistMutation?.isLoading}
                                limit={detailQuery?.data?.rules?.limit}
                                playlistId={playlistId}
                                query={detailQuery?.data?.rules}
                                sortBy={detailQuery?.data?.rules?.sort || SongListSort.ALBUM}
                                sortOrder={detailQuery?.data?.rules?.order || 'asc'}
                                onSave={handleSave}
                                onSaveAs={handleSaveAs}
                            />
                        )}
                    </Paper>
                </Box>
            )}
            <PlaylistDetailSongListContent
                songs={
                    server?.type === ServerType.SUBSONIC ? itemCountCheck.data?.items : undefined
                }
                tableRef={tableRef}
            />
        </AnimatedPage>
    );
};

export default PlaylistDetailSongListRoute;
