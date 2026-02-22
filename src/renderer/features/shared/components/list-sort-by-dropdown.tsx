import { Dispatch, SetStateAction } from 'react';

import i18n from '/@/i18n/i18n';
import { useSortByFilter } from '/@/renderer/features/shared/hooks/use-sort-by-filter';
import { useCurrentServer } from '/@/renderer/store';
import { Button } from '/@/shared/components/button/button';
import { DropdownMenu } from '/@/shared/components/dropdown-menu/dropdown-menu';
import {
    AlbumArtistListSort,
    AlbumListSort,
    ArtistListSort,
    GenreListSort,
    LibraryItem,
    PlaylistListSort,
    RadioListSort,
    ServerType,
    SongListSort,
    SortOrder,
} from '/@/shared/types/domain-types';
import { ItemListKey } from '/@/shared/types/types';

interface ListSortByDropdownProps {
    defaultSortByValue: string;
    disabled?: boolean;
    includeId?: boolean;
    itemType: LibraryItem;
    listKey: ItemListKey;
    onChange?: (value: string) => void;
    target?: React.ReactNode;
}

export const ListSortByDropdown = ({
    defaultSortByValue,
    disabled,
    itemType,
    listKey,
    onChange,
    target,
}: ListSortByDropdownProps) => {
    const server = useCurrentServer();

    const { setSortBy, sortBy } = useSortByFilter(defaultSortByValue, listKey);

    const sortByLabel =
        (itemType && FILTERS[itemType][server.type].find((f) => f.value === sortBy)?.name) || '—';

    const handleSortByChange = (sortBy: string) => {
        setSortBy(sortBy);
        onChange?.(sortBy);
    };

    return (
        <DropdownMenu disabled={disabled} position="bottom-start">
            <DropdownMenu.Target>
                {target ? (
                    target
                ) : (
                    <Button disabled={disabled} variant="subtle">
                        {sortByLabel}
                    </Button>
                )}
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

interface ListSortByDropdownControlledProps {
    disabled?: boolean;
    filters?: Array<{ defaultOrder: SortOrder; name: string; value: string }>;
    itemType: LibraryItem;
    setSortBy: Dispatch<SetStateAction<string>>;
    sortBy: string;
    target?: React.ReactNode;
}

export const ListSortByDropdownControlled = ({
    disabled,
    filters,
    itemType,
    setSortBy,
    sortBy,
    target,
}: ListSortByDropdownControlledProps) => {
    const server = useCurrentServer();

    const availableFilters = filters || (itemType && FILTERS[itemType]?.[server.type]) || [];

    const sortByLabel = availableFilters.find((f) => f.value === sortBy)?.name || '—';

    const handleSortByChange = (sortBy: string) => {
        setSortBy(sortBy);
    };

    return (
        <DropdownMenu disabled={disabled} position="bottom-start">
            <DropdownMenu.Target>
                {target ? (
                    target
                ) : (
                    <Button disabled={disabled} variant="subtle">
                        {sortByLabel}
                    </Button>
                )}
            </DropdownMenu.Target>
            <DropdownMenu.Dropdown>
                {availableFilters.map((f) => (
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

export const CLIENT_SIDE_SONG_FILTERS = [
    {
        defaultOrder: SortOrder.ASC,
        name: i18n.t('filter.id', { postProcess: 'titleCase' }),
        value: SongListSort.ID,
    },
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
        defaultOrder: SortOrder.ASC,
        name: i18n.t('filter.sortName', { postProcess: 'titleCase' }),
        value: SongListSort.SORT_NAME,
    },
    {
        defaultOrder: SortOrder.DESC,
        name: i18n.t('filter.playCount', { postProcess: 'titleCase' }),
        value: SongListSort.PLAY_COUNT,
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
];

export const CLIENT_SIDE_ALBUM_FILTERS = [
    {
        defaultOrder: SortOrder.ASC,
        name: i18n.t('filter.albumArtist', { postProcess: 'titleCase' }),
        value: AlbumListSort.ALBUM_ARTIST,
    },
    {
        defaultOrder: SortOrder.ASC,
        name: i18n.t('filter.id', { postProcess: 'titleCase' }),
        value: AlbumListSort.ID,
    },
    {
        defaultOrder: SortOrder.DESC,
        name: i18n.t('filter.duration', { postProcess: 'titleCase' }),
        value: AlbumListSort.DURATION,
    },
    {
        defaultOrder: SortOrder.DESC,
        name: i18n.t('filter.favorited', { postProcess: 'titleCase' }),
        value: AlbumListSort.FAVORITED,
    },
    {
        defaultOrder: SortOrder.ASC,
        name: i18n.t('filter.name', { postProcess: 'titleCase' }),
        value: AlbumListSort.NAME,
    },
    {
        defaultOrder: SortOrder.ASC,
        name: i18n.t('filter.sortName', { postProcess: 'titleCase' }),
        value: AlbumListSort.SORT_NAME,
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
        name: i18n.t('filter.releaseDate', { postProcess: 'titleCase' }),
        value: AlbumListSort.RELEASE_DATE,
    },
    {
        defaultOrder: SortOrder.DESC,
        name: i18n.t('filter.releaseYear', { postProcess: 'titleCase' }),
        value: AlbumListSort.YEAR,
    },
    {
        defaultOrder: SortOrder.DESC,
        name: i18n.t('filter.songCount', { postProcess: 'titleCase' }),
        value: AlbumListSort.SONG_COUNT,
    },
];

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
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.id', { postProcess: 'titleCase' }),
            value: AlbumListSort.ID,
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
            name: i18n.t('filter.id', { postProcess: 'titleCase' }),
            value: AlbumListSort.ID,
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
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.id', { postProcess: 'titleCase' }),
            value: AlbumListSort.ID,
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

const FOLDER_LIST_FILTERS: Partial<
    Record<ServerType, Array<{ defaultOrder: SortOrder; name: string; value: string }>>
> = {
    [ServerType.JELLYFIN]: [
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.id', { postProcess: 'titleCase' }),
            value: SongListSort.ID,
        },
        ...(SONG_LIST_FILTERS[ServerType.JELLYFIN] || []),
    ],
    [ServerType.NAVIDROME]: [
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.id', { postProcess: 'titleCase' }),
            value: SongListSort.ID,
        },
        ...(SONG_LIST_FILTERS[ServerType.NAVIDROME] || []),
    ],
    [ServerType.SUBSONIC]: [
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.id', { postProcess: 'titleCase' }),
            value: SongListSort.ID,
        },
        ...(SONG_LIST_FILTERS[ServerType.SUBSONIC] || []),
    ],
};

const PLAYLIST_SONG_LIST_FILTERS: Partial<
    Record<ServerType, Array<{ defaultOrder: SortOrder; name: string; value: string }>>
> = {
    [ServerType.JELLYFIN]: CLIENT_SIDE_SONG_FILTERS,
    [ServerType.NAVIDROME]: CLIENT_SIDE_SONG_FILTERS,
    [ServerType.SUBSONIC]: CLIENT_SIDE_SONG_FILTERS,
};

const ALBUM_ARTIST_LIST_FILTERS: Partial<
    Record<ServerType, Array<{ defaultOrder: SortOrder; name: string; value: string }>>
> = {
    [ServerType.JELLYFIN]: [
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.album', { postProcess: 'titleCase' }),
            value: AlbumArtistListSort.ALBUM,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.duration', { postProcess: 'titleCase' }),
            value: AlbumArtistListSort.DURATION,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.name', { postProcess: 'titleCase' }),
            value: AlbumArtistListSort.NAME,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.random', { postProcess: 'titleCase' }),
            value: AlbumArtistListSort.RANDOM,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.recentlyAdded', { postProcess: 'titleCase' }),
            value: AlbumArtistListSort.RECENTLY_ADDED,
        },
    ],
    [ServerType.NAVIDROME]: [
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.albumCount', { postProcess: 'titleCase' }),
            value: AlbumArtistListSort.ALBUM_COUNT,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.isFavorited', { postProcess: 'titleCase' }),
            value: AlbumArtistListSort.FAVORITED,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.mostPlayed', { postProcess: 'titleCase' }),
            value: AlbumArtistListSort.PLAY_COUNT,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.name', { postProcess: 'titleCase' }),
            value: AlbumArtistListSort.NAME,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.rating', { postProcess: 'titleCase' }),
            value: AlbumArtistListSort.RATING,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.songCount', { postProcess: 'titleCase' }),
            value: AlbumArtistListSort.SONG_COUNT,
        },
    ],
    [ServerType.SUBSONIC]: [
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.albumCount', { postProcess: 'titleCase' }),
            value: AlbumArtistListSort.ALBUM_COUNT,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.isFavorited', { postProcess: 'titleCase' }),
            value: AlbumArtistListSort.FAVORITED,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.name', { postProcess: 'titleCase' }),
            value: AlbumArtistListSort.NAME,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.rating', { postProcess: 'titleCase' }),
            value: AlbumArtistListSort.RATING,
        },
    ],
};

const ARTIST_LIST_FILTERS: Partial<
    Record<ServerType, Array<{ defaultOrder: SortOrder; name: string; value: string }>>
> = {
    [ServerType.JELLYFIN]: [
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.album', { postProcess: 'titleCase' }),
            value: ArtistListSort.ALBUM,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.duration', { postProcess: 'titleCase' }),
            value: ArtistListSort.DURATION,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.name', { postProcess: 'titleCase' }),
            value: ArtistListSort.NAME,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.random', { postProcess: 'titleCase' }),
            value: ArtistListSort.RANDOM,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.recentlyAdded', { postProcess: 'titleCase' }),
            value: ArtistListSort.RECENTLY_ADDED,
        },
    ],
    [ServerType.NAVIDROME]: [
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.albumCount', { postProcess: 'titleCase' }),
            value: ArtistListSort.ALBUM_COUNT,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.isFavorited', { postProcess: 'titleCase' }),
            value: ArtistListSort.FAVORITED,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.mostPlayed', { postProcess: 'titleCase' }),
            value: ArtistListSort.PLAY_COUNT,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.name', { postProcess: 'titleCase' }),
            value: ArtistListSort.NAME,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.rating', { postProcess: 'titleCase' }),
            value: ArtistListSort.RATING,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.songCount', { postProcess: 'titleCase' }),
            value: ArtistListSort.SONG_COUNT,
        },
    ],
    [ServerType.SUBSONIC]: [
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.albumCount', { postProcess: 'titleCase' }),
            value: ArtistListSort.ALBUM_COUNT,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.isFavorited', { postProcess: 'titleCase' }),
            value: ArtistListSort.FAVORITED,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.name', { postProcess: 'titleCase' }),
            value: ArtistListSort.NAME,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.rating', { postProcess: 'titleCase' }),
            value: ArtistListSort.RATING,
        },
    ],
};

