import { SONG_TABLE_COLUMNS } from '/@/renderer/components/item-list/item-table-list/default-columns';
import { ListConfigMenu } from '/@/renderer/features/shared/components/list-config-menu';
import { ListFilters } from '/@/renderer/features/shared/components/list-filters';
import { ListRefreshButton } from '/@/renderer/features/shared/components/list-refresh-button';
import { ListSortByDropdown } from '/@/renderer/features/shared/components/list-sort-by-dropdown';
import { ListSortOrderToggleButton } from '/@/renderer/features/shared/components/list-sort-order-toggle-button';
import { Divider } from '/@/shared/components/divider/divider';
import { Flex } from '/@/shared/components/flex/flex';
import { Group } from '/@/shared/components/group/group';
import { LibraryItem, SongListSort, SortOrder } from '/@/shared/types/domain-types';
import { ItemListKey } from '/@/shared/types/types';

export const SongListHeaderFilters = () => {
    return (
        <Flex justify="space-between">
            <Group gap="sm" w="100%">
                <ListSortByDropdown
                    defaultSortByValue={SongListSort.NAME}
                    itemType={LibraryItem.SONG}
                    listKey={ItemListKey.SONG}
                />
                <Divider orientation="vertical" />
                <ListSortOrderToggleButton
                    defaultSortOrder={SortOrder.ASC}
                    listKey={ItemListKey.SONG}
                />
                <ListFilters itemType={LibraryItem.SONG} />
                <ListRefreshButton listKey={ItemListKey.SONG} />
            </Group>
            <Group gap="sm" wrap="nowrap">
                <ListConfigMenu listKey={ItemListKey.SONG} tableColumnsData={SONG_TABLE_COLUMNS} />
            </Group>
        </Flex>
    );
};
