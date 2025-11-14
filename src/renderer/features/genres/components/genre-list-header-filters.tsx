import { GENRE_TABLE_COLUMNS } from '/@/renderer/components/virtual-table';
import { ListConfigMenu } from '/@/renderer/features/shared/components/list-config-menu';
import { ListFilters } from '/@/renderer/features/shared/components/list-filters';
import { ListMusicFolderDropdown } from '/@/renderer/features/shared/components/list-music-folder-dropdown';
import { ListRefreshButton } from '/@/renderer/features/shared/components/list-refresh-button';
import { ListSortByDropdown } from '/@/renderer/features/shared/components/list-sort-by-dropdown';
import { ListSortOrderToggleButton } from '/@/renderer/features/shared/components/list-sort-order-toggle-button';
import { useContainerQuery } from '/@/renderer/hooks';
import { Divider } from '/@/shared/components/divider/divider';
import { Flex } from '/@/shared/components/flex/flex';
import { Group } from '/@/shared/components/group/group';
import { GenreListSort, LibraryItem, SortOrder } from '/@/shared/types/domain-types';
import { ItemListKey } from '/@/shared/types/types';

export const GenreListHeaderFilters = () => {
    const cq = useContainerQuery();

    return (
        <Flex justify="space-between">
            <Group gap="sm" ref={cq.ref} w="100%">
                <ListSortByDropdown
                    defaultSortByValue={GenreListSort.NAME}
                    itemType={LibraryItem.GENRE}
                    listKey={ItemListKey.GENRE}
                />
                <Divider orientation="vertical" />
                <ListSortOrderToggleButton
                    defaultSortOrder={SortOrder.ASC}
                    listKey={ItemListKey.GENRE}
                />
                <ListMusicFolderDropdown listKey={ItemListKey.GENRE} />
                <ListFilters itemType={LibraryItem.GENRE} />
                <ListRefreshButton listKey={ItemListKey.GENRE} />
            </Group>
            <Group gap="sm" wrap="nowrap">
                <ListConfigMenu
                    listKey={ItemListKey.GENRE}
                    tableColumnsData={GENRE_TABLE_COLUMNS}
                />
            </Group>
        </Flex>
    );
};
