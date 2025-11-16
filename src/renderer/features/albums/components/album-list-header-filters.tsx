import { ALBUM_TABLE_COLUMNS } from '/@/renderer/components/item-list/item-table-list/default-columns';
import { ListConfigMenu } from '/@/renderer/features/shared/components/list-config-menu';
import { ListFilters } from '/@/renderer/features/shared/components/list-filters';
import { ListMusicFolderDropdown } from '/@/renderer/features/shared/components/list-music-folder-dropdown';
import { ListRefreshButton } from '/@/renderer/features/shared/components/list-refresh-button';
import { ListSortByDropdown } from '/@/renderer/features/shared/components/list-sort-by-dropdown';
import { ListSortOrderToggleButton } from '/@/renderer/features/shared/components/list-sort-order-toggle-button';
import { Divider } from '/@/shared/components/divider/divider';
import { Flex } from '/@/shared/components/flex/flex';
import { Group } from '/@/shared/components/group/group';
import { AlbumListSort, LibraryItem, SortOrder } from '/@/shared/types/domain-types';
import { ItemListKey } from '/@/shared/types/types';

export const AlbumListHeaderFilters = () => {
    return (
        <Flex justify="space-between">
            <Group gap="sm" w="100%">
                <ListSortByDropdown
                    defaultSortByValue={AlbumListSort.NAME}
                    itemType={LibraryItem.ALBUM}
                    listKey={ItemListKey.ALBUM}
                />
                <Divider orientation="vertical" />
                <ListSortOrderToggleButton
                    defaultSortOrder={SortOrder.ASC}
                    listKey={ItemListKey.ALBUM}
                />
                <ListMusicFolderDropdown listKey={ItemListKey.ALBUM} />
                <ListFilters itemType={LibraryItem.ALBUM} />
                <ListRefreshButton listKey={ItemListKey.ALBUM} />
            </Group>
            <Group gap="sm" wrap="nowrap">
                <ListConfigMenu
                    listKey={ItemListKey.ALBUM}
                    tableColumnsData={ALBUM_TABLE_COLUMNS}
                />
            </Group>
        </Flex>
    );
};
