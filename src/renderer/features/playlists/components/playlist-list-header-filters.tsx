import { MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { PLAYLIST_TABLE_COLUMNS } from '/@/renderer/components/item-list/item-table-list/default-columns';
import { openCreatePlaylistModal } from '/@/renderer/features/playlists/components/create-playlist-form';
import { ListConfigMenu } from '/@/renderer/features/shared/components/list-config-menu';
import { ListDisplayTypeToggleButton } from '/@/renderer/features/shared/components/list-display-type-toggle-button';
import { ListRefreshButton } from '/@/renderer/features/shared/components/list-refresh-button';
import { ListSortByDropdown } from '/@/renderer/features/shared/components/list-sort-by-dropdown';
import { ListSortOrderToggleButton } from '/@/renderer/features/shared/components/list-sort-order-toggle-button';
import { useCurrentServer } from '/@/renderer/store';
import { Button } from '/@/shared/components/button/button';
import { Divider } from '/@/shared/components/divider/divider';
import { Flex } from '/@/shared/components/flex/flex';
import { Group } from '/@/shared/components/group/group';
import { LibraryItem, PlaylistListSort, SortOrder } from '/@/shared/types/domain-types';
import { ItemListKey } from '/@/shared/types/types';

export const PlaylistListHeaderFilters = () => {
    const { t } = useTranslation();

    const server = useCurrentServer();

    const handleCreatePlaylistModal = (e: MouseEvent<HTMLButtonElement>) => {
        openCreatePlaylistModal(server, e);
    };

    return (
        <Flex justify="space-between">
            <Group gap="sm" w="100%">
                <ListSortByDropdown
                    defaultSortByValue={PlaylistListSort.NAME}
                    itemType={LibraryItem.PLAYLIST}
                    listKey={ItemListKey.PLAYLIST}
                />
                <Divider orientation="vertical" />
                <ListSortOrderToggleButton
                    defaultSortOrder={SortOrder.ASC}
                    listKey={ItemListKey.PLAYLIST}
                />
                <ListRefreshButton listKey={ItemListKey.PLAYLIST} />
            </Group>
            <Group gap="sm" wrap="nowrap">
                <Button onClick={handleCreatePlaylistModal} variant="subtle">
                    {t('action.createPlaylist', { postProcess: 'sentenceCase' })}
                </Button>
                <ListDisplayTypeToggleButton listKey={ItemListKey.PLAYLIST} />
                <ListConfigMenu
                    listKey={ItemListKey.PLAYLIST}
                    tableColumnsData={PLAYLIST_TABLE_COLUMNS}
                />
            </Group>
        </Flex>
    );
};
