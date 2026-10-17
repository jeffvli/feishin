import isElectron from 'is-electron';
import { useEffect, useState } from 'react';
import { create } from 'zustand';

import { isAndroidApp, onSourMedia, sourMedia } from '/@/renderer/features/sour/mobile/android';
import { useSourStore } from '/@/renderer/features/sour/store/sour.store';
import { usePlayerStoreBase } from '/@/renderer/store/player.store';
import { Button } from '/@/shared/components/button/button';
import { Dialog } from '/@/shared/components/dialog/dialog';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';
import { Tooltip } from '/@/shared/components/tooltip/tooltip';
import { PlayerStatus } from '/@/shared/types/types';

interface HermesUpdate {
    percent?: number;
    state: 'downloading' | 'ready';
    version: string;
}

// what the updater in the main process reports (downloads happen in the background)
const useHermesUpdateStore = create<{ update: HermesUpdate | null }>(() => ({ update: null }));

const utils = isElectron() ? window.api?.utils : undefined;

export const useHermesUpdate = () => useHermesUpdateStore((state) => state.update);

export const installHermesUpdate = () =>
    isAndroidApp()
        ? sourMedia('installUpdate').catch(() => undefined)
        : utils?.hermesUpdateInstall();

// Android: the app's releases are the mobile-v... ones on GitHub (each with the APK attached)
const RELEASES = 'https://api.github.com/repos/Urmomnumber1/feishin/releases?per_page=30';

const versionParts = (v: string) => (v.match(/\d+/g) || []).map(Number);

const isNewer = (a: string, b: string) => {
    const x = versionParts(a);
    const y = versionParts(b);
    for (let i = 0; i < Math.max(x.length, y.length); i++) {
        if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0);
    }
    return false;
};

const useAndroidUpdateListener = () => {
    useEffect(() => {
        if (!isAndroidApp()) return undefined;
        let busy = false;
        const off = onSourMedia('update', (e: { percent: number }) => {
            const update = useHermesUpdateStore.getState().update;
            if (update?.state === 'downloading') {
                useHermesUpdateStore.setState({ update: { ...update, percent: e.percent } });
            }
        });
        const check = async () => {
            if (busy || useHermesUpdateStore.getState().update) return;
            busy = true;
            try {
                const { code, version } = await sourMedia('info');
                const releases: {
                    assets: { browser_download_url: string; name: string }[];
                    tag_name: string;
                }[] = await fetch(RELEASES).then((r) => r.json());
                // the APK's name ends with its build number (Sour-Player-0.1.0-110.apk): that decides
                // what's newer, so 0.1.0 can follow the 0.1.xb betas
                const build = (r: (typeof releases)[number]) =>
                    Number(
                        r.assets
                            .find((a) => a.name.endsWith('.apk'))
                            ?.name.match(/-(\d+)\.apk$/)?.[1] || 0,
                    );
                const newest = releases
                    .filter(
                        (r) =>
                            r.tag_name.startsWith('mobile-v') &&
                            r.assets.some((a) => a.name.endsWith('.apk')),
                    )
                    .sort(
                        (a, b) => build(b) - build(a) || (isNewer(a.tag_name, b.tag_name) ? -1 : 1),
                    )[0];
                const latest = newest?.tag_name.replace('mobile-v', '');
                if (!newest || !latest) return;
                const newer =
                    build(newest) && code ? build(newest) > Number(code) : isNewer(latest, version);
                if (!newer) return;
                const apk = newest.assets.find((a) => a.name.endsWith('.apk'))!;
                useHermesUpdateStore.setState({
                    update: { percent: 0, state: 'downloading', version: latest },
                });
                await sourMedia('downloadUpdate', { url: apk.browser_download_url });
                useHermesUpdateStore.setState({ update: { state: 'ready', version: latest } });
            } catch {
                if (useHermesUpdateStore.getState().update?.state === 'downloading') {
                    useHermesUpdateStore.setState({ update: null });
                }
            } finally {
                busy = false;
            }
        };
        check();
        const timer = window.setInterval(check, 30 * 60 * 1000);
        return () => {
            off();
            window.clearInterval(timer);
        };
    }, []);
};

// Listens for updates once (mounted in the player bar).
const useHermesUpdateListener = () => {
    useEffect(() => {
        if (!utils?.hermesUpdateListener) return undefined;
        utils.hermesUpdateState().then((update) => {
            if (update) useHermesUpdateStore.setState({ update });
        });
        return utils.hermesUpdateListener((update) => useHermesUpdateStore.setState({ update }));
    }, []);
};

