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
        name: i18n.t('filter.id'),
        value: SongListSort.ID,
    },
    {
        defaultOrder: SortOrder.ASC,
        name: i18n.t('filter.album'),
        value: SongListSort.ALBUM,
    },
    {
        defaultOrder: SortOrder.ASC,
        name: i18n.t('filter.albumArtist'),
        value: SongListSort.ALBUM_ARTIST,
    },
    {
        defaultOrder: SortOrder.ASC,
        name: i18n.t('filter.artist'),
        value: SongListSort.ARTIST,
    },
    {
        defaultOrder: SortOrder.DESC,
        name: i18n.t('filter.bpm'),
        value: SongListSort.BPM,
    },
    {
        defaultOrder: SortOrder.ASC,
        name: i18n.t('common.channel', { count: 2 }),
        value: SongListSort.CHANNELS,
    },
    {
        defaultOrder: SortOrder.ASC,
        name: i18n.t('filter.comment'),
        value: SongListSort.COMMENT,
    },
    {
        defaultOrder: SortOrder.DESC,
        name: i18n.t('filter.duration'),
        value: SongListSort.DURATION,
    },
    {
        defaultOrder: SortOrder.DESC,
        name: i18n.t('filter.isFavorited'),
        value: SongListSort.FAVORITED,
    },
    {
        defaultOrder: SortOrder.ASC,
        name: i18n.t('filter.genre'),
        value: SongListSort.GENRE,
    },
    {
        defaultOrder: SortOrder.ASC,
        name: i18n.t('filter.name'),
        value: SongListSort.NAME,
    },
    {
        defaultOrder: SortOrder.ASC,
        name: i18n.t('filter.sortName'),
        value: SongListSort.SORT_NAME,
    },
    {
        defaultOrder: SortOrder.DESC,
        name: i18n.t('filter.playCount'),
        value: SongListSort.PLAY_COUNT,
    },
    {
        defaultOrder: SortOrder.DESC,
        name: i18n.t('filter.rating'),
        value: SongListSort.RATING,
    },
    {
        defaultOrder: SortOrder.DESC,
        name: i18n.t('filter.recentlyAdded'),
        value: SongListSort.RECENTLY_ADDED,
    },
    {
        defaultOrder: SortOrder.DESC,
        name: i18n.t('filter.recentlyPlayed'),
        value: SongListSort.RECENTLY_PLAYED,
    },
    {
        defaultOrder: SortOrder.DESC,
        name: i18n.t('filter.releaseYear'),
        value: SongListSort.YEAR,
    },
];

export const CLIENT_SIDE_ALBUM_FILTERS = [
    {
        defaultOrder: SortOrder.ASC,
        name: i18n.t('filter.albumArtist'),
        value: AlbumListSort.ALBUM_ARTIST,
    },
    {
        defaultOrder: SortOrder.ASC,
        name: i18n.t('filter.id'),
        value: AlbumListSort.ID,
    },
    {
        defaultOrder: SortOrder.DESC,
        name: i18n.t('filter.duration'),
        value: AlbumListSort.DURATION,
    },
    {
        defaultOrder: SortOrder.DESC,
        name: i18n.t('filter.favorited'),
        value: AlbumListSort.FAVORITED,
    },
    {
        defaultOrder: SortOrder.ASC,
        name: i18n.t('filter.name'),
        value: AlbumListSort.NAME,
    },
    {
        defaultOrder: SortOrder.ASC,
        name: i18n.t('filter.sortName'),
        value: AlbumListSort.SORT_NAME,
    },
    {
        defaultOrder: SortOrder.DESC,
        name: i18n.t('filter.playCount'),
        value: AlbumListSort.PLAY_COUNT,
    },
    {
        defaultOrder: SortOrder.ASC,
        name: i18n.t('filter.random'),
        value: AlbumListSort.RANDOM,
    },
    {
        defaultOrder: SortOrder.DESC,
        name: i18n.t('filter.rating'),
        value: AlbumListSort.RATING,
    },
    {
        defaultOrder: SortOrder.DESC,
        name: i18n.t('filter.recentlyAdded'),
        value: AlbumListSort.RECENTLY_ADDED,
    },
    {
        defaultOrder: SortOrder.DESC,
        name: i18n.t('filter.recentlyPlayed'),
        value: AlbumListSort.RECENTLY_PLAYED,
    },
    {
        defaultOrder: SortOrder.DESC,
        name: i18n.t('filter.releaseDate'),
        value: AlbumListSort.RELEASE_DATE,
    },
    {
        defaultOrder: SortOrder.DESC,
        name: i18n.t('filter.releaseYear'),
        value: AlbumListSort.YEAR,
    },
    {
        defaultOrder: SortOrder.DESC,
        name: i18n.t('filter.songCount'),
        value: AlbumListSort.SONG_COUNT,
    },
];

