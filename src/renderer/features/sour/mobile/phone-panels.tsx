import { openModal } from '@mantine/modals';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import styles from './phone-panels.module.css';

import { api } from '/@/renderer/api';
import { useItemImageUrl } from '/@/renderer/components/item-image/item-image';
import { useGroupPlayStore } from '/@/renderer/features/group-play/store/group-play.store';
import { usePlayer } from '/@/renderer/features/player/context/player-context';
import { sourMedia } from '/@/renderer/features/sour/mobile/android';
import {
    clearOffline,
    offlineBytes,
    onOfflineProgress,
    setPlaylistOffline,
    syncOffline,
} from '/@/renderer/features/sour/mobile/offline';
import {
    groupCode,
    listenCode,
    useDriving,
    useScannedCode,
} from '/@/renderer/features/sour/mobile/phone-features';
import { usePhoneSettings, usePhoneStore } from '/@/renderer/features/sour/mobile/phone-store';
import { useMyProfile, useSourStore } from '/@/renderer/features/sour/store/sour.store';
import { useCurrentServer, usePlayerSong, usePlayerStatus } from '/@/renderer/store';
import { Button } from '/@/shared/components/button/button';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { NumberInput } from '/@/shared/components/number-input/number-input';
import { SegmentedControl } from '/@/shared/components/segmented-control/segmented-control';
import { Stack } from '/@/shared/components/stack/stack';
import { Switch } from '/@/shared/components/switch/switch';
import { Text } from '/@/shared/components/text/text';
import { toast } from '/@/shared/components/toast/toast';
import { LibraryItem, PlaylistListSort, SortOrder } from '/@/shared/types/domain-types';
import { PlayerStatus } from '/@/shared/types/types';

const mb = (bytes: number) => `${Math.round(bytes / 1024 / 1024)} MB`;

// ---- driving mode: huge buttons, nothing else

export const DrivingMode = () => {
    const open = useDriving((s) => s.open);
    const song = usePlayerSong();
    const status = usePlayerStatus();
    const player = usePlayer();
    const cover = useItemImageUrl({
        id: song?.imageId || undefined,
        imageUrl: song?.imageUrl,
        itemType: LibraryItem.SONG,
        type: 'itemCard',
    });
    const { carDevices } = usePhoneSettings();
    const bluetooth = (window as any).__sourLastBluetooth as string | undefined;
    if (!open) return null;
    return (
        <div className={styles.driving}>
            <div className={styles.drivingTop}>
                <button
                    className={styles.drivingClose}
                    onClick={() => useDriving.setState({ open: false })}
                    type="button"
                >
                    <Icon icon="arrowDownS" size="xl" />
                </button>
                {bluetooth && !carDevices.includes(bluetooth) && (
                    <button
                        className={styles.drivingRemember}
                        onClick={() => {
                            usePhoneStore
                                .getState()
                                .set({ carDevices: [...carDevices, bluetooth] });
                            toast.success({
                                message: `Driving mode opens when ${bluetooth} connects`,
                            });
                        }}
                        type="button"
                    >
                        Open for {bluetooth} automatically
                    </button>
                )}
            </div>
            {cover && <img alt="" className={styles.drivingCover} src={cover} />}
            <div className={styles.drivingTitle}>{song?.name ?? 'Nothing playing'}</div>
            <div className={styles.drivingArtist}>{song?.artistName}</div>
            <div className={styles.drivingButtons}>
                <button onClick={() => player.mediaPrevious(false)} type="button">
                    <Icon icon="mediaPrevious" size="4rem" />
                </button>
                <button
                    className={styles.drivingPlay}
                    onClick={() =>
                        status === PlayerStatus.PLAYING ? player.mediaPause() : player.mediaPlay()
                    }
                    type="button"
                >
                    <Icon
                        icon={status === PlayerStatus.PLAYING ? 'mediaPause' : 'mediaPlay'}
                        size="5rem"
                    />
                </button>
                <button onClick={() => player.mediaNext(false)} type="button">
                    <Icon icon="mediaNext" size="4rem" />
                </button>
            </div>
        </div>
    );
};

// ---- QR codes: my listen along code, the group's invite, and scanning a friend's

const QrImage = ({ text }: { text: string }) => {
    const [src, setSrc] = useState('');
    useEffect(() => {
        sourMedia('qr', { text })
            .then((r) => setSrc(r.image))
            .catch(() => setSrc(''));
    }, [text]);
    return src ? <img alt="QR code" className={styles.qr} src={src} /> : null;
};

const QrPanel = () => {
    const me = useSourStore((s) => s.me);
    const name = useMyProfile().data?.name || 'me';
    const group = useGroupPlayStore((s) => s.code);
    const groupName = useGroupPlayStore((s) => s.state?.name);
    const scanned = useScannedCode();
    return (
        <Stack align="center" gap="md">
            <Button
                fullWidth
                leftSection={<Icon icon="search" />}
                onClick={() =>
                    sourMedia('scanQr')
                        .then((r) => scanned(r.text))
                        .catch(
                            (e: Error) =>
                                e.message !== 'cancelled' && toast.error({ message: e.message }),
                        )
                }
                size="md"
                variant="filled"
            >
                Scan a friend&#39;s code
            </Button>
            {group && (
                <>
                    <Text fw={700}>Join {groupName || 'my Group Play'}</Text>
                    <QrImage text={groupCode(group)} />
                </>
            )}
            {me && (
                <>
                    <Text fw={700}>Listen along with {name}</Text>
                    <QrImage text={listenCode(me.id, name)} />
                </>
            )}
            <Text isMuted size="sm" ta="center">
                Friends scan it from their Sour Player (Menu &gt; Scan or show a code). Android
                removed phone-to-phone tapping (NFC sharing) in Android 10, so codes do the same
                job.
            </Text>
        </Stack>
    );
};

