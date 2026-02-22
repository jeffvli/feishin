import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { PageHeader } from '/@/renderer/components/page-header/page-header';
import { useListContext } from '/@/renderer/context/list-context';
import { AlbumListHeaderFilters } from '/@/renderer/features/albums/components/album-list-header-filters';
import { useAlbumListFilters } from '/@/renderer/features/albums/hooks/use-album-list-filters';
import { AlbumArtistListHeaderFilters } from '/@/renderer/features/artists/components/album-artist-list-header-filters';
import { useAlbumArtistListFilters } from '/@/renderer/features/artists/hooks/use-album-artist-list-filters';
import { FilterBar } from '/@/renderer/features/shared/components/filter-bar';
import { LibraryHeaderBar } from '/@/renderer/features/shared/components/library-header-bar';
import { ListSearchInput } from '/@/renderer/features/shared/components/list-search-input';
import { SongListHeaderFilters } from '/@/renderer/features/songs/components/song-list-header-filters';
import { useSongListFilters } from '/@/renderer/features/songs/hooks/use-song-list-filters';
import { DropdownMenu } from '/@/shared/components/dropdown-menu/dropdown-menu';
import { Flex } from '/@/shared/components/flex/flex';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { Stack } from '/@/shared/components/stack/stack';
import { TextTitle } from '/@/shared/components/text-title/text-title';
import { Text } from '/@/shared/components/text/text';
import { LibraryItem } from '/@/shared/types/domain-types';

interface FavoritesHeaderProps {
    itemType: LibraryItem;
}

export const FavoritesHeader = ({ itemType }: FavoritesHeaderProps) => {
    const { t } = useTranslation();
    const { customFilters, itemCount } = useListContext();
    const navigate = useNavigate();

    const albumFilters = useAlbumListFilters();
    const albumArtistFilters = useAlbumArtistListFilters();
    const songFilters = useSongListFilters();

    const playQuery = useMemo(() => {
        let query = {};
        switch (itemType) {
            case LibraryItem.ALBUM:
                query = albumFilters.query;
                break;
            case LibraryItem.ALBUM_ARTIST:
                query = albumArtistFilters.query;
                break;
            case LibraryItem.SONG:
                query = songFilters.query;
                break;
        }

        return {
            ...query,
            ...(customFilters ?? {}),
        };
    }, [albumFilters.query, albumArtistFilters.query, songFilters.query, customFilters, itemType]);

    const handleItemTypeChange = useCallback(
        (type: LibraryItem) => {
            albumFilters.clear();
            songFilters.clear();
            albumArtistFilters.clear();

            // Clear all URL search params except 'type'
            navigate(`?type=${type}`, { replace: true });
        },
        [albumFilters, albumArtistFilters, songFilters, navigate],
    );

    return (
        <Stack gap={0}>
            <PageHeader>
                <Flex justify="space-between" w="100%">
                    <LibraryHeaderBar ignoreMaxWidth>
                        <PlayButton itemType={itemType} query={playQuery} />
                        <LibraryHeaderBar.Title>
                            <DropdownMenu position="right">
                                <DropdownMenu.Target>
                                    <Stack gap={0} style={{ cursor: 'pointer' }}>
                                        <Group>
                                            <TextTitle isNoSelect order={3}>
                                                {t('page.favorites.title', {
                                                    postProcess: 'sentenceCase',
                                                })}
                                            </TextTitle>
                                            <Icon icon="dropdown" size="xl" />
                                        </Group>
                                        <Text isMuted size="sm">
                                            {itemType === LibraryItem.ALBUM &&
                                                t('entity.album', {
                                                    count: 2,
                                                    postProcess: 'sentenceCase',
                                                })}
                                            {itemType === LibraryItem.ALBUM_ARTIST &&
                                                t('entity.artist', {
                                                    count: 2,
                                                    postProcess: 'sentenceCase',
                                                })}
                                            {itemType === LibraryItem.SONG &&
                                                t('entity.track', {
                                                    count: 2,
                                                    postProcess: 'sentenceCase',
                                                })}
                                        </Text>
                                    </Stack>
                                </DropdownMenu.Target>
                                <DropdownMenu.Dropdown>
                                    <DropdownMenu.Item
                                        isSelected={itemType === LibraryItem.SONG}
                                        leftSection={<Icon icon="track" size="xl" />}
                                        onClick={() => handleItemTypeChange(LibraryItem.SONG)}
                                    >
                                        {t('entity.track', {
                                            count: 2,
                                            postProcess: 'sentenceCase',
                                        })}
                                    </DropdownMenu.Item>
                                    <DropdownMenu.Item
                                        isSelected={itemType === LibraryItem.ALBUM}
                                        leftSection={<Icon icon="album" size="xl" />}
                                        onClick={() => handleItemTypeChange(LibraryItem.ALBUM)}
                                    >
                                        {t('entity.album', {
                                            count: 2,
                                            postProcess: 'sentenceCase',
                                        })}
                                    </DropdownMenu.Item>
                                    <DropdownMenu.Item
                                        isSelected={itemType === LibraryItem.ALBUM_ARTIST}
                                        leftSection={<Icon icon="artist" size="xl" />}
                                        onClick={() =>
                                            handleItemTypeChange(LibraryItem.ALBUM_ARTIST)
                                        }
                                    >
                                        {t('entity.artist', {
                                            count: 2,
                                            postProcess: 'sentenceCase',
                                        })}
                                    </DropdownMenu.Item>
                                </DropdownMenu.Dropdown>
                            </DropdownMenu>
                        </LibraryHeaderBar.Title>
                        <LibraryHeaderBar.Badge isLoading={!itemCount}>
                            {itemCount}
                        </LibraryHeaderBar.Badge>
                    </LibraryHeaderBar>
                    <Group>
                        <ListSearchInput />
                    </Group>
                </Flex>
            </PageHeader>
            <FilterBar>
                {itemType === LibraryItem.ALBUM && <AlbumListHeaderFilters />}
                {itemType === LibraryItem.ALBUM_ARTIST && <AlbumArtistListHeaderFilters />}
                {itemType === LibraryItem.SONG && <SongListHeaderFilters />}
            </FilterBar>
        </Stack>
    );
};

const PlayButton = ({ itemType, query }: { itemType: LibraryItem; query: Record<string, any> }) => {
    return <LibraryHeaderBar.PlayButton itemType={itemType} listQuery={query} variant="filled" />;
};
