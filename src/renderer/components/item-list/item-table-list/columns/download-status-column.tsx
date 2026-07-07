import { RingProgress } from '@mantine/core';

import i18n from '/@/i18n/i18n';
import {
    ItemTableListInnerColumn,
    TableColumnContainer,
} from '/@/renderer/components/item-list/item-table-list/item-table-list-column';
import { useDownloadedSong, useDownloadProgressDetail } from '/@/renderer/store';
import { Icon } from '/@/shared/components/icon/icon';

const RING_SIZE = 20;
const RING_COLOR = 'rgb(50, 204, 50)';
const RING_TRACK = 'rgba(255, 255, 255, 0.18)';

const formatBytes = (n: number) => {
    if (!n) return '';
    if (n > 1024 * 1024 * 1024) return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
    if (n > 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
    if (n > 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${n} B`;
};

const formatRelativeDate = (epochMs: number) => {
    const now = Date.now();
    const diff = now - epochMs;
    const minute = 60_000;
    const hour = minute * 60;
    const day = hour * 24;
    if (diff < minute) return 'just now';
    if (diff < hour) return `${Math.round(diff / minute)}m ago`;
    if (diff < day) return `${Math.round(diff / hour)}h ago`;
    if (diff < day * 30) return `${Math.round(diff / day)}d ago`;
    return new Date(epochMs).toLocaleDateString();
};

export const DownloadStatusColumn = (props: ItemTableListInnerColumn) => {
    const rowItem = props.getRowItem?.(props.rowIndex) ?? (props.data as any[])[props.rowIndex];

    const songServerId = rowItem?._serverId as string | undefined;
    const songId = rowItem?.id as string | undefined;
    const downloaded = useDownloadedSong(songServerId, songId);
    const progress = useDownloadProgressDetail(songServerId, songId);

    // Downloaded: green check.
    if (downloaded) {
        const title = i18n.t('common.downloadedRelative', {
            size: formatBytes(downloaded.bytes),
            when: formatRelativeDate(downloaded.downloadedAt),
        });
        return (
            <TableColumnContainer {...props}>
                <span style={{ display: 'inline-flex' }} title={title}>
                    <Icon color="success" icon="check" size="md" />
                </span>
            </TableColumnContainer>
        );
    }

    // Downloading: green ring.
    if (progress?.status === 'downloading') {
        const pct = progress.bytesTotal
            ? Math.min(100, Math.round((progress.bytesReceived / progress.bytesTotal) * 100))
            : 0;
        const bytesLabel =
            progress.bytesTotal > 0
                ? `${formatBytes(progress.bytesReceived)} / ${formatBytes(progress.bytesTotal)}`
                : formatBytes(progress.bytesReceived);
        return (
            <TableColumnContainer {...props}>
                <span
                    style={{ display: 'inline-flex' }}
                    title={i18n.t('common.downloadingProgress', {
                        pct,
                        progress: bytesLabel,
                    })}
                >
                    <RingProgress
                        rootColor={RING_TRACK}
                        sections={[{ color: RING_COLOR, value: pct }]}
                        size={RING_SIZE}
                        thickness={3}
                    />
                </span>
            </TableColumnContainer>
        );
    }

    // Queued: muted clock.
    if (progress?.status === 'queued') {
        return (
            <TableColumnContainer {...props}>
                <span style={{ display: 'inline-flex' }} title={i18n.t('common.queuedForDownload')}>
                    <Icon color="muted" icon="duration" size="md" />
                </span>
            </TableColumnContainer>
        );
    }

    // Failed: red glyph.
    if (progress?.status === 'failed') {
        return (
            <TableColumnContainer {...props}>
                <span
                    style={{ display: 'inline-flex' }}
                    title={
                        progress.error
                            ? i18n.t('common.downloadFailedReason', {
                                  reason: progress.error,
                              })
                            : i18n.t('common.downloadFailed')
                    }
                >
                    <Icon color="error" icon="download" size="md" />
                </span>
            </TableColumnContainer>
        );
    }

    // Default (not downloaded): white outline at 55% opacity.
    return (
        <TableColumnContainer {...props}>
            <span
                style={{ display: 'inline-flex', opacity: 0.55 }}
                title={i18n.t('common.notDownloaded')}
            >
                <Icon color="default" icon="download" size="md" />
            </span>
        </TableColumnContainer>
    );
};
