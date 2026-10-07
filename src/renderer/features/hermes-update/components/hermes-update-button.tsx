import isElectron from 'is-electron';
import { useEffect, useState } from 'react';
import { create } from 'zustand';

import { Button } from '/@/shared/components/button/button';
import { Dialog } from '/@/shared/components/dialog/dialog';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';
import { Tooltip } from '/@/shared/components/tooltip/tooltip';

interface HermesUpdate {
    percent?: number;
    state: 'downloading' | 'ready';
    version: string;
}

// what the updater in the main process reports (downloads happen in the background)
const useHermesUpdateStore = create<{ update: HermesUpdate | null }>(() => ({ update: null }));

const utils = isElectron() ? window.api?.utils : undefined;

export const useHermesUpdate = () => useHermesUpdateStore((state) => state.update);

export const installHermesUpdate = () => utils?.hermesUpdateInstall();

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

// Player bar: shows while an update downloads, then turns into an Update button that restarts
// Feishin into the new version. A popup also offers it once per version.
export const HermesUpdateButton = () => {
    useHermesUpdateListener();
    const update = useHermesUpdate();
    const [dismissed, setDismissed] = useState<null | string>(null);

    if (!update) return null;

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
                        Restart now to get the newest Hermes Music features. Or keep listening - it
                        installs the next time you close Sour Player.
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
