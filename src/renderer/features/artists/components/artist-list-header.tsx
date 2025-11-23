import { useTranslation } from 'react-i18next';

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

    const { itemCount } = useListContext();
    const pageTitle = title || t('entity.artist_other', { postProcess: 'titleCase' });

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
                <ArtistListHeaderFilters />
            </FilterBar>
        </Stack>
    );
};

const PlayButton = () => {
    const { query } = useArtistListFilters();

    return <LibraryHeaderBar.PlayButton itemType={LibraryItem.ARTIST} listQuery={query} />;
};
