import { MutableRefObject } from 'react';
import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { Stack } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import { LibraryItem } from '/@/renderer/api/types';
import { Badge, PageHeader, Paper, SpinnerIcon } from '/@/renderer/components';
import { usePlayQueueAdd } from '/@/renderer/features/player';
import { PlaylistDetailSongListHeaderFilters } from '/@/renderer/features/playlists/components/playlist-detail-song-list-header-filters';
import { usePlaylistDetail } from '/@/renderer/features/playlists/queries/playlist-detail-query';
import { LibraryHeaderBar } from '/@/renderer/features/shared';
import { useCurrentServer } from '/@/renderer/store';
import { usePlayButtonBehavior } from '/@/renderer/store/settings.store';
import { Play } from '/@/renderer/types';

interface PlaylistDetailHeaderProps {
    handleToggleShowQueryBuilder: () => void;
    itemCount?: number;
    tableRef: MutableRefObject<AgGridReactType | null>;
}

export const PlaylistDetailSongListHeader = ({
    tableRef,
    itemCount,
    handleToggleShowQueryBuilder,
}: PlaylistDetailHeaderProps) => {
    const { t } = useTranslation();
    const { playlistId } = useParams() as { playlistId: string };
    const server = useCurrentServer();
    const detailQuery = usePlaylistDetail({ query: { id: playlistId }, serverId: server?.id });
    const handlePlayQueueAdd = usePlayQueueAdd();

    const handlePlay = async (playType: Play) => {
        handlePlayQueueAdd?.({
            byItemType: { id: [playlistId], type: LibraryItem.PLAYLIST },
            playType,
        });
    };

    const playButtonBehavior = usePlayButtonBehavior();

    if (detailQuery.isLoading) return null;
    const isSmartPlaylist = detailQuery?.data?.rules;

    return (
        <Stack gap={0}>
            <PageHeader backgroundColor="var(--titlebar-bg)">
                <LibraryHeaderBar>
                    <LibraryHeaderBar.PlayButton onClick={() => handlePlay(playButtonBehavior)} />
                    <LibraryHeaderBar.Title>{detailQuery?.data?.name}</LibraryHeaderBar.Title>
                    <Paper
                        fw="600"
                        px="1rem"
                        py="0.3rem"
                        radius="sm"
                    >
                        {itemCount === null || itemCount === undefined ? (
                            <SpinnerIcon />
                        ) : (
                            itemCount
                        )}
                    </Paper>
                    {isSmartPlaylist && <Badge size="lg">{t('entity.smartPlaylist')}</Badge>}
                </LibraryHeaderBar>
            </PageHeader>
            <Paper p="1rem">
                <PlaylistDetailSongListHeaderFilters
                    handleToggleShowQueryBuilder={handleToggleShowQueryBuilder}
                    tableRef={tableRef}
                />
            </Paper>
        </Stack>
    );
};
