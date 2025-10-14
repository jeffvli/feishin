import i18n from '/@/i18n/i18n';
import { FILTER_KEYS } from '/@/renderer/features/shared/utils';
import { useCurrentServer } from '/@/renderer/store';
import { Button } from '/@/shared/components/button/button';
import { DropdownMenu } from '/@/shared/components/dropdown-menu/dropdown-menu';
import { useLocalStorage } from '/@/shared/hooks/use-local-storage';
import {
    AlbumListSort,
    LibraryItem,
    ServerType,
    SongListSort,
    SortOrder,
} from '/@/shared/types/domain-types';
import { ItemListKey } from '/@/shared/types/types';
import { useSortByFilter } from '/@/renderer/features/shared/hooks/use-sort-by-filter';

interface ListSortByDropdownProps {
    defaultSortByValue: string;
    itemType: LibraryItem;
    listKey: ItemListKey;
    onChange?: (value: string) => void;
    target?: React.ReactNode;
}

export const ListSortByDropdown = ({
    defaultSortByValue,
    itemType,
    listKey,
    onChange,
    target,
}: ListSortByDropdownProps) => {
    const server = useCurrentServer();

    const [persisted, setPersisted] = useLocalStorage({
        defaultValue: defaultSortByValue,
        key: getPersistenceKey(server.id, listKey),
    });

    const { sortBy, setSortBy } = useSortByFilter(persisted || defaultSortByValue);

    const sortByLabel =
        (itemType && FILTERS[itemType][server.type].find((f) => f.value === sortBy)?.name) || '—';

    const handleSortByChange = (sortBy: string) => {
        setSortBy(sortBy);
        setPersisted(sortBy);
        onChange?.(sortBy);
    };

    return (
        <DropdownMenu position="bottom-start">
            <DropdownMenu.Target>
                {target ? target : <Button variant="subtle">{sortByLabel}</Button>}
            </DropdownMenu.Target>
            <DropdownMenu.Dropdown>
                {FILTERS[itemType][server.type].map((f) => (
                    <DropdownMenu.Item
                        isSelected={f.value === sortBy}
                        key={`filter-${f.name}`}
                        onClick={() => handleSortByChange(f.value)}
                        value={f.value}
                    >
                        {f.name}
                    </DropdownMenu.Item>
                ))}
            </DropdownMenu.Dropdown>
        </DropdownMenu>
    );
};

const ALBUM_LIST_FILTERS: Partial<
    Record<ServerType, Array<{ defaultOrder: SortOrder; name: string; value: string }>>
> = {
    [ServerType.JELLYFIN]: [
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.albumArtist', { postProcess: 'titleCase' }),
            value: AlbumListSort.ALBUM_ARTIST,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.communityRating', { postProcess: 'titleCase' }),
            value: AlbumListSort.COMMUNITY_RATING,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.criticRating', { postProcess: 'titleCase' }),
            value: AlbumListSort.CRITIC_RATING,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.name', { postProcess: 'titleCase' }),
            value: AlbumListSort.NAME,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.playCount', { postProcess: 'titleCase' }),
            value: AlbumListSort.PLAY_COUNT,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.random', { postProcess: 'titleCase' }),
            value: AlbumListSort.RANDOM,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.recentlyAdded', { postProcess: 'titleCase' }),
            value: AlbumListSort.RECENTLY_ADDED,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.releaseDate', { postProcess: 'titleCase' }),
            value: AlbumListSort.RELEASE_DATE,
        },
    ],
    [ServerType.NAVIDROME]: [
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.albumArtist', { postProcess: 'titleCase' }),
            value: AlbumListSort.ALBUM_ARTIST,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.artist', { postProcess: 'titleCase' }),
            value: AlbumListSort.ARTIST,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.duration', { postProcess: 'titleCase' }),
            value: AlbumListSort.DURATION,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.mostPlayed', { postProcess: 'titleCase' }),
            value: AlbumListSort.PLAY_COUNT,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.name', { postProcess: 'titleCase' }),
            value: AlbumListSort.NAME,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.random', { postProcess: 'titleCase' }),
            value: AlbumListSort.RANDOM,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.rating', { postProcess: 'titleCase' }),
            value: AlbumListSort.RATING,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.recentlyAdded', { postProcess: 'titleCase' }),
            value: AlbumListSort.RECENTLY_ADDED,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.recentlyPlayed', { postProcess: 'titleCase' }),
            value: AlbumListSort.RECENTLY_PLAYED,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.songCount', { postProcess: 'titleCase' }),
            value: AlbumListSort.SONG_COUNT,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.favorited', { postProcess: 'titleCase' }),
            value: AlbumListSort.FAVORITED,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.releaseYear', { postProcess: 'titleCase' }),
            value: AlbumListSort.YEAR,
        },
    ],
    [ServerType.SUBSONIC]: [
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.albumArtist', { postProcess: 'titleCase' }),
            value: AlbumListSort.ALBUM_ARTIST,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.mostPlayed', { postProcess: 'titleCase' }),
            value: AlbumListSort.PLAY_COUNT,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.name', { postProcess: 'titleCase' }),
            value: AlbumListSort.NAME,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.random', { postProcess: 'titleCase' }),
            value: AlbumListSort.RANDOM,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.recentlyAdded', { postProcess: 'titleCase' }),
            value: AlbumListSort.RECENTLY_ADDED,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.recentlyPlayed', { postProcess: 'titleCase' }),
            value: AlbumListSort.RECENTLY_PLAYED,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.favorited', { postProcess: 'titleCase' }),
            value: AlbumListSort.FAVORITED,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.releaseYear', { postProcess: 'titleCase' }),
            value: AlbumListSort.YEAR,
        },
    ],
};

