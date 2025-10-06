import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';

import { MutableRefObject } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';

import { PageHeader } from '/@/renderer/components/page-header/page-header';
import { PlaylistDetailSongListHeaderFilters } from '/@/renderer/features/playlists/components/playlist-detail-song-list-header-filters';
import { usePlaylistDetail } from '/@/renderer/features/playlists/queries/playlist-detail-query';
import { FilterBar, LibraryHeaderBar } from '/@/renderer/features/shared';
import { useCurrentServer } from '/@/renderer/store';
import { usePlayButtonBehavior } from '/@/renderer/store/settings.store';
import { formatDurationString } from '/@/renderer/utils';
import { Badge } from '/@/shared/components/badge/badge';
import { SpinnerIcon } from '/@/shared/components/spinner/spinner';
import { Stack } from '/@/shared/components/stack/stack';
import { Play } from '/@/shared/types/types';

interface PlaylistDetailHeaderProps {
    handlePlay: (playType: Play) => void;

    handleToggleShowQueryBuilder: () => void;
    itemCount?: number;
    tableRef: MutableRefObject<AgGridReactType | null>;
}

export const PlaylistDetailSongListHeader = ({
    handlePlay,
    handleToggleShowQueryBuilder,
    itemCount,
    tableRef,
}: PlaylistDetailHeaderProps) => {
    const { t } = useTranslation();
    const { playlistId } = useParams() as { playlistId: string };
    const server = useCurrentServer();
    const detailQuery = usePlaylistDetail({ query: { id: playlistId }, serverId: server?.id });

    const playButtonBehavior = usePlayButtonBehavior();

    if (detailQuery.isLoading) return null;
    const isSmartPlaylist = detailQuery?.data?.rules;
    const playlistDuration = detailQuery?.data?.duration;

    return (
        <Stack gap={0}>
            <PageHeader>
                <LibraryHeaderBar>
                    <LibraryHeaderBar.PlayButton onClick={() => handlePlay(playButtonBehavior)} />
                    <LibraryHeaderBar.Title>{detailQuery?.data?.name}</LibraryHeaderBar.Title>
                    {!!playlistDuration && <Badge>{formatDurationString(playlistDuration)}</Badge>}
                    <Badge>
                        {itemCount === null || itemCount === undefined ? (
                            <SpinnerIcon />
                        ) : (
                            itemCount
                        )}
                    </Badge>
                    {isSmartPlaylist && <Badge size="lg">{t('entity.smartPlaylist')}</Badge>}
                </LibraryHeaderBar>
            </PageHeader>
            <FilterBar>
                <PlaylistDetailSongListHeaderFilters
                    handlePlay={handlePlay}
                    handleToggleShowQueryBuilder={handleToggleShowQueryBuilder}
                    tableRef={tableRef}
                />
            </FilterBar>
        </Stack>
    );
};
