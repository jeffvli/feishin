import { openModal } from '@mantine/modals';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from 'react';

import styles from './playlist-theme.module.css';

import { useHermesUrl } from '/@/renderer/features/hermes-video/store/hermes-video.store';
import { type PlaylistTheme, readPicture, sourApi } from '/@/renderer/features/sour/api/sour-api';
import { fontChoices, fontFamily } from '/@/renderer/features/sour/fonts';
import { useMyProfile, useSourStore } from '/@/renderer/features/sour/store/sour.store';
import { Button } from '/@/shared/components/button/button';
import { ColorInput } from '/@/shared/components/color-input/color-input';
import { FileButton } from '/@/shared/components/file-button/file-button';
import { Group } from '/@/shared/components/group/group';
import { Select } from '/@/shared/components/select/select';
import { Slider } from '/@/shared/components/slider/slider';
import { Stack } from '/@/shared/components/stack/stack';
import { Switch } from '/@/shared/components/switch/switch';
import { Text } from '/@/shared/components/text/text';
import { toast } from '/@/shared/components/toast/toast';

const usePlaylistTheme = (playlistId: string) => {
    const url = useHermesUrl();
    return useQuery({
        enabled: !!url && !!playlistId,
        queryFn: () => sourApi.playlistTheme(url, playlistId),
        queryKey: ['playlist-theme', url, playlistId],
        staleTime: 30000,
    });
};

// a theme picture placed the way it was framed: the focus point stays in view, zoomed around it
const frameStyle = (theme: PlaylistTheme, image: string): CSSProperties => {
    const x = theme.focusX ?? 50;
    const y = theme.focusY ?? 50;
    const zoom = theme.zoom ?? 100;
    return {
        backgroundImage: `url("${image}")`,
        backgroundPosition: `${x}% ${y}%`,
        transform: zoom > 100 ? `scale(${zoom / 100})` : undefined,
        transformOrigin: `${x}% ${y}%`,
    };
};

// Drag on the picture (or click) to choose the part that stays in view; the slider zooms in
const FramePicker = ({
    image,
    onSave,
    theme,
}: {
    image: string;
    onSave: (frame: { focusX: number; focusY: number; zoom: number }) => void;
    theme: PlaylistTheme;
}) => {
    const [frame, setFrame] = useState({
        focusX: theme.focusX ?? 50,
        focusY: theme.focusY ?? 50,
        zoom: theme.zoom ?? 100,
    });
    const dragging = useRef(false);
    const moveTo = (e: React.PointerEvent<HTMLDivElement>) => {
        const box = e.currentTarget.getBoundingClientRect();
        const clamp = (v: number) => Math.round(Math.min(100, Math.max(0, v)));
        setFrame((f) => ({
            ...f,
            focusX: clamp(((e.clientX - box.left) / box.width) * 100),
            focusY: clamp(((e.clientY - box.top) / box.height) * 100),
        }));
    };
    return (
        <Stack gap={6}>
            <Text size="sm">Position (drag on the picture)</Text>
            <div
                className={styles.framer}
                onPointerDown={(e) => {
                    dragging.current = true;
                    e.currentTarget.setPointerCapture(e.pointerId);
                    moveTo(e);
                }}
                onPointerMove={(e) => dragging.current && moveTo(e)}
                onPointerUp={() => {
                    dragging.current = false;
                    onSave(frame);
                }}
            >
                <div
                    className={styles['picture-inner']}
                    style={frameStyle({ ...theme, ...frame }, image)}
                />
                <span
                    className={styles['framer-dot']}
                    style={{ left: `${frame.focusX}%`, top: `${frame.focusY}%` }}
                />
            </div>
            <Group gap="xs" wrap="nowrap">
                <Text size="xs" style={{ whiteSpace: 'nowrap' }}>
                    Zoom
                </Text>
                <Slider
                    label={(v) => `${v}%`}
                    max={300}
                    min={100}
                    onChange={(zoom) => setFrame((f) => ({ ...f, zoom }))}
                    onChangeEnd={(zoom) => onSave({ ...frame, zoom })}
                    style={{ flex: 1 }}
                    value={frame.zoom}
                />
                <Button
                    onClick={() => {
                        const reset = { focusX: 50, focusY: 50, zoom: 100 };
                        setFrame(reset);
                        onSave(reset);
                    }}
                    size="compact-xs"
                    variant="subtle"
                >
                    Reset
                </Button>
            </Group>
        </Stack>
    );
};

