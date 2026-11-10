import { useTranslation } from 'react-i18next';

import { PageHeader } from '/@/renderer/components/page-header/page-header';
import { useListContext } from '/@/renderer/context/list-context';
import { RadioListHeaderFilters } from '/@/renderer/features/radio/components/radio-list-header-filters';
import { FilterBar } from '/@/renderer/features/shared/components/filter-bar';
import { LibraryHeaderBar } from '/@/renderer/features/shared/components/library-header-bar';
import { ListSearchInput } from '/@/renderer/features/shared/components/list-search-input';
import { useCurrentServer } from '/@/renderer/store';
import { Group } from '/@/shared/components/group/group';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';
import { ServerType } from '/@/shared/types/domain-types';

interface RadioListHeaderProps {
    title?: string;
}

export const RadioListHeader = ({ title }: RadioListHeaderProps) => {
    const { t } = useTranslation();

    const server = useCurrentServer();
    const { itemCount } = useListContext();
    const pageTitle = title || t('page.radioList.title');

    return (
        <Stack gap={0}>
            <PageHeader>
                <LibraryHeaderBar ignoreMaxWidth>
                    <LibraryHeaderBar.Title>{pageTitle}</LibraryHeaderBar.Title>
                    <LibraryHeaderBar.Badge isLoading={itemCount === undefined}>
                        {itemCount}
                    </LibraryHeaderBar.Badge>
                </LibraryHeaderBar>
                <Group>
                    <ListSearchInput />
                </Group>
            </PageHeader>
            <FilterBar>
                <RadioListHeaderFilters />
                {server?.type === ServerType.JELLYFIN && (
                    <Text isMuted pt="xs" size="sm">
                        {t('page.radioList.localStorageNote')}
                    </Text>
                )}
            </FilterBar>
        </Stack>
    );
};
