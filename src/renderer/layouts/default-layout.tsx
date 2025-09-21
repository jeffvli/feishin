import { HotkeyItem, useHotkeys } from '@mantine/hooks';
import clsx from 'clsx';
import isElectron from 'is-electron';
import { lazy, useMemo } from 'react';
import { useNavigate } from 'react-router';

import styles from './default-layout.module.css';

import { ContextMenuProvider } from '/@/renderer/features/context-menu';
import { CommandPalette } from '/@/renderer/features/search/components/command-palette';
import { MainContent } from '/@/renderer/layouts/default-layout/main-content';
import { PlayerBar } from '/@/renderer/layouts/default-layout/player-bar';
import { AppRoute } from '/@/renderer/router/routes';
import {
    useAppStore,
    useCommandPalette,
    useCurrentStatus,
    useQueueStatus,
} from '/@/renderer/store';
import {
    useGeneralSettings,
    useHotkeySettings,
    useSettingsStore,
    useSettingsStoreActions,
    useWindowSettings,
} from '/@/renderer/store/settings.store';
import { Platform, PlaybackType, PlayerStatus } from '/@/shared/types/types';

if (!isElectron()) {
    useSettingsStore.getState().actions.setSettings({
        playback: {
            ...useSettingsStore.getState().playback,
            type: PlaybackType.WEB,
        },
    });
}

const WindowBar = lazy(() =>
    import('/@/renderer/layouts/window-bar').then((module) => ({
        default: module.WindowBar,
    })),
);

interface DefaultLayoutProps {
    shell?: boolean;
}

export const DefaultLayout = ({ shell }: DefaultLayoutProps) => {
    const { windowBarStyle } = useWindowSettings();
    const { opened, ...handlers } = useCommandPalette();
    const { bindings } = useHotkeySettings();
    const navigate = useNavigate();
    const localSettings = isElectron() ? window.api.localSettings : null;
    const settings = useGeneralSettings();
    const { setSettings } = useSettingsStoreActions();
    const playerStatus = useCurrentStatus();
    const { currentSong, index, length } = useQueueStatus();
    const { privateMode } = useAppStore();

    const updateZoom = (increase: number) => {
        const newVal = settings.zoomFactor + increase;
        if (newVal > 300 || newVal < 50 || !isElectron()) return;
        setSettings({
            general: {
                ...settings,
                zoomFactor: newVal,
            },
        });
        localSettings?.setZoomFactor(settings.zoomFactor);
    };
    localSettings?.setZoomFactor(settings.zoomFactor);

    const zoomHotkeys: HotkeyItem[] = [
        [bindings.zoomIn.hotkey, () => updateZoom(5)],
        [bindings.zoomOut.hotkey, () => updateZoom(-5)],
    ];

    useHotkeys([
        [bindings.globalSearch.hotkey, () => handlers.open()],
        [bindings.browserBack.hotkey, () => navigate(-1)],
        [bindings.browserForward.hotkey, () => navigate(1)],
        [bindings.navigateHome.hotkey, () => navigate(AppRoute.HOME)],
        ...(isElectron() ? zoomHotkeys : []),
    ]);

    const title = useMemo(() => {
        const statusString = playerStatus === PlayerStatus.PAUSED ? '(Paused) ' : '';
        const queueString = length ? `(${index + 1} / ${length}) ` : '';
        const privateModeString = privateMode ? '(Private mode)' : '';
        const title = `${
            length
                ? `${statusString}${queueString}${currentSong?.name}${currentSong?.artistName ? ` — ${currentSong?.artistName} — Feishin` : ''}`
                : 'Feishin'
        }${privateMode ? ` ${privateModeString}` : ''}`;
        document.title = title;
        return title;
    }, [currentSong?.artistName, currentSong?.name, index, length, playerStatus, privateMode]);

    return (
        <ContextMenuProvider>
            <div
                className={clsx(styles.layout, {
                    [styles.macos]: windowBarStyle === Platform.MACOS,
                    [styles.windows]: windowBarStyle === Platform.WINDOWS,
                })}
                id="default-layout"
            >
                {windowBarStyle !== Platform.WEB && <WindowBar title={title} />}
                <MainContent shell={shell} />
                <PlayerBar />
            </div>
            <CommandPalette modalProps={{ handlers, opened }} />
        </ContextMenuProvider>
    );
};
