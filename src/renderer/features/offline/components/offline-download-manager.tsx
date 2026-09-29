import { useQueryClient } from '@tanstack/react-query';
import isElectron from 'is-electron';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { api } from '/@/renderer/api';
import {
    refreshOfflineDownloads,
    refreshOfflineTasks,
    useOfflineDownloadStore,
} from '/@/renderer/features/offline/offline-download.store';
import {
    getAlbumSongsById,
    getPlaylistSongsById,
    getSongById,
} from '/@/renderer/features/player/utils';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Button } from '/@/shared/components/button/button';
import { Group } from '/@/shared/components/group/group';
import { Popover } from '/@/shared/components/popover/popover';
import { Progress } from '/@/shared/components/progress/progress';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';
import { toast } from '/@/shared/components/toast/toast';
import { OfflineDownloadTask } from '/@/shared/types/offline';

const getProgress = (task: OfflineDownloadTask) => {
    const value =
        task.bytesTotal > 0
            ? task.bytesDownloaded / task.bytesTotal
            : task.total > 0
              ? task.completed / task.total
              : 1;
    return Math.round(Math.min(1, Math.max(0, value)) * 100);
};

const getTrackRequests = async (
    task: OfflineDownloadTask,
    queryClient: ReturnType<typeof useQueryClient>,
) => {
    const retryIds =
        task.failedSongIds.length > 0
            ? task.failedSongIds
            : task.songIds.filter((songId) => !task.completedSongIds.includes(songId));
    const responses = await Promise.all(
        retryIds.map((id) => getSongById({ id, queryClient, serverId: task.serverId })),
    );
    return responses
        .flatMap((response) => response.items)
        .map((song) => ({
            song,
            url: api.controller.getDownloadUrl({
                apiClientProps: { serverId: task.serverId },
                query: { id: song.id },
            }),
        }));
};

export const OfflineDownloadManager = () => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const [busyTaskId, setBusyTaskId] = useState<null | string>(null);
    const tasks = useOfflineDownloadStore((state) =>
        Object.values(state.tasks)
            .filter((task) => !task.silent)
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    );
    const hasActiveTask = tasks.some(
        (task) => task.state === 'downloading' || task.state === 'queued',
    );
    const hasTerminalTask = tasks.some(
        (task) => task.state !== 'downloading' && task.state !== 'queued',
    );

    if (!isElectron()) return null;

    const retry = async (task: OfflineDownloadTask) => {
        setBusyTaskId(task.id);
        try {
            if (task.itemType === 'album' && task.itemIds[0]) {
                const response = await getAlbumSongsById({
                    id: [task.itemIds[0]],
                    queryClient,
                    serverId: task.serverId,
                });
                await window.api.offline.syncAlbum({
                    album: {
                        id: task.itemIds[0],
                        name: task.name,
                        serverId: task.serverId,
                    },
                    tracks: response.items.map((song) => ({
                        song,
                        url: api.controller.getDownloadUrl({
                            apiClientProps: { serverId: task.serverId },
                            query: { id: song.id },
                        }),
                    })),
                });
            } else if (task.itemType === 'playlist' && task.itemIds[0]) {
                const response = await getPlaylistSongsById({
                    id: task.itemIds[0],
                    queryClient,
                    serverId: task.serverId,
                });
                await window.api.offline.syncPlaylist({
                    playlist: {
                        id: task.itemIds[0],
                        name: task.name,
                        serverId: task.serverId,
                    },
                    tracks: (response?.items ?? []).map((song) => ({
                        song,
                        url: api.controller.getDownloadUrl({
                            apiClientProps: { serverId: task.serverId },
                            query: { id: song.id },
                        }),
                    })),
                });
            } else {
                await window.api.offline.retryDownload({
                    taskId: task.id,
                    tracks: await getTrackRequests(task, queryClient),
                });
            }
            await refreshOfflineDownloads();
        } catch (error) {
            toast.error({
                message: error instanceof Error ? error.message : String(error),
                title: t('offline.downloadFailedTitle', 'Download failed'),
            });
        } finally {
            setBusyTaskId(null);
        }
    };

    return (
        <Popover position="top-end" withArrow>
            <Popover.Target>
                <ActionIcon
                    icon="download"
                    iconProps={{ color: hasActiveTask ? 'primary' : undefined, size: 'lg' }}
                    onClick={(event) => event.stopPropagation()}
                    size="sm"
                    tooltip={{
                        label: t('offline.downloads', 'Downloads'),
                        openDelay: 0,
                    }}
                    variant="subtle"
                />
            </Popover.Target>
            <Popover.Dropdown miw={360} onClick={(event) => event.stopPropagation()} p="sm">
                <Stack gap="sm" mah={420} style={{ overflowY: 'auto' }}>
                    <Group justify="space-between">
                        <Text size="sm" weight={600}>
                            {t('offline.downloads', 'Downloads')}
                        </Text>
                        {hasTerminalTask && (
                            <Button
                                onClick={async () => {
                                    await window.api.offline.clearDownloadHistory();
                                    await refreshOfflineTasks();
                                }}
                                size="compact-xs"
                                variant="subtle"
                            >
                                {t('offline.clearHistory', 'Clear history')}
                            </Button>
                        )}
                    </Group>
                    {tasks.length === 0 && (
                        <Text isMuted size="sm">
                            {t('offline.noDownloads', 'No downloads yet')}
                        </Text>
                    )}
                    {tasks.map((task) => {
                        const progress = getProgress(task);
                        const active = task.state === 'downloading' || task.state === 'queued';
                        return (
                            <Stack gap={4} key={task.id}>
                                <Group justify="space-between" wrap="nowrap">
                                    <Text size="sm" truncate>
                                        {task.name}
                                    </Text>
                                    {active ? (
                                        <Button
                                            onClick={() =>
                                                void window.api.offline.cancelDownload(task.id)
                                            }
                                            size="compact-xs"
                                            variant="subtle"
                                        >
                                            {t('offline.cancel', 'Cancel')}
                                        </Button>
                                    ) : task.state === 'cancelled' || task.state === 'error' ? (
                                        <Button
                                            loading={busyTaskId === task.id}
                                            onClick={() => void retry(task)}
                                            size="compact-xs"
                                            variant="subtle"
                                        >
                                            {t('offline.retry', 'Retry')}
                                        </Button>
                                    ) : null}
                                </Group>
                                <Progress aria-label={`${progress}%`} size="sm" value={progress} />
                                <Group justify="space-between">
                                    <Text isMuted size="xs">
                                        {task.completed} / {task.total}
                                    </Text>
                                    <Text isMuted size="xs">
                                        {t(`offline.state.${task.state}`, task.state)}
                                    </Text>
                                </Group>
                                {task.error && task.state === 'error' && (
                                    <Text c="red" size="xs">
                                        {task.error}
                                    </Text>
                                )}
                            </Stack>
                        );
                    })}
                </Stack>
            </Popover.Dropdown>
        </Popover>
    );
};
