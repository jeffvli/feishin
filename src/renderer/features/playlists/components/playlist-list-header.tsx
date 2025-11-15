import { useTranslation } from 'react-i18next';

import { PageHeader } from '/@/renderer/components/page-header/page-header';
import { useListContext } from '/@/renderer/context/list-context';
import { PlaylistListHeaderFilters } from '/@/renderer/features/playlists/components/playlist-list-header-filters';
import { FilterBar } from '/@/renderer/features/shared/components/filter-bar';
import { LibraryHeaderBar } from '/@/renderer/features/shared/components/library-header-bar';
import { ListSearchInput } from '/@/renderer/features/shared/components/list-search-input';
import { Group } from '/@/shared/components/group/group';
import { Stack } from '/@/shared/components/stack/stack';

interface PlaylistListHeaderProps {
    title?: string;
}

export const PlaylistListHeader = ({ title }: PlaylistListHeaderProps) => {
    const { t } = useTranslation();

    const { itemCount } = useListContext();
    const pageTitle = title || t('page.playlistList.title', { postProcess: 'titleCase' });

    return (
        <Stack gap={0}>
            <PageHeader backgroundColor="var(--theme-colors-background)">
                <LibraryHeaderBar>
                    <LibraryHeaderBar.PlayButton />
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
                <PlaylistListHeaderFilters />
            </FilterBar>
        </Stack>
    );
};
