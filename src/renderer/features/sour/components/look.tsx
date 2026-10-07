import { openModal } from '@mantine/modals';
import { useEffect, useRef, useState } from 'react';
import { generatePath, useNavigate } from 'react-router';

import styles from './look.module.css';

import { useItemImageUrl } from '/@/renderer/components/item-image/item-image';
import { groupApi } from '/@/renderer/features/group-play/api/group-play-api';
import { useGroupPlayStore } from '/@/renderer/features/group-play/store/group-play.store';
import { useHermesUrl } from '/@/renderer/features/hermes-video/store/hermes-video.store';
import { openPeople, openProfile } from '/@/renderer/features/sour/components/people';
import { toggleMiniPlayer } from '/@/renderer/features/sour/components/mini-player';
import { ProfileAvatar } from '/@/renderer/features/sour/components/profile-bits';
import { currentHoliday } from '/@/renderer/features/sour/skins/holidays';
import { useSourProfiles, useSourStore } from '/@/renderer/features/sour/store/sour.store';
import { playSound } from '/@/renderer/features/sour/utils/sounds';
import { useFastAverageColor } from '/@/renderer/hooks';
import { AppRoute } from '/@/renderer/router/routes';
import { usePlayerSong, useSettingsStoreActions } from '/@/renderer/store';
import { usePlayerStoreBase } from '/@/renderer/store/player.store';
import { Accordion } from '/@/shared/components/accordion/accordion';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Kbd } from '/@/shared/components/kbd/kbd';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';
import { toast } from '/@/shared/components/toast/toast';
import { AppTheme } from '/@/shared/themes/app-theme-types';
import { LibraryItem } from '/@/shared/types/domain-types';

// Applies the Sour Player look settings: album-colour accent, animated background, reduced motion,
// seasonal theme and the startup sound.
export const LookEffects = () => {
    const look = useSourStore((state) => state.look);
    const song = usePlayerSong();
    const { setSettings } = useSettingsStoreActions();
    const started = useRef(false);
    const imageUrl = useItemImageUrl({
        id: song?.imageId || undefined,
        itemType: LibraryItem.SONG,
        type: 'table',
    });
    const wantColor = look.albumAccent || look.animatedBackground;
    const { background } = useFastAverageColor({
        algorithm: 'dominant',
        src: wantColor ? imageUrl || null : null,
        srcLoaded: true,
    });

    useEffect(() => {
        const root = document.documentElement;
        root.classList.toggle('sour-reduced-motion', look.reducedMotion);
        root.classList.toggle('sour-animated-bg', look.animatedBackground);
    }, [look.animatedBackground, look.reducedMotion]);

    useEffect(() => {
        const root = document.documentElement;
        if (wantColor && background) root.style.setProperty('--sour-album-color', background);
        else root.style.removeProperty('--sour-album-color');
        if (look.albumAccent && background)
            root.style.setProperty('--theme-colors-primary', background);
        else root.style.removeProperty('--theme-colors-primary');
    }, [background, look.albumAccent, wantColor]);

    useEffect(() => {
        if (started.current) return;
        started.current = true;
        if (look.startupSound) window.setTimeout(() => playSound('lemon'), 800);
        // holiday skins (Sour Studio) win over the seasonal Hermes themes while a holiday is on
        if (look.seasonal && !(look.holidays && currentHoliday())) {
            const month = new Date().getMonth() + 1;
            const theme =
                month === 10
                    ? AppTheme.HERMES_SUNSET
                    : month === 12 || month <= 2
                      ? AppTheme.HERMES_OCEAN
                      : month >= 6 && month <= 8
                        ? AppTheme.HERMES_FOREST
                        : month >= 3 && month <= 5
                          ? AppTheme.HERMES_CHERRY
                          : AppTheme.HERMES_MIDNIGHT;
            setSettings({ general: { theme } });
        }
    }, [look.holidays, look.seasonal, look.startupSound, setSettings]);

    return null;
};

// ---------- mini player (the window itself is in mini-player.tsx) ----------
export { toggleMiniPlayer };

export const MiniPlayerButton = () => (
    <ActionIcon
        icon="shrink"
        iconProps={{ size: 'lg' }}
        onClick={(e) => {
            e.stopPropagation();
            toggleMiniPlayer();
        }}
        size="sm"
        tooltip={{ label: 'Mini player (Ctrl+Alt+M)', openDelay: 0 }}
        variant="subtle"
    />
);

// ---------- keyboard shortcuts ----------
const SHORTCUTS: Array<[string, string]> = [
    ['Ctrl + Alt + S', 'Vote to skip (in a station)'],
    ['Ctrl + Alt + R', 'Request music'],
    ['Ctrl + Alt + G', 'Group Play panel'],
    ['Ctrl + Alt + P', 'People'],
    ['Ctrl + Alt + M', 'Mini player'],
    ['?', 'This list'],
];

