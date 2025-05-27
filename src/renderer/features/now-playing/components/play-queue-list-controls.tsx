import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import type { MutableRefObject } from 'react';

import isElectron from 'is-electron';
import { useTranslation } from 'react-i18next';
import {
    RiArrowDownLine,
    RiArrowGoForwardLine,
    RiArrowUpLine,
    RiDeleteBinLine,
    RiEraserLine,
    RiListSettingsLine,
    RiShuffleLine,
} from 'react-icons/ri';

import { TableConfigDropdown } from '/@/renderer/components/virtual-table';
import { updateSong } from '/@/renderer/features/player/update-remote-song';
import { usePlayerControls, useQueueControls } from '/@/renderer/store';
import { usePlayerStore, useSetCurrentTime } from '/@/renderer/store/player.store';
import { usePlaybackType } from '/@/renderer/store/settings.store';
import { setQueue, setQueueNext } from '/@/renderer/utils/set-transcoded-queue-data';
import { Button } from '/@/shared/components/button/button';
import { Group } from '/@/shared/components/group/group';
import { Popover } from '/@/shared/components/popover/popover';
import { Song } from '/@/shared/types/domain-types';
import { PlaybackType, TableType } from '/@/shared/types/types';

const mpvPlayer = isElectron() ? window.api.mpvPlayer : null;

interface PlayQueueListOptionsProps {
    tableRef: MutableRefObject<null | { grid: AgGridReactType<Song> }>;
    type: TableType;
}

export const PlayQueueListControls = ({ tableRef, type }: PlayQueueListOptionsProps) => {
    const { t } = useTranslation();
    const {
        clearQueue,
        moveToBottomOfQueue,
        moveToNextOfQueue,
        moveToTopOfQueue,
        removeFromQueue,
        shuffleQueue,
    } = useQueueControls();

    const { pause } = usePlayerControls();

    const playbackType = usePlaybackType();
    const setCurrentTime = useSetCurrentTime();

    const handleMoveToNext = () => {
        const selectedRows = tableRef?.current?.grid.api.getSelectedRows();
        const uniqueIds = selectedRows?.map((row) => row.uniqueId);
        if (!uniqueIds?.length) return;

        const playerData = moveToNextOfQueue(uniqueIds);

        if (playbackType === PlaybackType.LOCAL) {
            setQueueNext(playerData);
        }
    };

    const handleMoveToBottom = () => {
        const selectedRows = tableRef?.current?.grid.api.getSelectedRows();
        const uniqueIds = selectedRows?.map((row) => row.uniqueId);
        if (!uniqueIds?.length) return;

        const playerData = moveToBottomOfQueue(uniqueIds);

        if (playbackType === PlaybackType.LOCAL) {
            setQueueNext(playerData);
        }
    };

    const handleMoveToTop = () => {
        const selectedRows = tableRef?.current?.grid.api.getSelectedRows();
        const uniqueIds = selectedRows?.map((row) => row.uniqueId);
        if (!uniqueIds?.length) return;

        const playerData = moveToTopOfQueue(uniqueIds);

        if (playbackType === PlaybackType.LOCAL) {
            setQueueNext(playerData);
        }
    };

    const handleRemoveSelected = () => {
        const selectedRows = tableRef?.current?.grid.api.getSelectedRows();
        const uniqueIds = selectedRows?.map((row) => row.uniqueId);
        if (!uniqueIds?.length) return;

        const currentSong = usePlayerStore.getState().current.song;
        const playerData = removeFromQueue(uniqueIds);
        const isCurrentSongRemoved = currentSong && uniqueIds.includes(currentSong.uniqueId);

        if (playbackType === PlaybackType.LOCAL) {
            if (isCurrentSongRemoved) {
                setQueue(playerData);
            } else {
                setQueueNext(playerData);
            }
        }

        if (isCurrentSongRemoved) {
            updateSong(playerData.current.song);
        }
    };

    const handleClearQueue = () => {
        const playerData = clearQueue();

        if (playbackType === PlaybackType.LOCAL) {
            setQueue(playerData);
            mpvPlayer!.pause();
        }

        updateSong(undefined);

        setCurrentTime(0);
        pause();
    };

    const handleShuffleQueue = () => {
        const playerData = shuffleQueue();

        if (playbackType === PlaybackType.LOCAL) {
            setQueueNext(playerData);
        }
    };

    return (
        <Group
            justify="space-between"
            px="1rem"
            py="1rem"
            style={{ alignItems: 'center' }}
            w="100%"
        >
            <Group gap="sm">
                <Button
                    onClick={handleShuffleQueue}
                    size="compact-md"
                    tooltip={{ label: t('player.shuffle', { postProcess: 'sentenceCase' }) }}
                    variant="default"
                >
                    <RiShuffleLine size="1.1rem" />
                </Button>
                <Button
                    onClick={handleMoveToNext}
                    size="compact-md"
                    tooltip={{ label: t('action.moveToNext', { postProcess: 'sentenceCase' }) }}
                    variant="default"
                >
                    <RiArrowGoForwardLine size="1.1rem" />
                </Button>
                <Button
                    onClick={handleMoveToBottom}
                    size="compact-md"
                    tooltip={{ label: t('action.moveToBottom', { postProcess: 'sentenceCase' }) }}
                    variant="default"
                >
                    <RiArrowDownLine size="1.1rem" />
                </Button>
                <Button
                    onClick={handleMoveToTop}
                    size="compact-md"
                    tooltip={{ label: t('action.moveToTop', { postProcess: 'sentenceCase' }) }}
                    variant="default"
                >
                    <RiArrowUpLine size="1.1rem" />
                </Button>
                <Button
                    onClick={handleRemoveSelected}
                    size="compact-md"
                    tooltip={{
                        label: t('action.removeFromQueue', { postProcess: 'sentenceCase' }),
                    }}
                    variant="default"
                >
                    <RiEraserLine size="1.1rem" />
                </Button>
                <Button
                    onClick={handleClearQueue}
                    size="compact-md"
                    tooltip={{ label: t('action.clearQueue', { postProcess: 'sentenceCase' }) }}
                    variant="default"
                >
                    <RiDeleteBinLine size="1.1rem" />
                </Button>
            </Group>
            <Group>
                <Popover
                    position="top-end"
                    transitionProps={{ transition: 'fade' }}
                >
                    <Popover.Target>
                        <Button
                            size="compact-md"
                            tooltip={{
                                label: t('common.configure', { postProcess: 'sentenceCase' }),
                            }}
                            variant="subtle"
                        >
                            <RiListSettingsLine size="1.1rem" />
                        </Button>
                    </Popover.Target>
                    <Popover.Dropdown>
                        <TableConfigDropdown type={type} />
                    </Popover.Dropdown>
                </Popover>
            </Group>
        </Group>
    );
};
