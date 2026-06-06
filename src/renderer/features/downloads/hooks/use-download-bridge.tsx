import isElectron from 'is-electron';
import { useEffect, useRef } from 'react';

import i18n from '/@/i18n/i18n';
import { useDownloadsActions } from '/@/renderer/store';
import { toast } from '/@/shared/components/toast/toast';

const SESSION_DRAIN_MS = 2000;
const QUEUED_BURST_MS = 600;
const SUMMARY_TOAST_ID = 'downloads-summary';

export const useDownloadBridge = () => {
    const { applyManifestSnapshot, applyProgress, setFolder } = useDownloadsActions();

    // Session state. A "session" starts on the first queued event after the
    // panel was empty and ends once nothing is active / queued / failed for
    // SESSION_DRAIN_MS. We coalesce all per-song toasts into a single
    // start-of-session toast and a single end-of-session summary so a
    // playlist with 30 songs doesn't produce 30+ notifications.
    const sessionActive = useRef(false);
    const sessionEnqueued = useRef(0);
    const sessionCompleted = useRef(0);
    const sessionFailed = useRef(0);
    const lastFailedTitle = useRef<null | string>(null);
    const inFlightKeys = useRef(new Set<string>());

    // Burst-debounce the "Download started" notice so adding ten songs to the
    // queue in quick succession only triggers one toast.
    const queuedBurst = useRef(0);
    const queuedTimer = useRef<null | ReturnType<typeof setTimeout>>(null);
    const drainTimer = useRef<null | ReturnType<typeof setTimeout>>(null);

    useEffect(() => {
        if (!isElectron()) return undefined;
        const api = window.api.downloads;
        let cancelled = false;

        const hydrate = async () => {
            const manifest = await api.list();
            if (cancelled) return;
            setFolder(manifest.folder);
            applyManifestSnapshot(manifest.songs);
            const reconciled = await api.reconcile();
            if (cancelled) return;
            applyManifestSnapshot(reconciled.songs);
        };
        void hydrate();

        const flushQueuedBurst = () => {
            if (queuedBurst.current > 0) {
                toast.info({
                    message:
                        queuedBurst.current === 1
                            ? i18n.t('common.downloadStarted')
                            : i18n.t('common.downloadsQueued', {
                                  count: queuedBurst.current,
                              }),
                });
                queuedBurst.current = 0;
            }
            queuedTimer.current = null;
        };

        const resetSession = () => {
            sessionActive.current = false;
            sessionEnqueued.current = 0;
            sessionCompleted.current = 0;
            sessionFailed.current = 0;
            lastFailedTitle.current = null;
            inFlightKeys.current.clear();
        };

        const flushSummary = () => {
            drainTimer.current = null;
            if (!sessionActive.current) return;
            const done = sessionCompleted.current;
            const failed = sessionFailed.current;

            if (done + failed === 0) {
                resetSession();
                return;
            }

            if (failed === 0) {
                toast.success({
                    id: SUMMARY_TOAST_ID,
                    message: i18n.t('common.songsDownloaded', { count: done }),
                });
            } else if (done === 0) {
                const sample = lastFailedTitle.current;
                toast.error({
                    id: SUMMARY_TOAST_ID,
                    message: sample
                        ? `${i18n.t('common.downloadFailed')} — ${sample}${
                              failed > 1 ? ` (+${failed - 1})` : ''
                          }`
                        : i18n.t('common.downloadFailed'),
                });
            } else {
                // Mixed result — show success with footnote.
                toast.warn({
                    id: SUMMARY_TOAST_ID,
                    message: `${i18n.t('common.songsDownloaded', {
                        count: done,
                    })} · ${failed} failed`,
                });
            }
            resetSession();
        };

        const scheduleDrain = () => {
            if (drainTimer.current) clearTimeout(drainTimer.current);
            drainTimer.current = setTimeout(flushSummary, SESSION_DRAIN_MS);
        };

        const unsub = api.onProgress(async (p) => {
            const key = `${p.serverId}:${p.songId}`;
            applyProgress(p);

            if (p.status === 'queued') {
                if (!inFlightKeys.current.has(key)) {
                    inFlightKeys.current.add(key);
                    sessionActive.current = true;
                    sessionEnqueued.current += 1;
                    queuedBurst.current += 1;
                    if (queuedTimer.current) clearTimeout(queuedTimer.current);
                    queuedTimer.current = setTimeout(flushQueuedBurst, QUEUED_BURST_MS);
                }
                return;
            }

            if (p.status === 'downloading') {
                // No toast — the panel handles in-flight progress.
                return;
            }

            if (p.status === 'completed') {
                inFlightKeys.current.delete(key);
                const m = await api.list();
                applyManifestSnapshot(m.songs);

                if (sessionActive.current) {
                    sessionCompleted.current += 1;
                    scheduleDrain();
                } else {
                    // Shouldn't normally happen (no preceding queued event)
                    // — fall back to a single toast.
                    const record = m.songs[key];
                    toast.success({
                        message: record
                            ? i18n.t('common.songDownloaded', {
                                  title: record.sourceTitle,
                              })
                            : i18n.t('common.downloadComplete'),
                    });
                }
                return;
            }

            if (p.status === 'failed') {
                const willRetry = p.error?.includes('will retry');
                if (willRetry) {
                    // Suppress — the main process is going to retry. We'll
                    // hear another 'queued' followed by 'completed' or a
                    // terminal 'failed' (no "will retry" suffix).
                    return;
                }
                inFlightKeys.current.delete(key);
                sessionFailed.current += 1;
                lastFailedTitle.current = p.title ?? lastFailedTitle.current;
                scheduleDrain();
                return;
            }

            if (p.status === 'cancelled') {
                inFlightKeys.current.delete(key);
                scheduleDrain();
                return;
            }
        });

        return () => {
            cancelled = true;
            unsub();
            if (drainTimer.current) clearTimeout(drainTimer.current);
            if (queuedTimer.current) clearTimeout(queuedTimer.current);
        };
    }, [applyManifestSnapshot, applyProgress, setFolder]);
};
