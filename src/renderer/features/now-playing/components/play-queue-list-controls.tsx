import { useIsFetching } from '@tanstack/react-query';
import { t } from 'i18next';
import { MouseEvent, RefObject, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import styles from './play-queue-list-controls.module.css';

import { queryKeys } from '/@/renderer/api/query-keys';
import { SONG_TABLE_COLUMNS } from '/@/renderer/components/item-list/item-table-list/default-columns';
import { ItemListHandle } from '/@/renderer/components/item-list/types';
import { usePlayer } from '/@/renderer/features/player/context/player-context';
import { useRestoreQueue, useSaveQueue } from '/@/renderer/features/player/hooks/use-queue-restore';
import { openCreatePrefilledPlaylistModal } from '/@/renderer/features/playlists/components/create-playlist-form';
import {
    ListConfigMenu,
    SONG_DISPLAY_TYPES,
} from '/@/renderer/features/shared/components/list-config-menu';
import { SearchInput } from '/@/renderer/features/shared/components/search-input';
import { useCurrentServer, usePlayerStoreBase } from '/@/renderer/store';
import { hasFeature } from '/@/shared/api/utils';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Box } from '/@/shared/components/box/box';
import { Divider } from '/@/shared/components/divider/divider';
import { Group } from '/@/shared/components/group/group';
import { toast } from '/@/shared/components/toast/toast';
import { ServerFeature } from '/@/shared/types/features-types';
import { ItemListKey, ListDisplayType } from '/@/shared/types/types';

interface PlayQueueListOptionsProps {
    handleSearch: (value: string) => void;
    searchTerm?: string;
    tableRef: RefObject<ItemListHandle | null>;
    type: ItemListKey;
}

export const PlayQueueListControls = ({
    handleSearch,
    searchTerm,
    tableRef,
    type,
}: PlayQueueListOptionsProps) => {
    return (
        <Group
            align="center"
            className={styles.toolbar}
            gap="sm"
            justify="flex-start"
            px="md"
            py="xs"
            style={{ borderBottom: '1px solid var(--theme-colors-border)' }}
            w="100%"
            wrap="nowrap"
        >
            <Group gap="xs" style={{ flexShrink: 0 }} wrap="nowrap">
                <QueueRestoreActions />
                <QueuePlaybackIcons tableRef={tableRef} />
                <QueuePlaylistIcons />
            </Group>
            <Divider h="60%" orientation="vertical" style={{ alignSelf: 'center' }} />
            <Box style={{ display: 'flex', flex: 1, minWidth: 0 }}>
                <SearchInput
                    enableHotkey={false}
                    fillContainer
                    onChange={(e) => handleSearch(e.target.value)}
                    value={searchTerm}
                />
            </Box>
            <Divider h="60%" orientation="vertical" style={{ alignSelf: 'center' }} />
            <Box style={{ flexShrink: 0 }}>
                <ListConfigMenu
                    displayTypes={[
                        { hidden: true, value: ListDisplayType.GRID },
                        ...SONG_DISPLAY_TYPES,
                    ]}
                    listKey={type}
                    optionsConfig={{
                        table: {
                            itemsPerPage: { hidden: true },
                            pagination: { hidden: true },
                        },
                    }}
                    tableColumnsData={SONG_TABLE_COLUMNS}
                />
            </Box>
        </Group>
    );
};

const QueuePlaylistIcons = () => {
    const server = useCurrentServer();
    const player = usePlayer();

    const handleCreatePlaylistFromQueue = (e: MouseEvent<HTMLButtonElement>) => {
        const queueSongs = player.getQueue();

        openCreatePrefilledPlaylistModal(server, queueSongs, e);
    };

    return (
        <>
            <ActionIcon
                icon="playlistAdd"
                iconProps={{ size: 'lg' }}
                onClick={handleCreatePlaylistFromQueue}
                tooltip={{ label: t('action.createPlaylistFromQueue') }}
                variant="subtle"
            />
        </>
    );
};

const QueuePlaybackIcons = ({ tableRef }: { tableRef: RefObject<ItemListHandle | null> }) => {
    const { t } = useTranslation();
    const player = usePlayer();

    const handleClearQueue = () => {
        player.clearQueue();
    };

    const handleJumpToCurrent = () => {
        const index = usePlayerStoreBase.getState().player.index;
        if (index !== -1) {
            tableRef.current?.scrollToIndex(index);
        }
    };

    const handleShuffleQueue = () => {
        player.shuffleAll();
    };

    return (
        <>
            <ActionIcon
                icon="mediaShuffle"
                iconProps={{ size: 'lg' }}
                onClick={handleShuffleQueue}
                tooltip={{ label: t('player.shuffle') }}
                variant="subtle"
            />
            <ActionIcon
                icon="x"
                iconProps={{ size: 'lg' }}
                onClick={handleClearQueue}
                tooltip={{ label: t('action.clearQueue') }}
                variant="subtle"
            />
            <ActionIcon
                icon="goToItem"
                iconProps={{ size: 'lg' }}
                onClick={handleJumpToCurrent}
                tooltip={{ label: t('action.goToCurrent') }}
                variant="subtle"
            />
        </>
    );
};

const QueueRestoreActions = () => {
    const server = useCurrentServer();
    const supportsQueue = hasFeature(server, ServerFeature.SERVER_PLAY_QUEUE);

    const isFetching = useIsFetching({ queryKey: queryKeys.player.fetch({ type: 'queue' }) });

    const { isPending: isSavingQueue, mutate: saveQueue } = useSaveQueue();

    const handleSaveQueue = useCallback(() => {
        saveQueue(undefined, {
            onSuccess: () => {
                toast.success({
                    message: t('form.saveQueue.success'),
                });
            },
        });
    }, [saveQueue]);

    const handleRestoreQueue = useRestoreQueue();

    if (!supportsQueue) {
        return null;
    }

    return (
        <span className={styles.restoreSection}>
            <ActionIcon
                disabled={Boolean(isFetching)}
                icon="upload"
                iconProps={{ size: 'lg' }}
                loading={isSavingQueue}
                onClick={() => handleSaveQueue()}
                tooltip={{
                    label: t('player.saveQueueToServer'),
                }}
                variant="subtle"
            />
            <ActionIcon
                disabled={isSavingQueue || Boolean(isFetching)}
                icon="download"
                iconProps={{ size: 'lg' }}
                loading={Boolean(isFetching)}
                onClick={handleRestoreQueue}
                tooltip={{
                    label: t('player.restoreQueueFromServer'),
                }}
                variant="subtle"
            />
        </span>
    );
};