const SONG_LIST_FILTERS: Partial<
    Record<ServerType, Array<{ defaultOrder: SortOrder; name: string; value: string }>>
> = {
    [ServerType.JELLYFIN]: [
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.album', { postProcess: 'titleCase' }),
            value: SongListSort.ALBUM,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.albumArtist', { postProcess: 'titleCase' }),
            value: SongListSort.ALBUM_ARTIST,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.artist', { postProcess: 'titleCase' }),
            value: SongListSort.ARTIST,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.duration', { postProcess: 'titleCase' }),
            value: SongListSort.DURATION,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.playCount', { postProcess: 'titleCase' }),
            value: SongListSort.PLAY_COUNT,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.name', { postProcess: 'titleCase' }),
            value: SongListSort.NAME,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.random', { postProcess: 'titleCase' }),
            value: SongListSort.RANDOM,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.recentlyAdded', { postProcess: 'titleCase' }),
            value: SongListSort.RECENTLY_ADDED,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.recentlyPlayed', { postProcess: 'titleCase' }),
            value: SongListSort.RECENTLY_PLAYED,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.releaseDate', { postProcess: 'titleCase' }),
            value: SongListSort.RELEASE_DATE,
        },
    ],
    [ServerType.NAVIDROME]: [
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.album', { postProcess: 'titleCase' }),
            value: SongListSort.ALBUM,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.albumArtist', { postProcess: 'titleCase' }),
            value: SongListSort.ALBUM_ARTIST,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.artist', { postProcess: 'titleCase' }),
            value: SongListSort.ARTIST,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.bpm', { postProcess: 'titleCase' }),
            value: SongListSort.BPM,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('common.channel', { count: 2, postProcess: 'titleCase' }),
            value: SongListSort.CHANNELS,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.comment', { postProcess: 'titleCase' }),
            value: SongListSort.COMMENT,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.duration', { postProcess: 'titleCase' }),
            value: SongListSort.DURATION,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.isFavorited', { postProcess: 'titleCase' }),
            value: SongListSort.FAVORITED,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.genre', { postProcess: 'titleCase' }),
            value: SongListSort.GENRE,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.name', { postProcess: 'titleCase' }),
            value: SongListSort.NAME,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.playCount', { postProcess: 'titleCase' }),
            value: SongListSort.PLAY_COUNT,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.random', { postProcess: 'titleCase' }),
            value: SongListSort.RANDOM,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.rating', { postProcess: 'titleCase' }),
            value: SongListSort.RATING,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.recentlyAdded', { postProcess: 'titleCase' }),
            value: SongListSort.RECENTLY_ADDED,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.recentlyPlayed', { postProcess: 'titleCase' }),
            value: SongListSort.RECENTLY_PLAYED,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.releaseYear', { postProcess: 'titleCase' }),
            value: SongListSort.YEAR,
        },
    ],
    [ServerType.SUBSONIC]: [
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.name', { postProcess: 'titleCase' }),
            value: SongListSort.NAME,
        },
    ],
};

const FILTERS: Partial<Record<LibraryItem, any>> = {
    [LibraryItem.ALBUM]: ALBUM_LIST_FILTERS,
    [LibraryItem.SONG]: SONG_LIST_FILTERS,
};

const getPersistenceKey = (serverId: string, listKey: ItemListKey) => {
    return `${serverId}-list-${listKey}-${FILTER_KEYS.SHARED.SORT_BY}`;
};