export const Shortcuts = ({ onRequest }: { onRequest: () => void }) => {
    const url = useHermesUrl();
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const typing =
                /input|textarea|select/i.test((e.target as HTMLElement)?.tagName ?? '') ||
                (e.target as HTMLElement)?.isContentEditable;
            if (e.key === '?' && !typing) {
                openModal({
                    children: (
                        <Stack gap="xs">
                            {SHORTCUTS.map(([keys, what]) => (
                                <div className={styles.shortcut} key={keys}>
                                    <Kbd>{keys}</Kbd>
                                    <Text size="sm">{what}</Text>
                                </div>
                            ))}
                        </Stack>
                    ),
                    title: 'Keyboard shortcuts',
                });
                return;
            }
            if (!e.ctrlKey || !e.altKey) return;
            const key = e.key.toLowerCase();
            const { code, member, state } = useGroupPlayStore.getState();
            if (key === 's' && state?.radio && code && member) {
                groupApi
                    .control(url, code, member, 'next')
                    .then(() => toast.info({ message: 'Voted to skip' }))
                    .catch(() => {});
            } else if (key === 'r') onRequest();
            else if (key === 'g') useGroupPlayStore.setState((s) => ({ panelOpen: !s.panelOpen }));
            else if (key === 'p') openPeople();
            else if (key === 'm') toggleMiniPlayer();
            else return;
            e.preventDefault();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onRequest, url]);
    return null;
};

// ---------- friends on the same song (player bar) ----------
export const FriendChips = () => {
    const song = usePlayerSong();
    const me = useSourStore((state) => state.me);
    const profiles = useSourProfiles().data ?? [];
    const same = profiles.filter(
        (p) => p.id !== me?.id && p.online && p.listening?.id === song?.id,
    );
    if (!song || !same.length) return null;
    return (
        <span
            className={styles.chips}
            title={`Also playing for ${same.map((p) => p.name).join(', ')}`}
        >
            {same.slice(0, 3).map((p) => (
                <button
                    className={styles.chip}
                    key={p.id}
                    onClick={() => openProfile(p)}
                    type="button"
                >
                    <ProfileAvatar profile={p} size={20} />
                </button>
            ))}
        </span>
    );
};

// ---------- next songs when hovering the queue button ----------
export const useQueuePeek = () => {
    const [peek, setPeek] = useState('');
    useEffect(() => {
        const update = () => {
            const player = usePlayerStoreBase.getState();
            const items = player.getQueue().items;
            const at = items.findIndex((x) => x._uniqueId === player.getCurrentSong()?._uniqueId);
            const next = items.slice(at + 1, at + 4).map((x) => x.name);
            setPeek(next.length ? `Up next: ${next.join(', ')}` : '');
        };
        update();
        return usePlayerStoreBase.subscribe(update);
    }, []);
    return peek;
};

// ---------- pinned items at the top of the sidebar ----------
export const SidebarPins = () => {
    const pins = useSourStore((state) => state.pins);
    const set = useSourStore((state) => state.set);
    const navigate = useNavigate();
    if (!pins.length) return null;
    return (
        <Accordion.Item value="pins">
            <Accordion.Control>
                <Text fw={500} variant="secondary">
                    Pinned
                </Text>
            </Accordion.Control>
            <Accordion.Panel>
                {pins.map((p) => (
                    <div className={styles.pin} key={`${p.kind}-${p.id}`}>
                        <button
                            className={styles.pinButton}
                            onClick={() => {
                                if (p.kind === 'album')
                                    navigate(
                                        generatePath(AppRoute.LIBRARY_ALBUMS_DETAIL, {
                                            albumId: p.id,
                                        }),
                                    );
                                else if (p.kind === 'playlist')
                                    navigate(
                                        generatePath(AppRoute.PLAYLISTS_DETAIL_SONGS, {
                                            playlistId: p.id,
                                        }),
                                    );
                                else openProfile({ id: p.id, name: p.name });
                            }}
                            type="button"
                        >
                            <Text size="sm" truncate>
                                {p.name}
                            </Text>
                            <Text isMuted size="xs">
                                {p.kind}
                            </Text>
                        </button>
                        <ActionIcon
                            icon="x"
                            onClick={() => set({ pins: pins.filter((x) => x !== p) })}
                            size="xs"
                            tooltip={{ label: 'Unpin' }}
                            variant="subtle"
                        />
                    </div>
                ))}
            </Accordion.Panel>
        </Accordion.Item>
    );
};

// ---------- crossfade per playlist ----------
// A playlist's own crossfade applies when you start it from its page; your usual crossfade comes back
// once a song from outside that playlist plays.
let activeCrossfade: null | { previous: number; songs: Set<string> } = null;
export const applyPlaylistCrossfade = (playlistId: string, songIds: string[]) => {
    const seconds = useSourStore.getState().crossfade[playlistId];
    if (seconds === undefined) return;
    const player = usePlayerStoreBase.getState();
    activeCrossfade = {
        previous: activeCrossfade?.previous ?? player.player.crossfadeDuration,
        songs: new Set(songIds),
    };
    player.setCrossfadeDuration(seconds);
};
export const CrossfadeWatcher = () => {
    const song = usePlayerSong();
    useEffect(() => {
        if (!activeCrossfade || !song || activeCrossfade.songs.has(song.id)) return;
        usePlayerStoreBase.getState().setCrossfadeDuration(activeCrossfade.previous);
        activeCrossfade = null;
    }, [song]);
    return null;
};
