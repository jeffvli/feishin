import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FastAverageColor } from 'fast-average-color';
import { useCallback, useEffect, useRef, useState } from 'react';
import { generatePath, useNavigate } from 'react-router';

import styles from './library-views.module.css';

import { api } from '/@/renderer/api';
import { ItemImage, useItemImageUrl } from '/@/renderer/components/item-image/item-image';
import { ContextMenuController } from '/@/renderer/features/context-menu/context-menu-controller';
import { useHermesUrl } from '/@/renderer/features/hermes-video/store/hermes-video.store';
import { Card } from '/@/renderer/features/sour/components/hub-panels';
import { useSourProfiles, useSourStore } from '/@/renderer/features/sour/store/sour.store';
import { queueGroupSongs, shuffled } from '/@/renderer/features/sour/utils/queue';
import { AppRoute } from '/@/renderer/router/routes';
import { useCurrentServer } from '/@/renderer/store';
import { Button } from '/@/shared/components/button/button';
import { Group } from '/@/shared/components/group/group';
import { SegmentedControl } from '/@/shared/components/segmented-control/segmented-control';
import { Text } from '/@/shared/components/text/text';
import { toast } from '/@/shared/components/toast/toast';
import { type Album, AlbumListSort, LibraryItem, SortOrder } from '/@/shared/types/domain-types';
import { Play } from '/@/shared/types/types';

// up to 600 albums (newest first) for the wall, shelf, timeline and folders
export const useAllAlbums = () => {
    const server = useCurrentServer();
    return useQuery({
        enabled: !!server?.id,
        queryFn: async ({ signal }) => {
            const res = await api.controller.getAlbumList({
                apiClientProps: { serverId: server?.id || '', signal },
                query: {
                    limit: 600,
                    sortBy: AlbumListSort.RECENTLY_ADDED,
                    sortOrder: SortOrder.DESC,
                    startIndex: 0,
                },
            });
            return res?.items ?? [];
        },
        queryKey: ['sour-all-albums', server?.id],
        staleTime: 5 * 60000,
    });
};

// ---------- colours: one cover at a time, remembered ----------
const colorCache = new Map<string, number[]>();
const waiting: Array<() => Promise<void>> = [];
let busy = false;
const pump = async () => {
    if (busy) return;
    busy = true;
    while (waiting.length) {
        const job = waiting.shift();
        if (job) await job().catch(() => {});
    }
    busy = false;
};
const coverColor = (src: string) =>
    new Promise<number[]>((resolve) => {
        const hit = colorCache.get(src);
        if (hit) {
            resolve(hit);
            return;
        }
        waiting.push(async () => {
            const fac = new FastAverageColor();
            try {
                const c = await fac.getColorAsync(src, { algorithm: 'simple', mode: 'speed' });
                colorCache.set(src, c.value);
                resolve(c.value);
            } catch {
                resolve([128, 128, 128, 255]);
            } finally {
                fac.destroy();
            }
        });
        pump();
    });

const hueOf = ([r, g, b]: number[]) => {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (max - min < 18) return 400 + (max / 255) * 40; // greys after the rainbow, dark to light
    let h = 0;
    if (max === r) h = ((g - b) / (max - min)) % 6;
    else if (max === g) h = (b - r) / (max - min) + 2;
    else h = (r - g) / (max - min) + 4;
    return (h * 60 + 360) % 360;
};

// right-click an album anywhere in the Sour Library: the normal album menu (play, add to the group, ...)
const albumMenu = (album: Album) => (e: React.MouseEvent) => {
    e.preventDefault();
    ContextMenuController.call({ cmd: { items: [album], type: LibraryItem.ALBUM }, event: e });
};

const useAlbumColor = (album: Album) => {
    const src = useItemImageUrl({
        id: album.imageId || undefined,
        itemType: LibraryItem.ALBUM,
        type: 'table',
    });
    const [color, setColor] = useState<null | number[]>(src ? (colorCache.get(src) ?? null) : null);
    useEffect(() => {
        let alive = true;
        if (src) coverColor(src).then((c) => alive && setColor(c));
        return () => {
            alive = false;
        };
    }, [src]);
    return color;
};

const AlbumTile = ({
    album,
    onColor,
}: {
    album: Album;
    onColor: (id: string, hue: number) => void;
}) => {
    const navigate = useNavigate();
    const server = useCurrentServer();
    const color = useAlbumColor(album);
    useEffect(() => {
        if (color) onColor(album.id, hueOf(color));
    }, [album.id, color, onColor]);
    return (
        <button
            className={styles.tile}
            onClick={() =>
                navigate(generatePath(AppRoute.LIBRARY_ALBUMS_DETAIL, { albumId: album.id }))
            }
            onContextMenu={albumMenu(album)}
            title={`${album.name} - ${album.albumArtistName}`}
            type="button"
        >
            {album.imageId && server?.id ? (
                <ItemImage
                    className={styles.img}
                    containerClassName={styles.img}
                    id={album.imageId}
                    itemType={LibraryItem.ALBUM}
                    serverId={server.id}
                    type="table"
                />
            ) : (
                <span className={styles.blank} />
            )}
        </button>
    );
};

