import { useTranslation } from 'react-i18next';

import { PageHeader } from '/@/renderer/components/page-header/page-header';
import { useListContext } from '/@/renderer/context/list-context';
import { AlbumListHeaderFilters } from '/@/renderer/features/albums/components/album-list-header-filters';
import { useAlbumListFilters } from '/@/renderer/features/albums/hooks/use-album-list-filters';
import { FilterBar } from '/@/renderer/features/shared/components/filter-bar';
import { LibraryHeaderBar } from '/@/renderer/features/shared/components/library-header-bar';
import { ListSearchInput } from '/@/renderer/features/shared/components/list-search-input';
import { Group } from '/@/shared/components/group/group';
import { Stack } from '/@/shared/components/stack/stack';
import { LibraryItem } from '/@/shared/types/domain-types';

interface AlbumListHeaderProps {
    title?: string;
}

export const AlbumListHeader = ({ title }: AlbumListHeaderProps) => {
    const { t } = useTranslation();

    const { itemCount } = useListContext();
    const pageTitle = title || t('page.albumList.title', { postProcess: 'titleCase' });

    return (
        <Stack gap={0}>
            <PageHeader backgroundColor="var(--theme-colors-background)">
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
                <AlbumListHeaderFilters />
            </FilterBar>
        </Stack>
    );
};

const PlayButton = () => {
    const { query } = useAlbumListFilters();

    return <LibraryHeaderBar.PlayButton itemType={LibraryItem.ALBUM} query={query} />;
};
