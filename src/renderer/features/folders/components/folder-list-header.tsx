import { useTranslation } from 'react-i18next';

import { PageHeader } from '/@/renderer/components/page-header/page-header';
import { useListContext } from '/@/renderer/context/list-context';
import { FolderListHeaderFilters } from '/@/renderer/features/folders/components/folder-list-header-filters';
import { FilterBar } from '/@/renderer/features/shared/components/filter-bar';
import { LibraryHeaderBar } from '/@/renderer/features/shared/components/library-header-bar';
import { ListSearchInput } from '/@/renderer/features/shared/components/list-search-input';
import { Group } from '/@/shared/components/group/group';
import { Stack } from '/@/shared/components/stack/stack';

interface FolderListHeaderProps {
    title?: string;
}

export const FolderListHeader = ({ title }: FolderListHeaderProps) => {
    const { t } = useTranslation();

    const { itemCount } = useListContext();
    const pageTitle = title || t('page.folderList.title', { postProcess: 'titleCase' });

    return (
        <Stack gap={0}>
            <PageHeader>
                <LibraryHeaderBar ignoreMaxWidth>
                    <Stack>
                        <LibraryHeaderBar.Title>{pageTitle}</LibraryHeaderBar.Title>
                    </Stack>
                    <LibraryHeaderBar.Badge isLoading={itemCount === undefined}>
                        {itemCount}
                    </LibraryHeaderBar.Badge>
                </LibraryHeaderBar>
                <Group>
                    <ListSearchInput />
                </Group>
            </PageHeader>
            <FilterBar>
                <FolderListHeaderFilters />
            </FilterBar>
        </Stack>
    );
};
