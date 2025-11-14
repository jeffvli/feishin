import { ALBUMARTIST_TABLE_COLUMNS } from '/@/renderer/components/virtual-table';
import { ListConfigMenu } from '/@/renderer/features/shared/components/list-config-menu';
import { ListMusicFolderDropdown } from '/@/renderer/features/shared/components/list-music-folder-dropdown';
import { ListRefreshButton } from '/@/renderer/features/shared/components/list-refresh-button';
import { ListSortByDropdown } from '/@/renderer/features/shared/components/list-sort-by-dropdown';
import { ListSortOrderToggleButton } from '/@/renderer/features/shared/components/list-sort-order-toggle-button';
import { useContainerQuery } from '/@/renderer/hooks';
import { Divider } from '/@/shared/components/divider/divider';
import { Flex } from '/@/shared/components/flex/flex';
import { Group } from '/@/shared/components/group/group';
import { AlbumArtistListSort, LibraryItem, SortOrder } from '/@/shared/types/domain-types';
import { ItemListKey } from '/@/shared/types/types';

export const AlbumArtistListHeaderFilters = () => {
    const cq = useContainerQuery();

    return (
        <Flex justify="space-between">
            <Group gap="sm" ref={cq.ref} w="100%">
                <ListSortByDropdown
                    defaultSortByValue={AlbumArtistListSort.NAME}
                    itemType={LibraryItem.ALBUM_ARTIST}
                    listKey={ItemListKey.ALBUM_ARTIST}
                />
                <Divider orientation="vertical" />
                <ListSortOrderToggleButton
                    defaultSortOrder={SortOrder.ASC}
                    listKey={ItemListKey.ALBUM_ARTIST}
                />
                <ListMusicFolderDropdown listKey={ItemListKey.ALBUM_ARTIST} />
                <ListRefreshButton listKey={ItemListKey.ALBUM_ARTIST} />
            </Group>
            <Group gap="sm" wrap="nowrap">
                <ListConfigMenu
                    listKey={ItemListKey.ALBUM_ARTIST}
                    tableColumnsData={ALBUMARTIST_TABLE_COLUMNS}
                />
            </Group>
        </Flex>
    );
};