const ALBUM_LIST_FILTERS: Partial<
    Record<ServerType, Array<{ defaultOrder: SortOrder; name: string; value: string }>>
> = {
    [ServerType.JELLYFIN]: [
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.albumArtist'),
            value: AlbumListSort.ALBUM_ARTIST,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.id'),
            value: AlbumListSort.ID,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.communityRating'),
            value: AlbumListSort.COMMUNITY_RATING,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.criticRating'),
            value: AlbumListSort.CRITIC_RATING,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.name'),
            value: AlbumListSort.NAME,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.playCount'),
            value: AlbumListSort.PLAY_COUNT,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.random'),
            value: AlbumListSort.RANDOM,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.recentlyAdded'),
            value: AlbumListSort.RECENTLY_ADDED,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.releaseDate'),
            value: AlbumListSort.RELEASE_DATE,
        },
    ],
    [ServerType.NAVIDROME]: [
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.albumArtist'),
            value: AlbumListSort.ALBUM_ARTIST,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.id'),
            value: AlbumListSort.ID,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.artist'),
            value: AlbumListSort.ARTIST,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.duration'),
            value: AlbumListSort.DURATION,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.mostPlayed'),
            value: AlbumListSort.PLAY_COUNT,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.name'),
            value: AlbumListSort.NAME,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.random'),
            value: AlbumListSort.RANDOM,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.rating'),
            value: AlbumListSort.RATING,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.recentlyAdded'),
            value: AlbumListSort.RECENTLY_ADDED,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.recentlyPlayed'),
            value: AlbumListSort.RECENTLY_PLAYED,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.songCount'),
            value: AlbumListSort.SONG_COUNT,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.favorited'),
            value: AlbumListSort.FAVORITED,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.releaseYear'),
            value: AlbumListSort.YEAR,
        },
    ],
    [ServerType.SUBSONIC]: [
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.albumArtist'),
            value: AlbumListSort.ALBUM_ARTIST,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.id'),
            value: AlbumListSort.ID,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.mostPlayed'),
            value: AlbumListSort.PLAY_COUNT,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.name'),
            value: AlbumListSort.NAME,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.random'),
            value: AlbumListSort.RANDOM,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.recentlyAdded'),
            value: AlbumListSort.RECENTLY_ADDED,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.recentlyPlayed'),
            value: AlbumListSort.RECENTLY_PLAYED,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.favorited'),
            value: AlbumListSort.FAVORITED,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.releaseYear'),
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
            name: i18n.t('filter.album'),
            value: SongListSort.ALBUM,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.albumArtist'),
            value: SongListSort.ALBUM_ARTIST,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.artist'),
            value: SongListSort.ARTIST,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.duration'),
            value: SongListSort.DURATION,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.playCount'),
            value: SongListSort.PLAY_COUNT,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.name'),
            value: SongListSort.NAME,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.random'),
            value: SongListSort.RANDOM,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.recentlyAdded'),
            value: SongListSort.RECENTLY_ADDED,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.recentlyPlayed'),
            value: SongListSort.RECENTLY_PLAYED,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.releaseDate'),
            value: SongListSort.RELEASE_DATE,
        },
    ],
    [ServerType.NAVIDROME]: [
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.album'),
            value: SongListSort.ALBUM,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.albumArtist'),
            value: SongListSort.ALBUM_ARTIST,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.artist'),
            value: SongListSort.ARTIST,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.bpm'),
            value: SongListSort.BPM,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('common.channel', { count: 2 }),
            value: SongListSort.CHANNELS,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.comment'),
            value: SongListSort.COMMENT,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.duration'),
            value: SongListSort.DURATION,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.isFavorited'),
            value: SongListSort.FAVORITED,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.genre'),
            value: SongListSort.GENRE,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.name'),
            value: SongListSort.NAME,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.playCount'),
            value: SongListSort.PLAY_COUNT,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.random'),
            value: SongListSort.RANDOM,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.rating'),
            value: SongListSort.RATING,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.recentlyAdded'),
            value: SongListSort.RECENTLY_ADDED,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.recentlyPlayed'),
            value: SongListSort.RECENTLY_PLAYED,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.releaseYear'),
            value: SongListSort.YEAR,
        },
    ],
    [ServerType.SUBSONIC]: [
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.name'),
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
            name: i18n.t('filter.id'),
            value: SongListSort.ID,
        },
        ...(SONG_LIST_FILTERS[ServerType.JELLYFIN] || []),
    ],
    [ServerType.NAVIDROME]: [
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.id'),
            value: SongListSort.ID,
        },
        ...(SONG_LIST_FILTERS[ServerType.NAVIDROME] || []),
    ],
    [ServerType.SUBSONIC]: [
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.id'),
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
            name: i18n.t('filter.album'),
            value: AlbumArtistListSort.ALBUM,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.duration'),
            value: AlbumArtistListSort.DURATION,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.name'),
            value: AlbumArtistListSort.NAME,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.random'),
            value: AlbumArtistListSort.RANDOM,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.recentlyAdded'),
            value: AlbumArtistListSort.RECENTLY_ADDED,
        },
    ],
    [ServerType.NAVIDROME]: [
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.albumCount'),
            value: AlbumArtistListSort.ALBUM_COUNT,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.isFavorited'),
            value: AlbumArtistListSort.FAVORITED,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.mostPlayed'),
            value: AlbumArtistListSort.PLAY_COUNT,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.name'),
            value: AlbumArtistListSort.NAME,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.rating'),
            value: AlbumArtistListSort.RATING,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.songCount'),
            value: AlbumArtistListSort.SONG_COUNT,
        },
    ],
    [ServerType.SUBSONIC]: [
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.albumCount'),
            value: AlbumArtistListSort.ALBUM_COUNT,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.isFavorited'),
            value: AlbumArtistListSort.FAVORITED,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.name'),
            value: AlbumArtistListSort.NAME,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.rating'),
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
            name: i18n.t('filter.album'),
            value: ArtistListSort.ALBUM,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.duration'),
            value: ArtistListSort.DURATION,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.name'),
            value: ArtistListSort.NAME,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.random'),
            value: ArtistListSort.RANDOM,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.recentlyAdded'),
            value: ArtistListSort.RECENTLY_ADDED,
        },
    ],
    [ServerType.NAVIDROME]: [
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.albumCount'),
            value: ArtistListSort.ALBUM_COUNT,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.isFavorited'),
            value: ArtistListSort.FAVORITED,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.mostPlayed'),
            value: ArtistListSort.PLAY_COUNT,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.name'),
            value: ArtistListSort.NAME,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.rating'),
            value: ArtistListSort.RATING,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.songCount'),
            value: ArtistListSort.SONG_COUNT,
        },
    ],
    [ServerType.SUBSONIC]: [
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.albumCount'),
            value: ArtistListSort.ALBUM_COUNT,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.isFavorited'),
            value: ArtistListSort.FAVORITED,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.name'),
            value: ArtistListSort.NAME,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.rating'),
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
            name: i18n.t('filter.name'),
            value: GenreListSort.NAME,
        },
    ],
    [ServerType.NAVIDROME]: [
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.albumCount'),
            value: GenreListSort.ALBUM_COUNT,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.name'),
            value: GenreListSort.NAME,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.songCount'),
            value: GenreListSort.SONG_COUNT,
        },
    ],
    [ServerType.SUBSONIC]: [
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.albumCount'),
            value: GenreListSort.ALBUM_COUNT,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.name'),
            value: GenreListSort.NAME,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.albumCount'),
            value: GenreListSort.SONG_COUNT,
        },
    ],
};

