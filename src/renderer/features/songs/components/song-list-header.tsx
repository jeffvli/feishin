import { useTranslation } from 'react-i18next';

import { PageHeader } from '/@/renderer/components/page-header/page-header';
import { useListContext } from '/@/renderer/context/list-context';
import { FilterBar } from '/@/renderer/features/shared/components/filter-bar';
import { LibraryHeaderBar } from '/@/renderer/features/shared/components/library-header-bar';
import { ListSearchInput } from '/@/renderer/features/shared/components/list-search-input';
import { SongListHeaderFilters } from '/@/renderer/features/songs/components/song-list-header-filters';
import { useSongListFilters } from '/@/renderer/features/songs/hooks/use-song-list-filters';
import { Flex } from '/@/shared/components/flex/flex';
import { Group } from '/@/shared/components/group/group';
import { Stack } from '/@/shared/components/stack/stack';
import { LibraryItem } from '/@/shared/types/domain-types';

interface SongListHeaderProps {
    genreId?: string;
    title?: string;
}

export const SongListHeader = ({ title }: SongListHeaderProps) => {
    const { t } = useTranslation();

    const { itemCount } = useListContext();
    const pageTitle = title || t('page.trackList.title', { postProcess: 'titleCase' });

    return (
        <Stack gap={0}>
            <PageHeader>
                <Flex justify="space-between" w="100%">
                    <LibraryHeaderBar>
                        <PlayButton />
                        <LibraryHeaderBar.Title>{pageTitle}</LibraryHeaderBar.Title>
                        <LibraryHeaderBar.Badge
                            isLoading={itemCount === null || itemCount === undefined}
                        >
                            {itemCount}
                        </LibraryHeaderBar.Badge>
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

const PlayButton = () => {
    const { query } = useSongListFilters();

    return <LibraryHeaderBar.PlayButton itemType={LibraryItem.SONG} listQuery={query} />;
};
