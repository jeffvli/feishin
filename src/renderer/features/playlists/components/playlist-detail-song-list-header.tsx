import { useQuery } from '@tanstack/react-query';
import { MutableRefObject } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';

import { ItemListHandle } from '/@/renderer/components/item-list/types';
import { PageHeader } from '/@/renderer/components/page-header/page-header';
import { playlistsQueries } from '/@/renderer/features/playlists/api/playlists-api';
import { PlaylistDetailSongListHeaderFilters } from '/@/renderer/features/playlists/components/playlist-detail-song-list-header-filters';
import { FilterBar } from '/@/renderer/features/shared/components/filter-bar';
import { LibraryHeaderBar } from '/@/renderer/features/shared/components/library-header-bar';
import { useCurrentServer } from '/@/renderer/store';
import { formatDurationString } from '/@/renderer/utils';
import { Badge } from '/@/shared/components/badge/badge';
import { SpinnerIcon } from '/@/shared/components/spinner/spinner';
import { Stack } from '/@/shared/components/stack/stack';
import { LibraryItem } from '/@/shared/types/domain-types';
import { Play } from '/@/shared/types/types';

interface PlaylistDetailHeaderProps {
    handlePlay: (playType: Play) => void;
    handleToggleShowQueryBuilder: () => void;
    itemCount?: number;
    tableRef: MutableRefObject<ItemListHandle | null>;
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
    const detailQuery = useQuery(
        playlistsQueries.detail({ query: { id: playlistId }, serverId: server?.id }),
    );

    if (detailQuery.isLoading) return null;
    const isSmartPlaylist = detailQuery?.data?.rules;
    const playlistDuration = detailQuery?.data?.duration;

    return (
        <Stack gap={0}>
            <PageHeader>
                <LibraryHeaderBar>
                    <LibraryHeaderBar.PlayButton
                        ids={[playlistId]}
                        itemType={LibraryItem.PLAYLIST}
                    />
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
