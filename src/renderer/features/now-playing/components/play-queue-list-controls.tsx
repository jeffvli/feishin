import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';

import { type MutableRefObject } from 'react';
import { useTranslation } from 'react-i18next';

import { SONG_TABLE_COLUMNS } from '/@/renderer/components/virtual-table';
import { usePlayerContext } from '/@/renderer/features/player/context/player-context';
import { updateSong } from '/@/renderer/features/player/update-remote-song';
import { ListConfigMenu } from '/@/renderer/features/shared/components/list-config-menu';
import { usePlaybackType } from '/@/renderer/store/settings.store';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Group } from '/@/shared/components/group/group';
import { Song } from '/@/shared/types/domain-types';
import { ItemListKey } from '/@/shared/types/types';

interface PlayQueueListOptionsProps {
    handleSearch: (value: string) => void;
    searchTerm?: string;
    tableRef: MutableRefObject<null | { grid: AgGridReactType<Song> }>;
    type: ItemListKey;
}

export const PlayQueueListControls = ({
    handleSearch,
    searchTerm,
    tableRef,
    type,
}: PlayQueueListOptionsProps) => {
    const { t } = useTranslation();
    // const {
    //     clearQueue,
    //     moveToBottomOfQueue,
    //     moveToNextOfQueue,
    //     moveToTopOfQueue,
    //     removeFromQueue,
    //     shuffleQueue,
    // } = useQueueControls();

    // const { pause } = usePlayerControls();

    const player = usePlayerContext();

    const playbackType = usePlaybackType();
    // const setCurrentTime = useSetCurrentTime();

    const handleMoveToNext = () => {
        // const selectedRows = tableRef?.current?.grid.api.getSelectedRows();
        // const uniqueIds = selectedRows?.map((row) => row.uniqueId);
        // if (!uniqueIds?.length) return;
        // // const playerData = moveToNextOfQueue(uniqueIds);
        // // if (playbackType === PlaybackType.LOCAL) {
        // //     setQueueNext(playerData);
        // // }
        // player.moveSelectedToNext(selectedRows);
    };

    const handleMoveToBottom = () => {
        // const selectedRows = tableRef?.current?.grid.api.getSelectedRows();
        // const uniqueIds = selectedRows?.map((row) => row.uniqueId);
        // if (!uniqueIds?.length) return;
        // const playerData = moveToBottomOfQueue(uniqueIds);
        // if (playbackType === PlaybackType.LOCAL) {
        //     setQueueNext(playerData);
        // }
    };

    const handleMoveToTop = () => {
        // const selectedRows = tableRef?.current?.grid.api.getSelectedRows();
        // const uniqueIds = selectedRows?.map((row) => row.uniqueId);
        // if (!uniqueIds?.length) return;
        // const playerData = moveToTopOfQueue(uniqueIds);
        // if (playbackType === PlaybackType.LOCAL) {
        //     setQueueNext(playerData);
        // }
    };

    const handleRemoveSelected = () => {
        // const selectedRows = tableRef?.current?.grid.api.getSelectedRows();
        // const uniqueIds = selectedRows?.map((row) => row.uniqueId);
        // if (!uniqueIds?.length) return;
        // const currentSong = usePlayerStore.getState().current.song;
        // const playerData = removeFromQueue(uniqueIds);
        // const isCurrentSongRemoved = currentSong && uniqueIds.includes(currentSong.uniqueId);
        // if (playbackType === PlaybackType.LOCAL) {
        //     if (isCurrentSongRemoved) {
        //         setQueue(playerData);
        //     } else {
        //         setQueueNext(playerData);
        //     }
        // }
        // if (isCurrentSongRemoved) {
        //     updateSong(playerData.current.song);
        // }
    };

    const handleClearQueue = () => {
        // const playerData = clearQueue();

        // if (playbackType === PlaybackType.LOCAL) {
        //     setQueue(playerData);
        //     mpvPlayer!.pause();
        // }

        player.clearQueue();

        // setCurrentTime(0);
        // pause();
    };

    const handleShuffleQueue = () => {
        // const playerData = shuffleQueue();
        // if (playbackType === PlaybackType.LOCAL) {
        //     setQueueNext(playerData);
        // }
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
            <Group>
                <ListConfigMenu
                    listKey={ItemListKey.SIDE_QUEUE}
                    tableColumnsData={SONG_TABLE_COLUMNS}
                />
            </Group>
        </Group>
    );
};