// Pick a playlist's colour and picture. Everyone with Sour Player sees it and can change it (an
// admin can lock it).
const PlaylistThemeEditor = ({ playlistId }: { playlistId: string }) => {
    const url = useHermesUrl();
    const me = useSourStore((state) => state.me);
    const queryClient = useQueryClient();
    const theme = usePlaylistTheme(playlistId);
    const crossfade = useSourStore((state) => state.crossfade[playlistId]);
    const setCrossfade = (seconds: number | undefined) => {
        const all = { ...useSourStore.getState().crossfade };
        if (seconds === undefined) delete all[playlistId];
        else all[playlistId] = seconds;
        useSourStore.getState().set({ crossfade: all });
    };
    const [color, setColor] = useState(theme.data?.color || '');
    const [opacity, setOpacity] = useState(theme.data?.opacity ?? 100);
    const perks = useMyProfile().data?.perks ?? [];
    const admin = perks.includes('admin');
    const [busy, setBusy] = useState(false);

    const save = (changes: {
        color?: null | string;
        focusX?: number;
        focusY?: number;
        font?: null | string;
        image?: null | string;
        locked?: boolean;
        opacity?: number;
        remove?: boolean;
        zoom?: number;
    }) => {
        if (!me) return Promise.resolve();
        setBusy(true);
        return sourApi
            .setPlaylistTheme(url, me, playlistId, changes)
            .then(() =>
                queryClient.invalidateQueries({ queryKey: ['playlist-theme', url, playlistId] }),
            )
            .catch((error: Error) => toast.error({ message: error.message }))
            .finally(() => setBusy(false));
    };

    const picture = (file: File | null) => {
        if (!file) return;
        readPicture(file, 2000, 6000000)
            .then((image) => save({ image }))
            .catch((error: Error) => toast.error({ message: error.message }));
    };

    if (!url || !me) {
        return <Text isMuted>Playlist themes need Hermes Music (Settings &gt; General).</Text>;
    }

    return (
        <Stack gap="md">
            <Text isMuted size="sm">
                The picture sits at the top of the playlist and fades into the colour as you scroll.
                Everyone with Sour Player sees it.
                {theme.data?.ownerName ? ` Themed by ${theme.data.ownerName}.` : ''}
            </Text>
            <ColorInput
                label="Colour"
                onChange={setColor}
                placeholder="Pick a colour"
                swatches={['#1e3a8a', '#4c1d95', '#134e4a', '#14532d', '#7c2d12', '#881337']}
                value={color}
            />
            {!!color && (
                <Stack gap={2}>
                    <Text size="sm">How strong the colour is</Text>
                    <Slider
                        label={(v) => `${v}%`}
                        max={100}
                        min={10}
                        onChange={setOpacity}
                        value={opacity}
                    />
                </Stack>
            )}
            <Group gap="xs">
                <FileButton accept="image/png,image/jpeg,image/webp,image/gif" onChange={picture}>
                    {(props) => (
                        <Button {...props} disabled={busy} size="xs" variant="default">
                            {theme.data?.image ? 'Change picture' : 'Add a picture'}
                        </Button>
                    )}
                </FileButton>
                {!!theme.data?.image && (
                    <Button onClick={() => save({ image: null })} size="xs" variant="subtle">
                        Remove picture
                    </Button>
                )}
            </Group>
            {!!theme.data?.image && (
                <FramePicker
                    image={`${url}/api/playlist-themes/${encodeURIComponent(playlistId)}/image?v=${theme.data.image}`}
                    onSave={(frame) => save(frame)}
                    theme={theme.data}
                />
            )}
            <Select
                data={fontChoices(perks).map((f) =>
                    f.value === 'default' ? { ...f, value: '' } : f,
                )}
                label="Title font"
                onChange={(font) => save({ font: font || null })}
                searchable
                value={theme.data?.font || ''}
            />
            <Stack gap={4}>
                <Switch
                    checked={crossfade !== undefined}
                    description="Only on this computer. Your usual crossfade comes back when you play something else."
                    label="Own crossfade for this playlist"
                    onChange={(e) => setCrossfade(e.currentTarget.checked ? 6 : undefined)}
                />
                {crossfade !== undefined && (
                    <Slider
                        label={(v) => `${v} seconds`}
                        max={15}
                        min={0}
                        onChange={(v) => setCrossfade(v)}
                        value={crossfade}
                    />
                )}
            </Stack>
            {admin && !!theme.data && !playlistId.startsWith('fav-') && (
                <Switch
                    checked={!!theme.data.locked}
                    description="Only admins can change it while it's locked."
                    label="Lock this theme"
                    onChange={(e) => save({ locked: e.currentTarget.checked })}
                />
            )}
            <Group justify="space-between">
                {theme.data ? (
                    <Button
                        color="red"
                        onClick={() => save({ remove: true }).then(() => setColor(''))}
                        size="xs"
                        variant="subtle"
                    >
                        Remove theme
                    </Button>
                ) : (
                    <span />
                )}
                <Button
                    disabled={busy}
                    onClick={() => save({ color: color || null, opacity })}
                    size="xs"
                    variant="filled"
                >
                    Save colour
                </Button>
            </Group>
        </Stack>
    );
};