const Spine = ({
    album,
    onColor,
}: {
    album: Album;
    onColor: (id: string, hue: number) => void;
}) => {
    const navigate = useNavigate();
    const server = useCurrentServer();
    const color = useAlbumColor(album);
    useEffect(() => {
        if (color) onColor(album.id, hueOf(color));
    }, [album.id, color, onColor]);
    const rgb = color
        ? `rgb(${color[0]}, ${color[1]}, ${color[2]})`
        : 'var(--theme-colors-surface)';
    const dark = color ? color[0] * 0.3 + color[1] * 0.59 + color[2] * 0.11 < 140 : true;
    return (
        <button
            className={styles.spine}
            onClick={() =>
                navigate(generatePath(AppRoute.LIBRARY_ALBUMS_DETAIL, { albumId: album.id }))
            }
            onContextMenu={albumMenu(album)}
            style={{ background: rgb, color: dark ? '#fff' : '#151515' }}
            title={`${album.name} - ${album.albumArtistName}`}
            type="button"
        >
            <span className={styles.spineText}>{album.name}</span>
            {album.imageId && server?.id && (
                <span className={styles.pull}>
                    <ItemImage
                        className={styles.img}
                        containerClassName={styles.img}
                        id={album.imageId}
                        itemType={LibraryItem.ALBUM}
                        serverId={server.id}
                        type="table"
                    />
                </span>
            )}
        </button>
    );
};

