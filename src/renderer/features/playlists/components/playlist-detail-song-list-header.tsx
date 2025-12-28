import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useLocation, useParams } from 'react-router';

import { useItemImageUrl } from '/@/renderer/components/item-image/item-image';
import { PageHeader } from '/@/renderer/components/page-header/page-header';
import { useListContext } from '/@/renderer/context/list-context';
import { usePlayer } from '/@/renderer/features/player/context/player-context';
import { playlistsQueries } from '/@/renderer/features/playlists/api/playlists-api';
import { PlaylistDetailSongListHeaderFilters } from '/@/renderer/features/playlists/components/playlist-detail-song-list-header-filters';
import { FilterBar } from '/@/renderer/features/shared/components/filter-bar';
import {
    LibraryHeader,
    LibraryHeaderMenu,
} from '/@/renderer/features/shared/components/library-header';
import { LibraryHeaderBar } from '/@/renderer/features/shared/components/library-header-bar';
import { ListSearchInput } from '/@/renderer/features/shared/components/list-search-input';
import { AppRoute } from '/@/renderer/router/routes';
import { useCurrentServer } from '/@/renderer/store';
import { formatDurationString } from '/@/renderer/utils';
import { Stack } from '/@/shared/components/stack/stack';
import { useLocalStorage } from '/@/shared/hooks/use-local-storage';
import { LibraryItem, Song } from '/@/shared/types/domain-types';
import { Play } from '/@/shared/types/types';

interface PlaylistDetailSongListHeaderProps {
    isSmartPlaylist?: boolean;
    onConvertToSmart?: () => void;
    onDelete?: () => void;
    onToggleQueryBuilder?: () => void;
}

export const PlaylistDetailSongListHeader = ({
    isSmartPlaylist,
}: PlaylistDetailSongListHeaderProps) => {
    const { t } = useTranslation();
    const { playlistId } = useParams() as { playlistId: string };
    const { itemCount, listData } = useListContext();
    const server = useCurrentServer();
    const location = useLocation();

    const detailQuery = useQuery({
        ...playlistsQueries.detail({ query: { id: playlistId }, serverId: server?.id }),
        initialData: location.state?.item,
    });

    const playlistDuration = detailQuery?.data?.duration;

    const [collapsed] = useLocalStorage<boolean>({
        defaultValue: false,
        key: 'playlist-header-collapsed',
    });

    const player = usePlayer();

    const handlePlay = (type?: Play) => {
        player.addToQueueByData(listData as Song[], type || Play.NOW);
    };

    const imageUrl = useItemImageUrl({
        id: detailQuery?.data?.imageId || undefined,
        itemType: LibraryItem.PLAYLIST,
        type: 'header',
    });

    return (
        <Stack gap={0}>
            {collapsed ? (
                <PageHeader>
                    <LibraryHeaderBar ignoreMaxWidth>
                        <LibraryHeaderBar.PlayButton
                            itemType={LibraryItem.PLAYLIST}
                            songs={listData as Song[]}
                        />
                        <LibraryHeaderBar.Title>{detailQuery?.data?.name}</LibraryHeaderBar.Title>
                        {isSmartPlaylist && (
                            <LibraryHeaderBar.Badge>
                                {t('entity.smartPlaylist')}
                            </LibraryHeaderBar.Badge>
                        )}
                        {!!playlistDuration && (
                            <LibraryHeaderBar.Badge>
                                {formatDurationString(playlistDuration)}
                            </LibraryHeaderBar.Badge>
                        )}
                        <LibraryHeaderBar.Badge
                            isLoading={itemCount === null || itemCount === undefined}
                        >
                            {itemCount}
                        </LibraryHeaderBar.Badge>
                    </LibraryHeaderBar>
                    <ListSearchInput />
                </PageHeader>
            ) : (
                <LibraryHeader
                    imageUrl={imageUrl}
                    item={{ route: AppRoute.PLAYLISTS, type: LibraryItem.PLAYLIST }}
                    title={detailQuery?.data?.name}
                >
                    <LibraryHeaderMenu
                        onPlay={(type) => handlePlay(type)}
                        onShuffle={() => handlePlay(Play.SHUFFLE)}
                    />
                </LibraryHeader>
            )}
            <FilterBar>
                <PlaylistDetailSongListHeaderFilters isSmartPlaylist={isSmartPlaylist} />
            </FilterBar>
        </Stack>
    );
};