const GENRE_LIST_FILTERS: Partial<
    Record<ServerType, Array<{ defaultOrder: SortOrder; name: string; value: string }>>
> = {
    [ServerType.JELLYFIN]: [
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.name', { postProcess: 'titleCase' }),
            value: GenreListSort.NAME,
        },
    ],
    [ServerType.NAVIDROME]: [
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.name', { postProcess: 'titleCase' }),
            value: GenreListSort.NAME,
        },
    ],
    [ServerType.SUBSONIC]: [
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.name', { postProcess: 'titleCase' }),
            value: GenreListSort.NAME,
        },
    ],
};

const PLAYLIST_LIST_FILTERS: Partial<
    Record<ServerType, Array<{ defaultOrder: SortOrder; name: string; value: string }>>
> = {
    [ServerType.JELLYFIN]: [
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.duration', { postProcess: 'titleCase' }),
            value: PlaylistListSort.DURATION,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.name', { postProcess: 'titleCase' }),
            value: PlaylistListSort.NAME,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.songCount', { postProcess: 'titleCase' }),
            value: PlaylistListSort.SONG_COUNT,
        },
    ],
    [ServerType.NAVIDROME]: [
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.duration', { postProcess: 'titleCase' }),
            value: PlaylistListSort.DURATION,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.name', { postProcess: 'titleCase' }),
            value: PlaylistListSort.NAME,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.owner', { postProcess: 'titleCase' }),
            value: PlaylistListSort.OWNER,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.isPublic', { postProcess: 'titleCase' }),
            value: PlaylistListSort.PUBLIC,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.songCount', { postProcess: 'titleCase' }),
            value: PlaylistListSort.SONG_COUNT,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.recentlyUpdated', { postProcess: 'titleCase' }),
            value: PlaylistListSort.UPDATED_AT,
        },
    ],
    [ServerType.SUBSONIC]: [
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.name', { postProcess: 'titleCase' }),
            value: PlaylistListSort.NAME,
        },
    ],
};