const PLAYLIST_LIST_FILTERS: Partial<
    Record<ServerType, Array<{ defaultOrder: SortOrder; name: string; value: string }>>
> = {
    [ServerType.JELLYFIN]: [
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.duration'),
            value: PlaylistListSort.DURATION,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.name'),
            value: PlaylistListSort.NAME,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.songCount'),
            value: PlaylistListSort.SONG_COUNT,
        },
    ],
    [ServerType.NAVIDROME]: [
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.duration'),
            value: PlaylistListSort.DURATION,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.name'),
            value: PlaylistListSort.NAME,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.owner'),
            value: PlaylistListSort.OWNER,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.isPublic'),
            value: PlaylistListSort.PUBLIC,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.songCount'),
            value: PlaylistListSort.SONG_COUNT,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.recentlyUpdated'),
            value: PlaylistListSort.UPDATED_AT,
        },
    ],
    [ServerType.SUBSONIC]: [
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.name'),
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
            name: i18n.t('filter.id'),
            value: RadioListSort.ID,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.name'),
            value: RadioListSort.NAME,
        },
    ],
    [ServerType.NAVIDROME]: [
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.id'),
            value: RadioListSort.ID,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.name'),
            value: RadioListSort.NAME,
        },
    ],
    [ServerType.SUBSONIC]: [
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.id'),
            value: RadioListSort.ID,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.name'),
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
