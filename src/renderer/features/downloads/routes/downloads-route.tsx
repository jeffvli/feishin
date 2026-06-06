import { closeAllModals, openModal } from '@mantine/modals';
import isElectron from 'is-electron';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import styles from './downloads-route.module.css';

import { useDownloadedSongList, useDownloadsActions, useDownloadsStore } from '/@/renderer/store';
import { Button } from '/@/shared/components/button/button';
import { Checkbox } from '/@/shared/components/checkbox/checkbox';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { ConfirmModal } from '/@/shared/components/modal/modal';
import { Select } from '/@/shared/components/select/select';
import { Stack } from '/@/shared/components/stack/stack';
import { TextInput } from '/@/shared/components/text-input/text-input';
import { TextTitle } from '/@/shared/components/text-title/text-title';
import { toast } from '/@/shared/components/toast/toast';
import { DownloadedSong, downloadKey } from '/@/shared/types/downloads';

const downloads = isElectron() ? window.api.downloads : null;

const formatBytes = (n: number) => {
    if (!n) return '0 B';
    if (n > 1024 * 1024 * 1024) return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
    if (n > 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
    if (n > 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${n} B`;
};

const formatDate = (epochMs: number) => new Date(epochMs).toLocaleString();

type GroupKey = 'album' | 'artist' | 'none';
type SortKey = 'date' | 'size' | 'title';

const groupSongs = (songs: DownloadedSong[], by: GroupKey): Array<[string, DownloadedSong[]]> => {
    if (by === 'none') return [['All', songs]];
    const map = new Map<string, DownloadedSong[]>();
    for (const song of songs) {
        const key =
            by === 'album'
                ? song.sourceAlbum || song.sourceArtist || 'Unknown'
                : song.sourceArtist || 'Unknown';
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(song);
    }
    return Array.from(map.entries());
};

const TOP_N_FOR_BREAKDOWN = 5;

export const DownloadsRoute = () => {
    const { t } = useTranslation();
    const songs = useDownloadedSongList();
    const folder = useDownloadsStore((s) => s.folder);
    const { applyManifestSnapshot } = useDownloadsActions();

    const [search, setSearch] = useState('');
    const [sortKey, setSortKey] = useState<SortKey>('date');
    const [groupBy, setGroupBy] = useState<GroupKey>('album');
    const [selected, setSelected] = useState<Set<string>>(new Set());

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        let list = songs;
        if (q) {
            list = songs.filter((s) => {
                const hay = `${s.sourceTitle} ${s.sourceArtist ?? ''} ${
                    s.sourceAlbum ?? ''
                }`.toLowerCase();
                return hay.includes(q);
            });
        }
        return [...list].sort((a, b) => {
            if (sortKey === 'date') return b.downloadedAt - a.downloadedAt;
            if (sortKey === 'size') return b.bytes - a.bytes;
            return a.sourceTitle.localeCompare(b.sourceTitle);
        });
    }, [songs, search, sortKey]);

    const totalBytes = useMemo(() => songs.reduce((acc, s) => acc + s.bytes, 0), [songs]);

    const breakdown = useMemo(() => {
        const map = new Map<string, number>();
        for (const s of songs) {
            const key = s.sourceAlbum || s.sourceArtist || 'Unknown';
            map.set(key, (map.get(key) ?? 0) + s.bytes);
        }
        return Array.from(map.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, TOP_N_FOR_BREAKDOWN);
    }, [songs]);

    const grouped = useMemo(() => groupSongs(filtered, groupBy), [filtered, groupBy]);

    const toggle = (s: DownloadedSong) => {
        const key = downloadKey(s.serverId, s.songId);
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    const toggleGroup = (items: DownloadedSong[]) => {
        const keys = items.map((s) => downloadKey(s.serverId, s.songId));
        setSelected((prev) => {
            const next = new Set(prev);
            const allSelected = keys.every((k) => next.has(k));
            if (allSelected) keys.forEach((k) => next.delete(k));
            else keys.forEach((k) => next.add(k));
            return next;
        });
    };

    const clearSelection = () => setSelected(new Set());

    const selectedBytes = useMemo(() => {
        if (selected.size === 0) return 0;
        let acc = 0;
        for (const s of songs) {
            if (selected.has(downloadKey(s.serverId, s.songId))) acc += s.bytes;
        }
        return acc;
    }, [selected, songs]);

    const deleteSongs = useCallback(
        async (items: { serverId: string; songId: string }[]) => {
            if (!downloads || items.length === 0) return;
            const m = await downloads.delete(items);
            applyManifestSnapshot(m.songs);
            toast.info({
                message: t('common.songsRemoved', { count: items.length }),
            });
        },
        [applyManifestSnapshot, t],
    );

    const confirmDelete = useCallback(
        (label: string, items: { serverId: string; songId: string }[], description: string) => {
            openModal({
                children: (
                    <ConfirmModal
                        onConfirm={() => {
                            deleteSongs(items);
                            closeAllModals();
                        }}
                    >
                        {description}
                    </ConfirmModal>
                ),
                title: label,
            });
        },
        [deleteSongs],
    );

    const deleteSelected = () => {
        if (selected.size === 0) return;
        const items = Array.from(selected).map((key) => {
            const [serverId, songId] = key.split(':');
            return { serverId, songId };
        });
        confirmDelete(
            t('common.deleteSelected'),
            items,
            t('common.deleteSelectedConfirm', { count: items.length }),
        );
        clearSelection();
    };

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <TextTitle order={2}>
                    {t('common.downloads', { defaultValue: 'Downloads' })}
                </TextTitle>
                <div className={styles['header-meta']}>
                    {t('common.songsCount', { count: songs.length })} · {formatBytes(totalBytes)}
                    {folder && (
                        <>
                            {' · '}
                            <span className={styles.folder}>{folder}</span>
                        </>
                    )}
                </div>
            </div>

            {songs.length > 0 && breakdown.length > 0 && (
                <div className={styles.breakdown}>
                    <div className={styles['breakdown-title']}>{t('common.topAlbumsBySize')}</div>
                    <div className={styles['breakdown-bar']}>
                        {breakdown.map(([label, bytes]) => {
                            const pct = totalBytes > 0 ? (bytes / totalBytes) * 100 : 0;
                            return (
                                <div
                                    className={styles['breakdown-seg']}
                                    key={label}
                                    style={{ width: `${pct.toFixed(2)}%` }}
                                    title={`${label} · ${formatBytes(bytes)} · ${pct.toFixed(1)}%`}
                                />
                            );
                        })}
                    </div>
                    <div className={styles['breakdown-legend']}>
                        {breakdown.map(([label, bytes]) => (
                            <span className={styles['breakdown-item']} key={label}>
                                <span className={styles['breakdown-dot']} />
                                {label} · {formatBytes(bytes)}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            <Group className={styles.toolbar} gap="sm" wrap="wrap">
                <TextInput
                    className={styles.search}
                    leftSection={<Icon icon="search" />}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t('common.search', { defaultValue: 'Search' })}
                    value={search}
                />
                <Select
                    aria-label={t('common.sort')}
                    data={[
                        { label: t('common.sortNewest'), value: 'date' },
                        { label: t('common.sortLargest'), value: 'size' },
                        { label: t('common.sortTitle'), value: 'title' },
                    ]}
                    onChange={(v) => v && setSortKey(v as SortKey)}
                    value={sortKey}
                />
                <Select
                    aria-label={t('common.grouping')}
                    data={[
                        { label: t('common.groupByAlbum'), value: 'album' },
                        { label: t('common.groupByArtist'), value: 'artist' },
                        { label: t('common.noGrouping'), value: 'none' },
                    ]}
                    onChange={(v) => v && setGroupBy(v as GroupKey)}
                    value={groupBy}
                />
            </Group>

            {selected.size > 0 && (
                <div className={styles['selection-bar']}>
                    <div>
                        <strong>{t('common.countSelected', { count: selected.size })}</strong> ·{' '}
                        {formatBytes(selectedBytes)}
                    </div>
                    <Group gap="sm">
                        <Button onClick={clearSelection} size="compact-md" variant="default">
                            {t('common.clear')}
                        </Button>
                        <Button
                            leftSection={<Icon icon="delete" />}
                            onClick={deleteSelected}
                            size="compact-md"
                            variant="filled"
                        >
                            {t('common.deleteSelected')}
                        </Button>
                    </Group>
                </div>
            )}

            {filtered.length === 0 ? (
                <div className={styles.empty}>
                    <Icon icon="download" size="3xl" />
                    <div className={styles['empty-title']}>
                        {songs.length === 0
                            ? t('common.noDownloads')
                            : t('common.noDownloadsMatch')}
                    </div>
                    {songs.length === 0 && (
                        <div className={styles['empty-sub']}>{t('common.noDownloadsHint')}</div>
                    )}
                </div>
            ) : (
                <Stack gap="lg">
                    {grouped.map(([group, items]) => {
                        const groupBytes = items.reduce((acc, s) => acc + s.bytes, 0);
                        const groupKeys = items.map((s) => downloadKey(s.serverId, s.songId));
                        const allSelected = groupKeys.every((k) => selected.has(k));
                        const someSelected = !allSelected && groupKeys.some((k) => selected.has(k));
                        return (
                            <div className={styles.group} key={group}>
                                <div className={styles['group-header']}>
                                    <div className={styles['group-title-wrap']}>
                                        {groupBy !== 'none' && (
                                            <Checkbox
                                                aria-label={`Select ${group}`}
                                                checked={allSelected}
                                                indeterminate={someSelected}
                                                onChange={() => toggleGroup(items)}
                                            />
                                        )}
                                        <div className={styles['group-title']}>
                                            {group}
                                            <span className={styles['group-meta']}>
                                                {items.length} · {formatBytes(groupBytes)}
                                            </span>
                                        </div>
                                    </div>
                                    {groupBy !== 'none' && (
                                        <Button
                                            leftSection={<Icon icon="delete" />}
                                            onClick={() =>
                                                confirmDelete(
                                                    t('common.deleteAlbum', { name: group }),
                                                    items.map((s) => ({
                                                        serverId: s.serverId,
                                                        songId: s.songId,
                                                    })),
                                                    t('common.deleteGroupConfirm', {
                                                        count: items.length,
                                                        name: group,
                                                    }),
                                                )
                                            }
                                            size="compact-xs"
                                            variant="subtle"
                                        >
                                            {t('common.deleteGroup')}
                                        </Button>
                                    )}
                                </div>
                                <div className={styles.list}>
                                    {items.map((s) => {
                                        const key = downloadKey(s.serverId, s.songId);
                                        const isSelected = selected.has(key);
                                        return (
                                            <div
                                                className={`${styles.row} ${
                                                    isSelected ? styles['row-selected'] : ''
                                                }`}
                                                key={key}
                                            >
                                                <Checkbox
                                                    aria-label={`Select ${s.sourceTitle}`}
                                                    checked={isSelected}
                                                    onChange={() => toggle(s)}
                                                />
                                                <div className={styles['row-text']}>
                                                    <div className={styles.title}>
                                                        {s.sourceTitle}
                                                    </div>
                                                    <div className={styles.subtitle}>
                                                        {s.sourceArtist && `${s.sourceArtist} · `}
                                                        {formatBytes(s.bytes)} ·{' '}
                                                        {formatDate(s.downloadedAt)}
                                                    </div>
                                                </div>
                                                <button
                                                    aria-label={t('common.removeDownload')}
                                                    className={styles['row-delete']}
                                                    onClick={() =>
                                                        confirmDelete(
                                                            t('common.deleteSong'),
                                                            [
                                                                {
                                                                    serverId: s.serverId,
                                                                    songId: s.songId,
                                                                },
                                                            ],
                                                            t('common.deleteSongConfirm', {
                                                                title: s.sourceTitle,
                                                            }),
                                                        )
                                                    }
                                                    title={t('common.removeDownload')}
                                                    type="button"
                                                >
                                                    <Icon icon="delete" size="sm" />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </Stack>
            )}
        </div>
    );
};

export default DownloadsRoute;
