import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { useOfflineDownloadStore } from '/@/renderer/features/offline/offline-download.store';
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

const ProgressMessage = ({ task }: { task: OfflineDownloadTask }) => {
    const progress = getProgress(task);
    return (
        <Stack gap="xs">
            <Text size="sm" truncate>
                {task.name}
            </Text>
            <Progress aria-label={`${progress}%`} size="sm" value={progress} />
            <Text isMuted size="xs">
                {task.completed} / {task.total}
            </Text>
        </Stack>
    );
};

export const OfflineDownloadNotifications = () => {
    const { t } = useTranslation();
    const tasks = useOfflineDownloadStore((state) => Object.values(state.tasks));
    const shown = useRef(new Set<string>());
    const terminal = useRef(new Set<string>());

    useEffect(() => {
        for (const task of tasks) {
            if (task.silent || terminal.current.has(task.id)) continue;
            const id = `offline-download-${task.id}`;
            const active = task.state === 'queued' || task.state === 'downloading';

            if (active) {
                const notification = {
                    autoClose: false as const,
                    id,
                    loading: true,
                    message: <ProgressMessage task={task} />,
                    title: t('offline.downloadProgress', 'Downloading for offline playback'),
                    withCloseButton: false,
                };
                if (shown.current.has(task.id)) toast.update(notification);
                else {
                    toast.info(notification);
                    shown.current.add(task.id);
                }
                continue;
            }

            if (task.state === 'complete') {
                if (shown.current.has(task.id)) {
                    toast.update({
                        autoClose: 3000,
                        id,
                        loading: false,
                        message: t('offline.downloadComplete', {
                            count: task.total,
                            defaultValue: '{{count}} items are available offline',
                        }),
                        title: t('offline.downloadCompleteTitle', 'Download complete'),
                        withCloseButton: true,
                    });
                }
                terminal.current.add(task.id);
                continue;
            }

            if (task.state === 'cancelled') {
                const cancellation = {
                    autoClose: 3000,
                    id,
                    loading: false,
                    message: t('offline.downloadCancelled', 'The download was cancelled'),
                    title: t('offline.downloadCancelledTitle', 'Download cancelled'),
                    withCloseButton: true,
                };
                if (shown.current.has(task.id)) toast.update(cancellation);
                else toast.info(cancellation);
                shown.current.add(task.id);
                terminal.current.add(task.id);
                continue;
            }

            const failure = {
                autoClose: false as const,
                id,
                loading: false,
                message: task.error || t('offline.failed', 'Download failed'),
                title: t('offline.downloadFailedTitle', 'Download failed'),
                withCloseButton: true,
            };
            if (shown.current.has(task.id)) toast.update(failure);
            else toast.error(failure);
            shown.current.add(task.id);
            terminal.current.add(task.id);
        }
    }, [t, tasks]);

    return null;
};
