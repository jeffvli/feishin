import { useTranslation } from 'react-i18next';

import { PageHeader } from '/@/renderer/components/page-header/page-header';
import { useListContext } from '/@/renderer/context/list-context';
import { AlbumArtistListHeaderFilters } from '/@/renderer/features/artists/components/album-artist-list-header-filters';
import { useAlbumArtistListFilters } from '/@/renderer/features/artists/hooks/use-album-artist-list-filters';
import { FilterBar } from '/@/renderer/features/shared/components/filter-bar';
import { LibraryHeaderBar } from '/@/renderer/features/shared/components/library-header-bar';
import { ListSearchInput } from '/@/renderer/features/shared/components/list-search-input';
import { Group } from '/@/shared/components/group/group';
import { Stack } from '/@/shared/components/stack/stack';
import { LibraryItem } from '/@/shared/types/domain-types';

interface AlbumArtistListHeaderProps {
    title?: string;
}

export const AlbumArtistListHeader = ({ title }: AlbumArtistListHeaderProps) => {
    const { t } = useTranslation();

    const { itemCount } = useListContext();
    const pageTitle = title || t('page.albumArtistList.title', { postProcess: 'titleCase' });

    return (
        <Stack gap={0}>
            <PageHeader>
                <LibraryHeaderBar>
                    <PlayButton />
                    <LibraryHeaderBar.Title>{pageTitle}</LibraryHeaderBar.Title>
                    <LibraryHeaderBar.Badge isLoading={!itemCount}>
                        {itemCount}
                    </LibraryHeaderBar.Badge>
                </LibraryHeaderBar>
                <Group>
                    <ListSearchInput />
                </Group>
            </PageHeader>
            <FilterBar>
                <AlbumArtistListHeaderFilters />
            </FilterBar>
        </Stack>
    );
};

const PlayButton = () => {
    const { query } = useAlbumArtistListFilters();

    return <LibraryHeaderBar.PlayButton itemType={LibraryItem.ALBUM_ARTIST} listQuery={query} />;
};
