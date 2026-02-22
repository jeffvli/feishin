import { useTranslation } from 'react-i18next';

import { useIsFetchingItemListCount } from '/@/renderer/components/item-list/helpers/use-is-fetching-item-list';
import { PageHeader } from '/@/renderer/components/page-header/page-header';
import { useListContext } from '/@/renderer/context/list-context';
import { ArtistListHeaderFilters } from '/@/renderer/features/artists/components/artist-list-header-filters';
import { useArtistListFilters } from '/@/renderer/features/artists/hooks/use-artist-list-filters';
import { FilterBar } from '/@/renderer/features/shared/components/filter-bar';
import { LibraryHeaderBar } from '/@/renderer/features/shared/components/library-header-bar';
import { ListSearchInput } from '/@/renderer/features/shared/components/list-search-input';
import { Group } from '/@/shared/components/group/group';
import { Stack } from '/@/shared/components/stack/stack';
import { LibraryItem } from '/@/shared/types/domain-types';

interface ArtistListHeaderProps {
    title?: string;
}

export const ArtistListHeader = ({ title }: ArtistListHeaderProps) => {
    const { t } = useTranslation();

    const pageTitle = title || t('entity.artist', { count: 2, postProcess: 'titleCase' });

    return (
        <Stack gap={0}>
            <PageHeader>
                <LibraryHeaderBar ignoreMaxWidth>
                    <PlayButton />
                    <LibraryHeaderBar.Title>{pageTitle}</LibraryHeaderBar.Title>
                    <ArtistListHeaderBadge />
                </LibraryHeaderBar>
                <Group>
                    <ListSearchInput />
                </Group>
            </PageHeader>
            <FilterBar>
                <ArtistListHeaderFilters />
            </FilterBar>
        </Stack>
    );
};

const ArtistListHeaderBadge = () => {
    const { itemCount } = useListContext();

    const isFetching = useIsFetchingItemListCount({
        itemType: LibraryItem.ARTIST,
    });

    return <LibraryHeaderBar.Badge isLoading={isFetching}>{itemCount}</LibraryHeaderBar.Badge>;
};

const PlayButton = () => {
    const { query } = useArtistListFilters();

    return <LibraryHeaderBar.PlayButton itemType={LibraryItem.ARTIST} listQuery={query} />;
};
