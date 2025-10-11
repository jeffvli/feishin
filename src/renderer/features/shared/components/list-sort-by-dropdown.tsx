import { parseAsString, useQueryState } from 'nuqs';

import i18n from '/@/i18n/i18n';
import { FILTER_KEYS } from '/@/renderer/features/shared/utils';
import { useCurrentServer } from '/@/renderer/store';
import { Button } from '/@/shared/components/button/button';
import { DropdownMenu } from '/@/shared/components/dropdown-menu/dropdown-menu';
import { useLocalStorage } from '/@/shared/hooks/use-local-storage';
import { AlbumListSort, LibraryItem, ServerType, SortOrder } from '/@/shared/types/domain-types';
import { ItemListKey } from '/@/shared/types/types';

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
        key: getPersistenceKey(listKey),
    });

    const [sortBy, setSortBy] = useQueryState(
        FILTER_KEYS.SORT_BY,
        parseAsString.withDefault(persisted || defaultSortByValue),
    );

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

const FILTERS: Partial<Record<LibraryItem, any>> = {
    [LibraryItem.ALBUM]: ALBUM_LIST_FILTERS,
};

const getPersistenceKey = (listKey: ItemListKey) => {
    return `item_list_${listKey}-${FILTER_KEYS.SORT_BY}`;
};
