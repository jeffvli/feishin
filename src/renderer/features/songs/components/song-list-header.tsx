import { useSuspenseQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useIsFetchingItemListCount } from '/@/renderer/components/item-list/helpers/use-is-fetching-item-list';
import { PageHeader } from '/@/renderer/components/page-header/page-header';
import { useListContext } from '/@/renderer/context/list-context';
import { artistsQueries } from '/@/renderer/features/artists/api/artists-api';
import { useGenreList } from '/@/renderer/features/genres/api/genres-api';
import { FilterBar } from '/@/renderer/features/shared/components/filter-bar';
import { LibraryHeaderBar } from '/@/renderer/features/shared/components/library-header-bar';
import { ListSearchInput } from '/@/renderer/features/shared/components/list-search-input';
import { SongListHeaderFilters } from '/@/renderer/features/songs/components/song-list-header-filters';
import { useSongListFilters } from '/@/renderer/features/songs/hooks/use-song-list-filters';
import { useCurrentServerId } from '/@/renderer/store';
import { Flex } from '/@/shared/components/flex/flex';
import { Group } from '/@/shared/components/group/group';
import { Stack } from '/@/shared/components/stack/stack';
import { LibraryItem } from '/@/shared/types/domain-types';
import { ItemListKey } from '/@/shared/types/types';

interface SongListHeaderProps {
    genreId?: string;
    title?: string;
}

export const SongListHeader = ({ title }: SongListHeaderProps) => {
    return (
        <Stack gap={0}>
            <PageHeader>
                <Flex justify="space-between" w="100%">
                    <LibraryHeaderBar ignoreMaxWidth>
                        <PlayButton />
                        <PageTitle title={title} />
                        <SongListHeaderBadge />
                    </LibraryHeaderBar>
                    <Group>
                        <ListSearchInput />
                    </Group>
                </Flex>
            </PageHeader>
            <FilterBar>
                <SongListHeaderFilters />
            </FilterBar>
        </Stack>
    );
};

const SongListHeaderBadge = () => {
    const { itemCount } = useListContext();

    const isFetching = useIsFetchingItemListCount({
        itemType: LibraryItem.SONG,
    });

    return <LibraryHeaderBar.Badge isLoading={isFetching}>{itemCount}</LibraryHeaderBar.Badge>;
};

const PlayButton = () => {
    const { customFilters } = useListContext();
    const { query } = useSongListFilters();

    const mergedQuery = useMemo(() => {
        return {
            ...query,
            ...(customFilters ?? {}),
        };
    }, [query, customFilters]);

    return <LibraryHeaderBar.PlayButton itemType={LibraryItem.SONG} listQuery={mergedQuery} />;
};

const PageTitle = ({ title }: { title?: string }) => {
    const { t } = useTranslation();
    const { pageKey } = useListContext();
    const pageTitle = title || t('page.trackList.title');

    switch (pageKey) {
        case ItemListKey.ALBUM_ARTIST_SONG:
            return <AlbumArtistTitle />;
        case ItemListKey.GENRE_SONG:
            return <GenreTitle />;
    }

    return <LibraryHeaderBar.Title>{pageTitle}</LibraryHeaderBar.Title>;
};

const AlbumArtistTitle = () => {
    const { id } = useListContext();
    const serverId = useCurrentServerId();

    const { data: albumArtist } = useSuspenseQuery(
        artistsQueries.albumArtistDetail({
            query: { id: id! },
            serverId: serverId,
        }),
    );

    return <LibraryHeaderBar.Title>{albumArtist?.name || '—'}</LibraryHeaderBar.Title>;
};

const GenreTitle = () => {
    const { id } = useListContext();

    const { data: genre } = useGenreList();

    const name = useMemo(() => {
        return genre?.items.find((g) => g.id === id)?.name || '—';
    }, [id, genre]);

    return <LibraryHeaderBar.Title>{name || '—'}</LibraryHeaderBar.Title>;
};
