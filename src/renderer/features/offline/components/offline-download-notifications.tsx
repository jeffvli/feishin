import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { useOfflineDownloadStore } from '/@/renderer/features/offline/offline-download.store';
import { toast } from '/@/shared/components/toast/toast';
import { OfflineDownloadTask } from '/@/shared/types/offline';

const isActive = (task: OfflineDownloadTask) =>
    task.state === 'queued' || task.state === 'downloading';

export const OfflineDownloadNotifications = () => {
    const { t } = useTranslation();
    const tasks = useOfflineDownloadStore((state) => Object.values(state.tasks));
    const completionQueue = useRef(new Map<string, OfflineDownloadTask>());
    const completionTimer = useRef<null | ReturnType<typeof setTimeout>>(null);
    const seenActive = useRef(new Set<string>());
    const terminal = useRef(new Set<string>());

    useEffect(() => {
        const newlyActive: OfflineDownloadTask[] = [];

        for (const task of tasks) {
            if (task.silent || terminal.current.has(task.id)) continue;
            const id = `offline-download-${task.id}`;

            if (isActive(task)) {
                if (!seenActive.current.has(task.id)) {
                    seenActive.current.add(task.id);
                    newlyActive.push(task);
                }
                continue;
            }

            if (task.state === 'complete') {
                if (seenActive.current.has(task.id)) {
                    completionQueue.current.set(task.id, task);
                    completionTimer.current ??= setTimeout(() => {
                        const completedTasks = [...completionQueue.current.values()];
                        completionQueue.current.clear();
                        completionTimer.current = null;

                        if (completedTasks.length === 1) {
                            toast.success({
                                autoClose: 4000,
                                message: t('offline.downloadComplete', {
                                    count: completedTasks[0].total,
                                    defaultValue: '{{count}} items are available offline',
                                }),
                                title: t('offline.downloadCompleteTitle', 'Download complete'),
                            });
                            return;
                        }

                        toast.success({
                            autoClose: 4000,
                            message: t('offline.downloadsComplete', {
                                count: completedTasks.length,
                                defaultValue: '{{count}} downloads are available offline',
                            }),
                            title: t('offline.downloadsCompleteTitle', 'Downloads complete'),
                        });
                    }, 250);
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
                toast.info(cancellation);
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
            toast.error(failure);
            terminal.current.add(task.id);
        }

        if (newlyActive.length > 0) {
            const activeTasks = tasks.filter((task) => !task.silent && isActive(task));
            toast.hide('offline-download-started');
            toast.info({
                autoClose: 3000,
                id: 'offline-download-started',
                message: t('offline.downloadStarted', {
                    count: activeTasks.length,
                    defaultValue: '{{count}} downloads were added to Downloads',
                    name: activeTasks[0]?.name,
                }),
                title: t('offline.downloadStartedTitle', 'Download started'),
            });
        }
    }, [t, tasks]);

    useEffect(
        () => () => {
            if (completionTimer.current) clearTimeout(completionTimer.current);
        },
        [],
    );

    return null;
};
