import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';

import { MutableRefObject } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';

import { PageHeader } from '/@/renderer/components/page-header/page-header';
import { usePlayQueueAdd } from '/@/renderer/features/player';
import { PlaylistDetailSongListHeaderFilters } from '/@/renderer/features/playlists/components/playlist-detail-song-list-header-filters';
import { usePlaylistDetail } from '/@/renderer/features/playlists/queries/playlist-detail-query';
import { FilterBar, LibraryHeaderBar } from '/@/renderer/features/shared';
import { useCurrentServer } from '/@/renderer/store';
import { usePlayButtonBehavior } from '/@/renderer/store/settings.store';
import { Badge } from '/@/shared/components/badge/badge';
import { SpinnerIcon } from '/@/shared/components/spinner/spinner';
import { Stack } from '/@/shared/components/stack/stack';
import { LibraryItem } from '/@/shared/types/domain-types';
import { Play } from '/@/shared/types/types';

interface PlaylistDetailHeaderProps {
    handleToggleShowQueryBuilder: () => void;
    itemCount?: number;
    tableRef: MutableRefObject<AgGridReactType | null>;
}

export const PlaylistDetailSongListHeader = ({
    handleToggleShowQueryBuilder,
    itemCount,
    tableRef,
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
            <PageHeader>
                <LibraryHeaderBar>
                    <LibraryHeaderBar.PlayButton onClick={() => handlePlay(playButtonBehavior)} />
                    <LibraryHeaderBar.Title>{detailQuery?.data?.name}</LibraryHeaderBar.Title>
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
                    handleToggleShowQueryBuilder={handleToggleShowQueryBuilder}
                    tableRef={tableRef}
                />
            </FilterBar>
        </Stack>
    );
};