const RADIO_LIST_FILTERS: Partial<
    Record<ServerType, Array<{ defaultOrder: SortOrder; name: string; value: string }>>
> = {
    [ServerType.JELLYFIN]: [
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.id', { postProcess: 'titleCase' }),
            value: RadioListSort.ID,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.name', { postProcess: 'titleCase' }),
            value: RadioListSort.NAME,
        },
    ],
    [ServerType.NAVIDROME]: [
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.id', { postProcess: 'titleCase' }),
            value: RadioListSort.ID,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.name', { postProcess: 'titleCase' }),
            value: RadioListSort.NAME,
        },
    ],
    [ServerType.SUBSONIC]: [
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.id', { postProcess: 'titleCase' }),
            value: RadioListSort.ID,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.name', { postProcess: 'titleCase' }),
            value: RadioListSort.NAME,
        },
    ],
};

const FILTERS: Partial<Record<LibraryItem, any>> = {
    [LibraryItem.ALBUM]: ALBUM_LIST_FILTERS,
    [LibraryItem.ALBUM_ARTIST]: ALBUM_ARTIST_LIST_FILTERS,
    [LibraryItem.ARTIST]: ARTIST_LIST_FILTERS,
    [LibraryItem.FOLDER]: FOLDER_LIST_FILTERS,
    [LibraryItem.GENRE]: GENRE_LIST_FILTERS,
    [LibraryItem.PLAYLIST]: PLAYLIST_LIST_FILTERS,
    [LibraryItem.PLAYLIST_SONG]: PLAYLIST_SONG_LIST_FILTERS,
    [LibraryItem.RADIO_STATION]: RADIO_LIST_FILTERS,
    [LibraryItem.SONG]: SONG_LIST_FILTERS,
};