export const CoverWall = () => {
    const albums = useAllAlbums();
    const [mode, setMode] = useState('wall');
    const [sortBy, setSortBy] = useState('color');
    const [hues, setHues] = useState<Record<string, number>>({});
    const [order, setOrder] = useState<string[]>([]);
    const pending = useRef<Record<string, number>>({});
    const timer = useRef<null | ReturnType<typeof setTimeout>>(null);
    // colours arrive one cover at a time: gather them and update a few times a second
    const onColor = useCallback((id: string, hue: number) => {
        pending.current[id] = hue;
        if (timer.current) return;
        timer.current = setTimeout(() => {
            timer.current = null;
            const batch = pending.current;
            pending.current = {};
            setHues((h) => ({ ...h, ...batch }));
        }, 400);
    }, []);
    const list = albums.data ?? [];
    // re-sort by colour every couple of seconds while colours are still coming in
    useEffect(() => {
        const sort = () =>
            setOrder(
                [...list]
                    .sort((a, b) =>
                        sortBy === 'color'
                            ? (hues[a.id] ?? 999) - (hues[b.id] ?? 999)
                            : sortBy === 'year'
                              ? (a.releaseYear ?? 0) - (b.releaseYear ?? 0)
                              : a.name.localeCompare(b.name),
                    )
                    .map((a) => a.id),
            );
        sort();
        const timer = setInterval(sort, 2500);
        return () => clearInterval(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [list.length, sortBy, Object.keys(hues).length]);
    const byId = new Map(list.map((a) => [a.id, a]));
    const sorted = (order.length ? order : list.map((a) => a.id))
        .map((id) => byId.get(id))
        .filter((a): a is Album => !!a);
    return (
        <div className={styles.wrap}>
            <Group justify="space-between">
                <SegmentedControl
                    data={[
                        { label: 'Cover wall', value: 'wall' },
                        { label: 'Record shelf', value: 'shelf' },
                    ]}
                    onChange={setMode}
                    size="xs"
                    value={mode}
                />
                <SegmentedControl
                    data={[
                        { label: 'Rainbow', value: 'color' },
                        { label: 'Year', value: 'year' },
                        { label: 'A-Z', value: 'name' },
                    ]}
                    onChange={setSortBy}
                    size="xs"
                    value={sortBy}
                />
            </Group>
            {albums.isLoading && <Text isMuted>Loading your albums...</Text>}
            {mode === 'wall' ? (
                <div className={styles.wall}>
                    {sorted.map((a) => (
                        <AlbumTile album={a} key={a.id} onColor={onColor} />
                    ))}
                </div>
            ) : (
                <div className={styles.shelf}>
                    {sorted.map((a) => (
                        <Spine album={a} key={a.id} onColor={onColor} />
                    ))}
                </div>
            )}
        </div>
    );
};

// ---------- timeline: albums by year, bar height = your plays ----------
export const Timeline = () => {
    const albums = useAllAlbums().data ?? [];
    const navigate = useNavigate();
    const server = useCurrentServer();
    const years = new Map<number, Album[]>();
    for (const a of albums) {
        const y = a.releaseYear || 0;
        years.set(y, [...(years.get(y) ?? []), a]);
    }
    const maxPlays = Math.max(1, ...albums.map((a) => a.playCount ?? 0));
    return (
        <div className={styles.timeline}>
            {[...years.entries()]
                .sort((a, b) => b[0] - a[0])
                .map(([year, list]) => (
                    <div className={styles.year} key={year}>
                        <div className={styles.yearLabel}>{year || 'Unknown year'}</div>
                        <div className={styles.yearRow}>
                            {list.map((a) => (
                                <button
                                    className={styles.timeAlbum}
                                    key={a.id}
                                    onClick={() =>
                                        navigate(
                                            generatePath(AppRoute.LIBRARY_ALBUMS_DETAIL, {
                                                albumId: a.id,
                                            }),
                                        )
                                    }
                                    onContextMenu={albumMenu(a)}
                                    title={`${a.name} - ${a.albumArtistName}: ${a.playCount ?? 0} plays`}
                                    type="button"
                                >
                                    {a.imageId && server?.id ? (
                                        <ItemImage
                                            className={styles.img}
                                            containerClassName={styles.img}
                                            id={a.imageId}
                                            itemType={LibraryItem.ALBUM}
                                            serverId={server.id}
                                            type="table"
                                        />
                                    ) : (
                                        <span className={styles.blank} />
                                    )}
                                    <span className={styles.plays}>
                                        <span
                                            style={{
                                                height: `${((a.playCount ?? 0) / maxPlays) * 100}%`,
                                            }}
                                        />
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
        </div>
    );
};

// ---------- smart folders ----------
const DAY = 86400000;
const FolderRow = ({ albums, empty, title }: { albums: Album[]; empty: string; title: string }) => {
    const navigate = useNavigate();
    const server = useCurrentServer();
    return (
        <Card title={`${title} (${albums.length})`}>
            {albums.length ? (
                <div className={styles.folder}>
                    {albums.slice(0, 40).map((a) => (
                        <button
                            className={styles.tile}
                            key={a.id}
                            onClick={() =>
                                navigate(
                                    generatePath(AppRoute.LIBRARY_ALBUMS_DETAIL, { albumId: a.id }),
                                )
                            }
                            onContextMenu={albumMenu(a)}
                            title={`${a.name} - ${a.albumArtistName}`}
                            type="button"
                        >
                            {a.imageId && server?.id ? (
                                <ItemImage
                                    className={styles.img}
                                    containerClassName={styles.img}
                                    id={a.imageId}
                                    itemType={LibraryItem.ALBUM}
                                    serverId={server.id}
                                    type="table"
                                />
                            ) : (
                                <span className={styles.blank} />
                            )}
                        </button>
                    ))}
                </div>
            ) : (
                <Text isMuted size="sm">
                    {empty}
                </Text>
            )}
        </Card>
    );
};

export const SmartFolders = () => {
    const albums = useAllAlbums().data ?? [];
    const url = useHermesUrl();
    const me = useSourStore((s) => s.me);
    const profiles = useSourProfiles().data ?? [];
    const qc = useQueryClient();
    const serverId = useCurrentServer()?.id;
    const [now] = useState(() => Date.now());
    const recent = albums.filter(
        (a) => a.lastPlayedAt && now - Date.parse(a.lastPlayedAt) < 7 * DAY,
    );
    const fresh = albums.filter((a) => a.createdAt && now - Date.parse(a.createdAt) < 7 * DAY);
    const never = albums.filter((a) => !a.playCount);
    const friendFaves = profiles
        .filter((p) => p.id !== me?.id)
        .flatMap((p) => (p.favorites ?? []).filter((f) => !/^(album|artist):/.test(f.id)));
    const friendTop = profiles
        .filter((p) => p.id !== me?.id)
        .flatMap((p) => p.stats?.topSongs.slice(0, 5) ?? []);
    const play = (songs: typeof friendFaves, reason: string) => {
        if (!serverId || !songs.length) return;
        queueGroupSongs(
            shuffled(songs).slice(0, 50),
            Play.NOW,
            { queryClient: qc, serverId },
            reason,
        )
            .then((n) =>
                toast.success({
                    message: n ? `Playing ${n} songs` : "Those songs aren't on your music server",
                }),
            )
            .catch((error: Error) => toast.error({ message: error.message }));
    };
    return (
        <div className={styles.folders}>
            <Card icon={'\u{1F49B}'} title="From your friends">
                <Text isMuted size="sm">
                    {friendFaves.length} favourite songs and {friendTop.length} top songs from the
                    group.
                </Text>
                <Group gap="xs">
                    <Button
                        disabled={!friendFaves.length || !url}
                        onClick={() => play(friendFaves, "From friends' favourites")}
                        size="xs"
                        variant="default"
                    >
                        Play friends&apos; favourites
                    </Button>
                    <Button
                        disabled={!friendTop.length || !url}
                        onClick={() => play(friendTop, "From friends' top songs")}
                        size="xs"
                        variant="default"
                    >
                        Play what friends play most
                    </Button>
                </Group>
            </Card>
            <FolderRow
                albums={fresh}
                empty="Nothing new this week - ask Hermes Music for something!"
                title="New this week"
            />
            <FolderRow
                albums={recent}
                empty="Nothing played this week yet."
                title="Played this week"
            />
            <FolderRow
                albums={never}
                empty="You've played everything at least once."
                title="Never played"
            />
        </div>
    );
};
