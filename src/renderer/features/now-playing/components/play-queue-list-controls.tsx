import { type MutableRefObject } from 'react';
import { useTranslation } from 'react-i18next';

import { ItemListHandle } from '/@/renderer/components/item-list/types';
import { SONG_TABLE_COLUMNS } from '/@/renderer/components/virtual-table';
import { usePlayerContext } from '/@/renderer/features/player/context/player-context';
import { updateSong } from '/@/renderer/features/player/update-remote-song';
import { ListConfigMenu } from '/@/renderer/features/shared/components/list-config-menu';
import { SearchInput } from '/@/renderer/features/shared/components/search-input';
import { usePlayerSong, usePlayerStoreBase } from '/@/renderer/store';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Group } from '/@/shared/components/group/group';
import { QueueSong } from '/@/shared/types/domain-types';
import { ItemListKey } from '/@/shared/types/types';

interface PlayQueueListOptionsProps {
    handleSearch: (value: string) => void;
    searchTerm?: string;
    tableRef: MutableRefObject<ItemListHandle | null>;
    type: ItemListKey;
}

export const PlayQueueListControls = ({
    handleSearch,
    searchTerm,
    tableRef,
}: PlayQueueListOptionsProps) => {
    const { t } = useTranslation();
    const player = usePlayerContext();
    const currentSong = usePlayerSong();

    const handleMoveToNext = () => {
        const selectedItems = tableRef?.current?.internalState.getSelected() as
            | QueueSong[]
            | undefined;
        if (!selectedItems || selectedItems.length === 0) return;
        player.moveSelectedToNext(selectedItems);
    };

    const handleMoveToBottom = () => {
        const selectedItems = tableRef?.current?.internalState.getSelected() as
            | QueueSong[]
            | undefined;
        if (!selectedItems || selectedItems.length === 0) return;
        player.moveSelectedToBottom(selectedItems);
    };

    const handleMoveToTop = () => {
        const selectedItems = tableRef?.current?.internalState.getSelected() as
            | QueueSong[]
            | undefined;
        if (!selectedItems || selectedItems.length === 0) return;
        player.moveSelectedToTop(selectedItems);
    };

    const handleRemoveSelected = () => {
        const selectedItems = tableRef?.current?.internalState.getSelected() as
            | QueueSong[]
            | undefined;
        if (!selectedItems || selectedItems.length === 0) return;

        const selectedUniqueIds = selectedItems.map((item) => item._uniqueId);
        const isCurrentSongRemoved =
            currentSong && selectedUniqueIds.includes(currentSong._uniqueId);

        player.clearSelected(selectedItems);

        if (isCurrentSongRemoved) {
            // Get the new current song after removal
            const newCurrentSong = usePlayerStoreBase.getState().getCurrentSong();
            updateSong(newCurrentSong);
        }
    };

    const handleClearQueue = () => {
        player.clearQueue();
    };

    const handleShuffleQueue = () => {
        player.shuffleAll();
    };

    return (
        <Group justify="space-between" px="1rem" py="1rem" w="100%">
            <Group gap="xs">
                <ActionIcon
                    icon="mediaShuffle"
                    iconProps={{ size: 'lg' }}
                    onClick={handleShuffleQueue}
                    tooltip={{ label: t('player.shuffle', { postProcess: 'sentenceCase' }) }}
                    variant="subtle"
                />
                <ActionIcon
                    // disabled={hasSearch}
                    icon="mediaPlayNext"
                    iconProps={{ size: 'lg' }}
                    onClick={handleMoveToNext}
                    tooltip={{ label: t('action.moveToNext', { postProcess: 'sentenceCase' }) }}
                    variant="subtle"
                />
                <ActionIcon
                    // disabled={hasSearch}
                    icon="arrowDownToLine"
                    iconProps={{ size: 'lg' }}
                    onClick={handleMoveToBottom}
                    tooltip={{ label: t('action.moveToBottom', { postProcess: 'sentenceCase' }) }}
                    variant="subtle"
                />
                <ActionIcon
                    // disabled={hasSearch}
                    icon="arrowUpToLine"
                    iconProps={{ size: 'lg' }}
                    onClick={handleMoveToTop}
                    tooltip={{ label: t('action.moveToTop', { postProcess: 'sentenceCase' }) }}
                    variant="subtle"
                />
                <ActionIcon
                    icon="delete"
                    iconProps={{ size: 'lg' }}
                    onClick={handleRemoveSelected}
                    tooltip={{
                        label: t('action.removeFromQueue', { postProcess: 'sentenceCase' }),
                    }}
                    variant="subtle"
                />
                <ActionIcon
                    icon="x"
                    iconProps={{ size: 'lg' }}
                    onClick={handleClearQueue}
                    tooltip={{ label: t('action.clearQueue', { postProcess: 'sentenceCase' }) }}
                    variant="subtle"
                />
            </Group>
            <Group gap="xs">
                <SearchInput
                    enableHotkey={false}
                    onChange={(e) => handleSearch(e.target.value)}
                    value={searchTerm}
                />
                <ListConfigMenu
                    listKey={ItemListKey.SIDE_QUEUE}
                    tableColumnsData={SONG_TABLE_COLUMNS}
                />
            </Group>
        </Group>
    );
};
