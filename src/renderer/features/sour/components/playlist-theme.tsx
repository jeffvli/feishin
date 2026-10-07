import { openModal } from '@mantine/modals';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { type ReactNode, useEffect, useRef, useState } from 'react';

import styles from './playlist-theme.module.css';

import { useHermesUrl } from '/@/renderer/features/hermes-video/store/hermes-video.store';
import { readPicture, sourApi } from '/@/renderer/features/sour/api/sour-api';
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

// Pick a playlist's colour and picture. Everyone with Sour Player sees it; only the person who
// themed it can change it.
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
    const perks = useMyProfile().data?.perks ?? [];
    const [busy, setBusy] = useState(false);

    const save = (changes: {
        color?: null | string;
        font?: null | string;
        image?: null | string;
        remove?: boolean;
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
            {perks.includes('determination') && (
                <Select
                    data={[
                        { label: 'Normal', value: '' },
                        { label: 'Determination (only yours)', value: 'determination' },
                    ]}
                    label="Title font"
                    onChange={(font) => save({ font: font || null })}
                    value={theme.data?.font || ''}
                />
            )}
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
                    onClick={() => save({ color: color || null })}
                    size="xs"
                    variant="filled"
                >
                    Save colour
                </Button>
            </Group>
        </Stack>
    );
};

export const openPlaylistTheme = (playlistId: string) =>
    openModal({
        children: <PlaylistThemeEditor playlistId={playlistId} />,
        size: 'md',
        title: 'Playlist theme',
    });

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
            className={
                theme.font === 'determination'
                    ? `${styles.themed} sour-font-determination`
                    : styles.themed
            }
            ref={root}
            style={theme.color ? { background: theme.color } : undefined}
        >
            {image && (
                <div
                    className={styles.picture}
                    style={{
                        backgroundImage: `url("${image}")`,
                        opacity: Math.max(0.12, 1 - scrolled / 500),
                    }}
                />
            )}
            <div className={styles.content}>{children}</div>
        </div>
    );
};
