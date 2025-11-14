import { useQuery } from '@tanstack/react-query';

import { ARTIST_TABLE_COLUMNS } from '/@/renderer/components/virtual-table';
import { sharedQueries } from '/@/renderer/features/shared/api/shared-api';
import { ListConfigMenu } from '/@/renderer/features/shared/components/list-config-menu';
import { ListMusicFolderDropdown } from '/@/renderer/features/shared/components/list-music-folder-dropdown';
import { ListRefreshButton } from '/@/renderer/features/shared/components/list-refresh-button';
import { ListSelectFilter } from '/@/renderer/features/shared/components/list-select-filter';
import { ListSortByDropdown } from '/@/renderer/features/shared/components/list-sort-by-dropdown';
import { ListSortOrderToggleButton } from '/@/renderer/features/shared/components/list-sort-order-toggle-button';
import { FILTER_KEYS } from '/@/renderer/features/shared/utils';
import { useContainerQuery } from '/@/renderer/hooks';
import { useCurrentServer } from '/@/renderer/store';
import { Divider } from '/@/shared/components/divider/divider';
import { Flex } from '/@/shared/components/flex/flex';
import { Group } from '/@/shared/components/group/group';
import { ArtistListSort, LibraryItem, SortOrder } from '/@/shared/types/domain-types';
import { ItemListKey } from '/@/shared/types/types';

export const ArtistListHeaderFilters = () => {
    const cq = useContainerQuery();
    const server = useCurrentServer();

    const rolesQuery = useQuery(sharedQueries.roles({ query: {}, serverId: server.id }));

    return (
        <Flex justify="space-between">
            <Group gap="sm" ref={cq.ref} w="100%">
                <ListSortByDropdown
                    defaultSortByValue={ArtistListSort.NAME}
                    itemType={LibraryItem.ARTIST}
                    listKey={ItemListKey.ARTIST}
                />
                <Divider orientation="vertical" />
                <ListSortOrderToggleButton
                    defaultSortOrder={SortOrder.ASC}
                    listKey={ItemListKey.ARTIST}
                />
                <ListMusicFolderDropdown listKey={ItemListKey.ARTIST} />
                {rolesQuery.data && rolesQuery.data.length > 0 && (
                    <>
                        <Divider orientation="vertical" />
                        <ListSelectFilter
                            data={rolesQuery.data}
                            filterKey={FILTER_KEYS.ARTIST.ROLE}
                            listKey={ItemListKey.ARTIST}
                        />
                    </>
                )}
                <ListRefreshButton listKey={ItemListKey.ARTIST} />
            </Group>
            <Group gap="sm" wrap="nowrap">
                <ListConfigMenu
                    listKey={ItemListKey.ARTIST}
                    tableColumnsData={ARTIST_TABLE_COLUMNS}
                />
            </Group>
        </Flex>
    );
};