export const openQr = () => openModal({ children: <QrPanel />, title: 'Scan or show a code' });

// ---- offline playlists

const OfflinePanel = () => {
    const server = useCurrentServer();
    const settings = usePhoneSettings();
    const offlinePlaylists = usePhoneStore((s) => s.offlinePlaylists);
    const offline = usePhoneStore((s) => s.offline);
    const [status, setStatus] = useState('');
    const player = usePlayer();
    useEffect(() => onOfflineProgress(setStatus), []);
    const playlists = useQuery({
        enabled: !!server?.id,
        queryFn: () =>
            api.controller.getPlaylistList({
                apiClientProps: { serverId: server!.id },
                query: { sortBy: PlaylistListSort.NAME, sortOrder: SortOrder.ASC, startIndex: 0 },
            } as any),
        queryKey: ['sour-offline-playlists', server?.id],
    });
    const items: { id: string; name: string; songCount?: number }[] =
        (playlists.data as any)?.items ?? [];
    const savedSongs = Object.values(offline);
    return (
        <Stack gap="sm">
            <Text isMuted size="sm">
                Saved songs play without internet. {savedSongs.length} songs, {mb(offlineBytes())}{' '}
                of {settings.offlineLimitMb} MB. {status}
            </Text>
            {savedSongs.length > 0 && (
                <Button
                    onClick={() =>
                        player.addToQueueByData(
                            savedSongs.map((s) => s.song),
                            'now' as any,
                        )
                    }
                    variant="filled"
                >
                    Play everything saved
                </Button>
            )}
            {items.map((p) => (
                <Switch
                    checked={!!offlinePlaylists[p.id]}
                    key={p.id}
                    label={p.name}
                    onChange={(e) => setPlaylistOffline(p.id, server!.id, e.currentTarget.checked)}
                />
            ))}
            <Switch
                checked={settings.offlineWifiOnly}
                label="Only download on Wi-Fi"
                onChange={(e) =>
                    usePhoneStore.getState().set({ offlineWifiOnly: e.currentTarget.checked })
                }
            />
            <NumberInput
                label="Storage limit (MB)"
                max={64000}
                min={100}
                onChange={(v) =>
                    usePhoneStore.getState().set({ offlineLimitMb: Number(v) || 2000 })
                }
                step={500}
                value={settings.offlineLimitMb}
            />
            <Group grow>
                <Button onClick={() => syncOffline()} variant="default">
                    Download now
                </Button>
                <Button
                    color="red"
                    onClick={() =>
                        clearOffline().then(() =>
                            toast.success({ message: 'Offline songs removed' }),
                        )
                    }
                    variant="default"
                >
                    Remove all
                </Button>
            </Group>
        </Stack>
    );
};

export const openOffline = () => openModal({ children: <OfflinePanel />, title: 'Offline' });

// ---- phone settings (Settings > Sour Player > Phone, and the menu)

const PhoneSettingsPanel = () => {
    const s = usePhoneSettings();
    const set = usePhoneStore((st) => st.set);
    const row = (key: keyof typeof s, label: string, hint: string) => (
        <Switch
            checked={!!s[key]}
            description={hint}
            label={label}
            onChange={(e) => set({ [key]: e.currentTarget.checked })}
        />
    );
    return (
        <Stack gap="md">
            {row(
                'autoResume',
                'Play when headphones or the car connect',
                'Unplugging always pauses.',
            )}
            {row(
                'drivingAuto',
                'Driving mode when the car connects',
                'Pick the car once from driving mode (Menu > Driving mode).',
            )}
            {row(
                'dataSaver',
                'Data saver',
                'Smaller files (128 kbps) on mobile data, full quality on Wi-Fi.',
            )}
            {row(
                'lockLyrics',
                'Lyrics on the lock screen',
                'The line being sung shows in the notification.',
            )}
            {row(
                'flipToPause',
                'Flip to pause',
                'Put the phone face down to pause, turn it back to play.',
            )}
            {row(
                'haptics',
                'Feel the beat',
                'A light buzz on the beat while the Sour Stage is open.',
            )}
            <div>
                <Text fw={500} size="sm">
                    Shake the phone
                </Text>
                <SegmentedControl
                    data={[
                        { label: 'Nothing', value: 'off' },
                        { label: 'Shuffle', value: 'shuffle' },
                        { label: 'Skip', value: 'skip' },
                    ]}
                    onChange={(v) => set({ shake: v as typeof s.shake })}
                    size="xs"
                    value={s.shake}
                />
            </div>
            <Text fw={700}>Notifications</Text>
            {row(
                'notifyRequests',
                'My requests are ready',
                'When Hermes Music finishes downloading them.',
            )}
            {row('notifyFollows', 'New releases', 'From artists you follow.')}
            {row('notifyGroups', 'Friends in Group Play', 'When a friend starts or joins one.')}
            <Text isMuted size="xs">
                Notifications arrive while Sour Player is open or playing in the background.
            </Text>
        </Stack>
    );
};

export const openPhoneSettings = () =>
    openModal({ children: <PhoneSettingsPanel />, title: 'Phone settings' });

// ---- "What's playing?": the phone's own song recognition, then share the result back here

export const whatsPlaying = () =>
    sourMedia('musicSearch')
        .then(() =>
            toast.info({
                message:
                    'Found it? Share the song to Sour Player and Hermes Music gets it for you.',
            }),
        )
        .catch((e: Error) => toast.error({ message: e.message }));
