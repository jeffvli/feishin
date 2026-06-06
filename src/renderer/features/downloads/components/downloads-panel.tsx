import isElectron from 'is-electron';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import styles from './downloads-panel.module.css';

import { useDownloadsActions, useDownloadsStore } from '/@/renderer/store';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Icon } from '/@/shared/components/icon/icon';
import { Progress } from '/@/shared/components/progress/progress';
import { DownloadProgress } from '/@/shared/types/downloads';

const downloads = isElectron() ? window.api.downloads : null;

const formatBytes = (n: number) => {
    if (!n) return '0 B';
    if (n > 1024 * 1024 * 1024) return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
    if (n > 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
    if (n > 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${n} B`;
};

const formatSpeed = (bps?: number) => {
    if (!bps || bps <= 0) return '';
    return `${formatBytes(bps)}/s`;
};

const formatEta = (received: number, total: number, bps?: number) => {
    if (!bps || bps <= 0 || total <= 0 || received >= total) return '';
    const remaining = total - received;
    const seconds = Math.round(remaining / bps);
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${(seconds / 3600).toFixed(1)}h`;
};

export const DownloadsPanel = () => {
    const { t } = useTranslation();
    const [collapsed, setCollapsed] = useState(false);
    const progress = useDownloadsStore((s) => s.progress);
    const songs = useDownloadsStore((s) => s.songs);
    const { dismissProgress } = useDownloadsActions();

    const items = useMemo(() => Object.values(progress), [progress]);
    const active = items.filter((i) => i.status === 'downloading');
    const queued = items.filter((i) => i.status === 'queued');
    const failed = items.filter((i) => i.status === 'failed');

    // Session totals — track songs that have entered the queue since the last drain.
    // Without this the aggregate pct oscillates as songs complete and leave the
    // progress map.
    const seenKeys = useRef(new Set<string>());
    const sessionTotal = useRef(0);
    const sessionCompleted = useRef(0);

    useEffect(() => {
        for (const it of items) {
            const key = `${it.serverId}:${it.songId}`;
            if (!seenKeys.current.has(key)) {
                seenKeys.current.add(key);
                sessionTotal.current += 1;
            }
        }

        const inFlight = items.some((i) => i.status === 'downloading' || i.status === 'queued');
        if (!inFlight && failed.length === 0) {
            seenKeys.current.clear();
            sessionTotal.current = 0;
            sessionCompleted.current = 0;
        }
    }, [items, failed.length]);

    // Derive completed-in-session = sessionTotal - (active + queued + failed currently in map).
    sessionCompleted.current = Math.max(
        0,
        sessionTotal.current - active.length - queued.length - failed.length,
    );

    const aggregate = useMemo(() => {
        const totalSpeed = active.reduce((acc, i) => acc + (i.bytesPerSecond ?? 0), 0);
        const partial = active.reduce((acc, i) => {
            if (i.bytesTotal > 0) return acc + i.bytesReceived / i.bytesTotal;
            return acc;
        }, 0);
        const denominator = sessionTotal.current || items.length || 1;
        const pct = Math.min(
            100,
            Math.round(((sessionCompleted.current + partial) / denominator) * 100),
        );
        return { pct, totalSpeed };
    }, [active, items.length]);

    if (!downloads) return null;
    if (active.length === 0 && queued.length === 0 && failed.length === 0) return null;

    const totalCount = active.length + queued.length + failed.length;

    if (collapsed) {
        return (
            <button
                aria-label={t('common.showDownloads')}
                className={styles.fab}
                onClick={() => setCollapsed(false)}
                type="button"
            >
                <Icon icon="download" />
                <span>{totalCount}</span>
                {active.length > 0 && aggregate.pct > 0 && (
                    <span className={styles['fab-pct']}>{aggregate.pct}%</span>
                )}
            </button>
        );
    }

    const cancel = (p: DownloadProgress) => {
        if (!downloads) return;
        downloads.cancel([{ serverId: p.serverId, songId: p.songId }]);
    };

    const dismiss = (p: DownloadProgress) => {
        dismissProgress(p.serverId, p.songId);
    };

    const renderItem = (p: DownloadProgress) => {
        const key = `${p.serverId}:${p.songId}`;
        const record = songs[key];
        const title = p.title ?? record?.sourceTitle ?? p.songId;
        const subtitle = record?.sourceArtist ?? '';
        const pct = p.bytesTotal
            ? Math.min(100, Math.round((p.bytesReceived / p.bytesTotal) * 100))
            : 0;
        const speed = formatSpeed(p.bytesPerSecond);
        const eta = formatEta(p.bytesReceived, p.bytesTotal, p.bytesPerSecond);

        return (
            <div className={styles['item-block']} key={key}>
                <div className={styles.row}>
                    <div className={styles['row-text']}>
                        <div className={styles.title}>{title}</div>
                        <div className={styles.subtitle}>
                            {subtitle && `${subtitle} · `}
                            {p.status === 'queued' &&
                                t('common.queued', { defaultValue: 'Queued' })}
                            {p.status === 'downloading' && (
                                <>
                                    {pct}% · {formatBytes(p.bytesReceived)}
                                    {p.bytesTotal > 0 && ` / ${formatBytes(p.bytesTotal)}`}
                                    {speed && ` · ${speed}`}
                                    {eta && ` · ${eta} left`}
                                </>
                            )}
                            {p.status === 'failed' && (
                                <span className={styles['failed-text']}>
                                    {p.error
                                        ? t('common.downloadFailedReason', { reason: p.error })
                                        : t('common.downloadFailed')}
                                </span>
                            )}
                        </div>
                    </div>
                    <ActionIcon
                        aria-label={
                            p.status === 'failed' ? t('common.dismiss') : t('common.cancelDownload')
                        }
                        onClick={() => (p.status === 'failed' ? dismiss(p) : cancel(p))}
                        variant="subtle"
                    >
                        <Icon icon="x" />
                    </ActionIcon>
                </div>
                {p.status === 'downloading' && p.bytesTotal > 0 && (
                    <Progress size="xs" value={pct} />
                )}
            </div>
        );
    };

    return (
        <div className={styles.panel}>
            <div className={styles.header}>
                <div className={styles['header-text']}>
                    <div>
                        {t('common.downloads')} · {totalCount}
                    </div>
                    {(active.length > 0 || queued.length > 0) && (
                        <div className={styles['header-sub']}>
                            {active.length > 0 && (
                                <>
                                    {active.length} {t('common.active')}
                                    {aggregate.totalSpeed > 0 &&
                                        ` · ${formatSpeed(aggregate.totalSpeed)}`}
                                </>
                            )}
                            {active.length > 0 && queued.length > 0 && ' · '}
                            {queued.length > 0 &&
                                `${queued.length} ${t('common.queued').toLowerCase()}`}
                        </div>
                    )}
                </div>
                <ActionIcon
                    aria-label={t('common.minimizeDownloads')}
                    onClick={() => setCollapsed(true)}
                    variant="subtle"
                >
                    <Icon icon="x" />
                </ActionIcon>
            </div>
            {(active.length > 0 || queued.length > 0) && sessionTotal.current > 0 && (
                <div className={styles['aggregate-bar']}>
                    <Progress size="sm" value={aggregate.pct} />
                </div>
            )}
            <div className={styles.body}>
                {active.map(renderItem)}
                {queued.map(renderItem)}
                {failed.map(renderItem)}
            </div>
        </div>
    );
};
