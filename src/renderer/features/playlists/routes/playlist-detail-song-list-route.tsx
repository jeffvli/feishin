import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';

import { closeAllModals, openModal } from '@mantine/modals';
import { motion } from 'motion/react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { generatePath, useNavigate, useParams } from 'react-router';

import { PlaylistDetailSongListContent } from '/@/renderer/features/playlists/components/playlist-detail-song-list-content';
import { PlaylistDetailSongListHeader } from '/@/renderer/features/playlists/components/playlist-detail-song-list-header';
import { PlaylistQueryBuilder } from '/@/renderer/features/playlists/components/playlist-query-builder';
import { SaveAsPlaylistForm } from '/@/renderer/features/playlists/components/save-as-playlist-form';
import { useCreatePlaylist } from '/@/renderer/features/playlists/mutations/create-playlist-mutation';
import { useDeletePlaylist } from '/@/renderer/features/playlists/mutations/delete-playlist-mutation';
import { usePlaylistDetail } from '/@/renderer/features/playlists/queries/playlist-detail-query';
import { usePlaylistSongList } from '/@/renderer/features/playlists/queries/playlist-song-list-query';
import { AnimatedPage } from '/@/renderer/features/shared';
import { AppRoute } from '/@/renderer/router/routes';
import { useCurrentServer, usePlaylistDetailStore } from '/@/renderer/store';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Box } from '/@/shared/components/box/box';
import { Group } from '/@/shared/components/group/group';
import { Text } from '/@/shared/components/text/text';
import { toast } from '/@/shared/components/toast/toast';
import {
    PlaylistSongListQuery,
    ServerType,
    SongListSort,
    SortOrder,
} from '/@/shared/types/domain-types';

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
                    onCancel={closeAllModals}
                    onSuccess={(data) =>
                        navigate(
                            generatePath(AppRoute.PLAYLISTS_DETAIL_SONGS, {
                                playlistId: data?.id || '',
                            }),
                        )
                    }
                    serverId={detailQuery?.data?.serverId}
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
                <motion.div>
                    <Box
                        h="100%"
                        mah="35vh"
                        p="md"
                        w="100%"
                    >
                        <Group pb="md">
                            <ActionIcon
                                icon={isQueryBuilderExpanded ? 'arrowUpS' : 'arrowDownS'}
                                iconProps={{
                                    size: 'md',
                                }}
                                onClick={handleToggleExpand}
                                size="xs"
                            />
                            <Text>{t('form.queryEditor.title', { postProcess: 'titleCase' })}</Text>
                        </Group>
                        {isQueryBuilderExpanded && (
                            <PlaylistQueryBuilder
                                isSaving={createPlaylistMutation?.isLoading}
                                key={JSON.stringify(detailQuery?.data?.rules)}
                                limit={detailQuery?.data?.rules?.limit}
                                onSave={handleSave}
                                onSaveAs={handleSaveAs}
                                playlistId={playlistId}
                                query={detailQuery?.data?.rules}
                                sortBy={detailQuery?.data?.rules?.sort || SongListSort.ALBUM}
                                sortOrder={detailQuery?.data?.rules?.order || 'asc'}
                            />
                        )}
                    </Box>
                </motion.div>
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
