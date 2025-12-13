import { RefObject, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { api } from '/@/renderer/api';
import { SONG_TABLE_COLUMNS } from '/@/renderer/components/item-list/item-table-list/default-columns';
import { ItemListHandle } from '/@/renderer/components/item-list/types';
import { usePlayer } from '/@/renderer/features/player/context/player-context';
import { updateSong } from '/@/renderer/features/player/update-remote-song';
import { ListConfigMenu } from '/@/renderer/features/shared/components/list-config-menu';
import { SearchInput } from '/@/renderer/features/shared/components/search-input';
import {
    useCurrentServer,
    usePlayerSong,
    usePlayerStore,
    usePlayerStoreBase,
    useTimestampStoreBase,
} from '/@/renderer/store';
import { hasFeature } from '/@/shared/api/utils';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Group } from '/@/shared/components/group/group';
import { toast } from '/@/shared/components/toast/toast';
import { QueueSong } from '/@/shared/types/domain-types';
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
    const { t } = useTranslation();
    const player = usePlayer();
    const server = useCurrentServer();

    const supportsQueue = hasFeature(server, ServerFeature.SERVER_PLAY_QUEUE);
    const serverId = server?.id;

    const handleClearQueue = () => {
        player.clearQueue();
    };

    const handleShuffleQueue = () => {
        player.shuffleAll();
    };

    const handleSaveQueue = useCallback(() => {
        if (serverId) return;

        const { player, queue } = usePlayerStore.getState();
        let uniqueIds: string[] = [];

        if (queue.shuffled.length > 0) {
            for (const shuffledIndex of queue.shuffled) {
                uniqueIds.push(queue.default[shuffledIndex]);
            }
        } else {
            uniqueIds = queue.default;
        }

        const songs: string[] = [];

        if (uniqueIds.length > 0) {
            for (const song of uniqueIds) {
                if (queue.songs[song]._serverId !== serverId) {
                    toast.error({
                        message: t('error.multipleServerSaveQueueError', {
                            postProcess: 'sentenceCase',
                        }),
                        title: t('error.genericError', { postProcess: 'sentenceCase' }),
                    });

                    return;
                }

                songs?.push(queue.songs[song].id);
            }
        }

        api.controller
            .savePlayQueue({
                apiClientProps: { serverId },
                query: {
                    currentIndex: queue.default.length > 0 ? player.index : undefined,
                    positionMs: useTimestampStoreBase.getState().timestamp * 1000,
                    songs,
                },
            })
            .then(() => {
                return toast.success({ message: '', title: 'Saved play queue' });
            })
            .catch((error) => {
                toast.error({
                    message: 'This is most likely because your queue is too large (> 1000 tracks)',
                    title: 'Failed to save play queue',
                });
                console.error(error);
            });
    }, [serverId, t]);

    const handleRestoreQueue = useCallback(async () => {
        if (!serverId) return;

        try {
            const queue = await api.controller.getPlayQueue({
                apiClientProps: { serverId },
            });

            if (queue) {
                player.setQueue(
                    queue.entry,
                    queue.currentIndex,
                    queue.positionMs !== undefined ? queue.positionMs / 1000 : undefined,
                );
            }
        } catch (error) {
            toast.error({
                message: (error as Error).message,
                title: 'Failed to get play queue',
            });
        }
    }, [player, serverId]);

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
                    icon="x"
                    iconProps={{ size: 'lg' }}
                    onClick={handleClearQueue}
                    tooltip={{ label: t('action.clearQueue', { postProcess: 'sentenceCase' }) }}
                    variant="subtle"
                />
                {supportsQueue && (
                    <>
                        <ActionIcon
                            icon="upload"
                            onClick={handleSaveQueue}
                            size="sm"
                            tooltip={{
                                label: t('player.saveQueue', { postProcess: 'titleCase' }),
                                openDelay: 0,
                            }}
                            variant="subtle"
                        />
                        <ActionIcon
                            icon="download"
                            onClick={handleRestoreQueue}
                            size="sm"
                            tooltip={{
                                label: t('player.restoreQueue', { postProcess: 'titleCase' }),
                                openDelay: 0,
                            }}
                            variant="subtle"
                        />
                    </>
                )}
            </Group>
            <Group gap="xs">
                <SearchInput
                    enableHotkey={false}
                    onChange={(e) => handleSearch(e.target.value)}
                    value={searchTerm}
                />
                <ListConfigMenu
                    displayTypes={[
                        {
                            hidden: true,
                            value: ListDisplayType.GRID,
                        },
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
            </Group>
        </Group>
    );
};