// Auto updates: once the new version has downloaded, Sour Player installs it by itself the
// next time nothing has been playing for a minute (never in the middle of a song)
const useAutoInstall = (enabled: boolean) => {
    useEffect(() => {
        if (!enabled) return undefined;
        let quietSince = 0;
        const timer = window.setInterval(() => {
            const playing = usePlayerStoreBase.getState().player.status === PlayerStatus.PLAYING;
            if (playing) {
                quietSince = 0;
                return;
            }
            if (!quietSince) quietSince = Date.now();
            if (Date.now() - quietSince > 60000) {
                window.clearInterval(timer);
                installHermesUpdate();
            }
        }, 5000);
        return () => window.clearInterval(timer);
    }, [enabled]);
};

// Player bar: shows while an update downloads, then turns into an Update button that restarts
// Feishin into the new version. A popup also offers it once per version.
export const HermesUpdateButton = () => {
    useHermesUpdateListener();
    const update = useHermesUpdate();
    const [dismissed, setDismissed] = useState<null | string>(null);
    const auto = useSourStore((state) => state.look.autoUpdate !== false);

    useAutoInstall(update?.state === 'ready' && auto && !isAndroidApp());

    // Android has its own prompt (AndroidUpdatePrompt)
    if (!update || isAndroidApp()) return null;

    if (update.state === 'downloading') {
        return (
            <Tooltip label={`Downloading Sour Player ${update.version} (${update.percent ?? 0}%)`}>
                <span style={{ display: 'inline-flex', opacity: 0.6 }}>
                    <Icon icon="download" size="md" />
                </span>
            </Tooltip>
        );
    }

    return (
        <>
            <Tooltip label={`Sour Player ${update.version} is ready - click to restart and update`}>
                <Button
                    leftSection={<Icon icon="download" size="sm" />}
                    onClick={(e) => {
                        e.stopPropagation();
                        installHermesUpdate();
                    }}
                    size="compact-xs"
                    variant="filled"
                >
                    Update
                </Button>
            </Tooltip>
            <Dialog
                onClose={() => setDismissed(update.version)}
                opened={dismissed !== update.version}
                position={{ bottom: 100, right: 12 }}
                radius="md"
                size="lg"
                withCloseButton
            >
                <Stack gap="sm">
                    <Text fw={700}>Update ready: Sour Player {update.version}</Text>
                    <Text isMuted size="sm">
                        {auto
                            ? 'It installs by itself the next time nothing is playing for a minute (or when you close Sour Player). Or restart now.'
                            : 'Restart now to get the newest features. Or keep listening - it installs the next time you close Sour Player.'}
                    </Text>
                    <Group justify="flex-end">
                        <Button
                            onClick={() => setDismissed(update.version)}
                            size="xs"
                            variant="default"
                        >
                            Later
                        </Button>
                        <Button onClick={installHermesUpdate} size="xs" variant="filled">
                            Update now
                        </Button>
                    </Group>
                </Stack>
            </Dialog>
        </>
    );
};

// Android: the phone layout has no player bar button, so this finds updates, offers them and (with
// auto updates on) opens the installer once nothing has played for a minute. Always mounted there.
export const AndroidUpdatePrompt = () => {
    useAndroidUpdateListener();
    const update = useHermesUpdate();
    const [dismissed, setDismissed] = useState<null | string>(null);
    const auto = useSourStore((state) => state.look.autoUpdate !== false);
    useAutoInstall(update?.state === 'ready' && auto);

    if (update?.state !== 'ready') return null;
    return (
        <Dialog
            onClose={() => setDismissed(update.version)}
            opened={dismissed !== update.version}
            position={{ bottom: 100, right: 12 }}
            radius="md"
            size="lg"
            withCloseButton
        >
            <Stack gap="sm">
                <Text fw={700}>Update ready: Sour Player {update.version}</Text>
                <Text isMuted size="sm">
                    Android asks you to confirm the install. The first time, allow Sour Player to
                    install apps when it asks.
                </Text>
                <Group justify="flex-end">
                    <Button
                        onClick={() => setDismissed(update.version)}
                        size="xs"
                        variant="default"
                    >
                        Later
                    </Button>
                    <Button onClick={installHermesUpdate} size="xs" variant="filled">
                        Update now
                    </Button>
                </Group>
            </Stack>
        </Dialog>
    );
};
