import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

import { DesktopLyricsSettingsSection } from './desktop-lyrics-settings';
import { updateDesktopLyricsState } from './desktop-lyrics.store';

import i18n from '/@/i18n/i18n';
import { initCustomThemes } from '/@/renderer/store/custom-themes.store';
import { useAppTheme } from '/@/renderer/themes/use-app-theme';
import { logger } from '/@/renderer/utils/logger';
import { Box } from '/@/shared/components/box/box';
import '/@/shared/styles/global.css';

const api = window.api.desktopLyrics;

const DesktopLyricsSettingsWindow = () => {
    const { mode, theme } = useAppTheme();
    useEffect(() => {
        const unsubscribe = api.onState(updateDesktopLyricsState);
        void api
            .getState()
            .then(updateDesktopLyricsState)
            .catch((error) => logger.error('Failed to load desktop lyrics state', { error }));
        return unsubscribe;
    }, []);
    return (
        <MantineProvider forceColorScheme={mode} theme={theme}>
            <Box h="100vh" p="md" style={{ overflow: 'auto' }}>
                <DesktopLyricsSettingsSection compact />
            </Box>
            <Notifications position="bottom-center" />
        </MantineProvider>
    );
};

const SettingsSurface = () => {
    const [ready, setReady] = useState(false);
    useEffect(() => {
        void Promise.all([
            i18n.changeLanguage(
                new URLSearchParams(window.location.search).get('language') ?? 'en',
            ),
            initCustomThemes(),
        ])
            .catch((error) =>
                logger.error('Failed to initialize desktop lyrics settings', { error }),
            )
            .finally(() => setReady(true));
    }, []);
    return ready ? <DesktopLyricsSettingsWindow /> : null;
};

createRoot(document.getElementById('root')!).render(<SettingsSurface />);