export const openPlaylistTheme = (playlistId: string, title = 'Playlist theme') =>
    openModal({
        children: <PlaylistThemeEditor playlistId={playlistId} />,
        size: 'md',
        title,
    });

// ---------- your Favorites get a theme of their own (only yours, shown on your Favorites page and
// in the Sour Stage when you play from it)
export const favoritesThemeId = () => {
    const me = useSourStore.getState().me;
    return me ? `fav-${me.id}` : null;
};

export const FavoritesThemed = ({ children }: { children: ReactNode }) => {
    const me = useSourStore((state) => state.me);
    if (!me) return <>{children}</>;
    return <PlaylistThemed playlistId={`fav-${me.id}`}>{children}</PlaylistThemed>;
};

export const FavoritesThemeButton = () => {
    const me = useSourStore((state) => state.me);
    if (!me) return null;
    return (
        <Button
            onClick={() => openPlaylistTheme(`fav-${me.id}`, 'Favorites theme')}
            size="compact-sm"
            variant="default"
        >
            Theme
        </Button>
    );
};

// Wraps a playlist page: its colour behind everything and its picture at the top, fading into the
// colour as the song list scrolls down.
export const PlaylistThemed = ({
    children,
    playlistId,
}: {
    children: ReactNode;
    playlistId: string;
}) => {
    const url = useHermesUrl();
    const theme = usePlaylistTheme(playlistId).data;
    const root = useRef<HTMLDivElement>(null);
    const [scrolled, setScrolled] = useState(0);

    // the song list scrolls inside the page, so listen for any scrolling below this element
    useEffect(() => {
        const el = root.current;
        if (!el || !theme?.image) return undefined;
        const onScroll = (event: Event) => {
            const target = event.target as HTMLElement;
            if (typeof target.scrollTop === 'number') setScrolled(target.scrollTop);
        };
        el.addEventListener('scroll', onScroll, true);
        return () => el.removeEventListener('scroll', onScroll, true);
    }, [theme?.image]);

    if (!theme) return <>{children}</>;

    const image = theme.image
        ? `${url}/api/playlist-themes/${encodeURIComponent(playlistId)}/image?v=${theme.image}`
        : null;

    return (
        <div
            className={styles.themed}
            ref={root}
            style={
                {
                    '--sour-title-font': theme.font ? fontFamily(theme.font) : undefined,
                    background: theme.color
                        ? (theme.opacity ?? 100) < 100
                            ? `color-mix(in srgb, ${theme.color} ${theme.opacity}%, transparent)`
                            : theme.color
                        : undefined,
                } as CSSProperties
            }
        >
            {image && (
                <div
                    className={styles.picture}
                    style={{ opacity: Math.max(0.12, 1 - scrolled / 500) }}
                >
                    <div className={styles['picture-inner']} style={frameStyle(theme, image)} />
                </div>
            )}
            <div className={styles.content}>{children}</div>
        </div>
    );
};
