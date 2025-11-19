/* eslint-disable perfectionist/sort-imports */
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import 'overlayscrollbars/overlayscrollbars.css';
import '/styles/overlayscrollbars.css';
// Base mantine styles (required)
import '@mantine/core/styles/baseline.css';
import '@mantine/core/styles/default-css-variables.css';
import '@mantine/core/styles/global.css';
// Shared mantine styles
import '@mantine/core/styles/Combobox.css';
import '@mantine/core/styles/ScrollArea.css';
import '@mantine/core/styles/UnstyledButton.css';
import '@mantine/core/styles/VisuallyHidden.css';
import '@mantine/core/styles/Paper.css';
import '@mantine/core/styles/Popover.css';
import '@mantine/core/styles/CloseButton.css';
import '@mantine/core/styles/Group.css';
import '@mantine/core/styles/Loader.css';
import '@mantine/core/styles/Overlay.css';
import '@mantine/core/styles/ModalBase.css';
import '@mantine/core/styles/Input.css';
import '@mantine/core/styles/InlineInput.css';
import '@mantine/core/styles/Flex.css';
import '@mantine/core/styles/FloatingIndicator.css';
import '@mantine/core/styles/ActionIcon.css';
// Component-specific mantine styles (needs to be updated if new components are added)
import '@mantine/core/styles/Accordion.css';
import '@mantine/core/styles/ActionIcon.css';
import '@mantine/core/styles/Badge.css';
import '@mantine/core/styles/Button.css';
import '@mantine/core/styles/Center.css';
import '@mantine/core/styles/Checkbox.css';
import '@mantine/core/styles/Code.css';
import '@mantine/core/styles/ColorInput.css';
import '@mantine/core/styles/Dialog.css';
import '@mantine/core/styles/Divider.css';
import '@mantine/core/styles/Flex.css';
import '@mantine/core/styles/Grid.css';
import '@mantine/core/styles/Group.css';
import '@mantine/core/styles/Kbd.css';
import '@mantine/core/styles/LoadingOverlay.css';
import '@mantine/core/styles/Menu.css';
import '@mantine/core/styles/Modal.css';
import '@mantine/core/styles/NumberInput.css';
import '@mantine/core/styles/Pagination.css';
import '@mantine/core/styles/PasswordInput.css';
import '@mantine/core/styles/Pill.css';
import '@mantine/core/styles/Rating.css';
import '@mantine/core/styles/SegmentedControl.css';
import '@mantine/core/styles/Slider.css';
import '@mantine/core/styles/Stack.css';
import '@mantine/core/styles/Switch.css';
import '@mantine/core/styles/Table.css';
import '@mantine/core/styles/Tabs.css';
import '@mantine/core/styles/Text.css';
import '@mantine/core/styles/Title.css';
import '@mantine/core/styles/Tooltip.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';
import isElectron from 'is-electron';
import { useEffect, useMemo, useRef, useState } from 'react';

import i18n from '/@/i18n/i18n';
import { useDiscordRpc } from '/@/renderer/features/discord-rpc/use-discord-rpc';
import { PlayerProvider } from '/@/renderer/features/player/context/player-context';
import { WebAudioContext } from '/@/renderer/features/player/context/webaudio-context';
import { useServerVersion } from '/@/renderer/hooks/use-server-version';
import { IsUpdatedDialog } from '/@/renderer/is-updated-dialog';
import { AppRouter } from '/@/renderer/router/app-router';
import { useCssSettings, useHotkeySettings, useSettingsStore } from '/@/renderer/store';
import { useAppTheme } from '/@/renderer/themes/use-app-theme';
import { sanitizeCss } from '/@/renderer/utils/sanitize';
import { WebAudio } from '/@/shared/types/types';
import '/@/shared/styles/global.css';

const ipc = isElectron() ? window.api.ipc : null;

export const App = () => {
    const { mode, theme } = useAppTheme();
    const language = useSettingsStore((store) => store.general.language);

    const { content, enabled } = useCssSettings();
    const { bindings } = useHotkeySettings();
    const cssRef = useRef<HTMLStyleElement | null>(null);
    useDiscordRpc();
    useServerVersion();

    const [webAudio, setWebAudio] = useState<WebAudio>();

    useEffect(() => {
        if (enabled && content) {
            // Yes, CSS is sanitized here as well. Prevent a suer from changing the
            // localStorage to bypass sanitizing.
            const sanitized = sanitizeCss(content);
            if (!cssRef.current) {
                cssRef.current = document.createElement('style');
                document.body.appendChild(cssRef.current);
            }

            cssRef.current.textContent = sanitized;

            return () => {
                cssRef.current!.textContent = '';
            };
        }

        return () => {};
    }, [content, enabled]);

    const webAudioProvider = useMemo(() => {
        return { setWebAudio, webAudio };
    }, [webAudio]);

    useEffect(() => {
        if (isElectron()) {
            ipc?.send('set-global-shortcuts', bindings);
        }
    }, [bindings]);

    useEffect(() => {
        if (language) {
            i18n.changeLanguage(language);
        }
    }, [language]);

    return (
        <MantineProvider defaultColorScheme={mode as 'dark' | 'light'} theme={theme}>
            <Notifications
                containerWidth="300px"
                position="bottom-center"
                styles={{
                    root: {
                        marginBottom: 90,
                    },
                }}
                zIndex={50000}
            />
            <WebAudioContext.Provider value={webAudioProvider}>
                <PlayerProvider>
                    <AppRouter />
                </PlayerProvider>
            </WebAudioContext.Provider>
            <IsUpdatedDialog />
        </MantineProvider>
    );
};
