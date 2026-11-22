import type { DesktopLyricsState } from '/@/shared/types/desktop-lyrics';

import isElectron from 'is-electron';
import { useTranslation } from 'react-i18next';

import styles from './desktop-lyrics-controls.module.css';
import { updateDesktopLyricsState, useDesktopLyricsState } from './desktop-lyrics.store';

import { logger } from '/@/renderer/utils/logger';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Button } from '/@/shared/components/button/button';
import { Group } from '/@/shared/components/group/group';
import { Text } from '/@/shared/components/text/text';
import { toast } from '/@/shared/components/toast/toast';

const runDesktopLyricsAction = async (
    action: () => Promise<DesktopLyricsState>,
    message: string,
) => {
    try {
        updateDesktopLyricsState(await action());
    } catch (error) {
        logger.error('Desktop lyrics action failed', { error });
        toast.error({ message });
    }
};

export const DesktopLyricsControls = ({
    iconOnly = false,
    recovery = false,
}: {
    iconOnly?: boolean;
    recovery?: boolean;
}) => {
    const { t } = useTranslation();
    const { locked, open, wayland } = useDesktopLyricsState();
    if (!isElectron() || (recovery && !locked)) {
        return null;
    }
    const api = window.api.desktopLyrics;
    const run = (action: () => Promise<DesktopLyricsState>) =>
        void runDesktopLyricsAction(action, t('desktopLyrics.error'));
    const toggle = () =>
        run(() =>
            open
                ? api.close()
                : api.open({
                      close: t('desktopLyrics.close'),
                      title: t('desktopLyrics.title'),
                      unlock: t('desktopLyrics.unlock'),
                  }),
        );
    if (recovery) {
        return (
            <Group
                className={styles.recovery}
                gap="xs"
                onClick={(event) => event.stopPropagation()}
                wrap="nowrap"
            >
                <Text size="xs">{t('desktopLyrics.locked')}</Text>
                <Button
                    aria-label={t('desktopLyrics.unlock')}
                    onClick={() => run(() => api.setLocked(false))}
                    size="compact-xs"
                    variant="filled"
                >
                    {t('desktopLyrics.unlockShort')}
                </Button>
            </Group>
        );
    }
    if (iconOnly) {
        return (
            <ActionIcon
                aria-label={t(open ? 'desktopLyrics.close' : 'desktopLyrics.open')}
                aria-pressed={open}
                icon="appWindow"
                iconProps={{ color: open ? 'info' : undefined, size: 'lg' }}
                onClick={toggle}
                size="sm"
                stopsPropagation
                tooltip={{
                    label: t(open ? 'desktopLyrics.close' : 'desktopLyrics.open'),
                    openDelay: 0,
                }}
                variant="subtle"
            />
        );
    }
    return (
        <Group gap="xs" onClick={(event) => event.stopPropagation()} wrap="wrap">
            <Button onClick={toggle} size="compact-xs" variant="subtle">
                {t(open ? 'desktopLyrics.close' : 'desktopLyrics.open')}
            </Button>
            {open && (
                <Button
                    onClick={() => run(() => api.setLocked(!locked))}
                    size="compact-xs"
                    variant={locked ? 'filled' : 'subtle'}
                >
                    {t(locked ? 'desktopLyrics.unlock' : 'desktopLyrics.lock')}
                </Button>
            )}
            {open && wayland && <Text size="xs">{t('desktopLyrics.wayland')}</Text>}
        </Group>
    );
};
