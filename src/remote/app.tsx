import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';

import '/@/shared/styles/global.css';
import '/@/remote/remote-reset.css';

import { useEffect } from 'react';
import { HashRouter } from 'react-router';

import { Shell } from '/@/remote/components/shell';
import { useAccentColor, useIsDark, useReconnect } from '/@/remote/store';
import { useAppTheme } from '/@/renderer/themes/use-app-theme';
import { AppTheme } from '/@/shared/themes/app-theme-types';

export const App = () => {
    const isDark = useIsDark();
    const reconnect = useReconnect();
    const accentColor = useAccentColor();

    useEffect(() => {
        reconnect();
    }, [reconnect]);

    const { mode, theme } = useAppTheme(isDark ? AppTheme.DEFAULT_DARK : AppTheme.DEFAULT_LIGHT);

    // Overrides the primary color useAppTheme() just set from the static
    // Default Light/Dark theme file with the desktop's actual accent/shade-
    // derived value (see use-remote-settings-push.tsx) — must run after
    // useAppTheme's own effect to win, which it does since this hook is
    // called later in the same component.
    useEffect(() => {
        if (!accentColor) return;
        document.documentElement.style.setProperty(
            '--theme-colors-primary',
            isDark ? accentColor.dark : accentColor.light,
        );
    }, [accentColor, isDark]);

    return (
        // forceColorScheme, not defaultColorScheme — the latter is only
        // read on initial mount (Mantine manages its own color-scheme state
        // afterwards), so toggling isDark via theme-button.tsx correctly
        // updated the --theme-colors-* CSS variables (set directly by
        // useAppTheme's own effect) but never actually reached Mantine's
        // internal data-mantine-color-scheme attribute — anything gated on
        // that specifically, like segmented-control.module.css's
        // `@mixin dark`/`@mixin light` active-tab background, stayed stuck
        // on whatever scheme was active the moment the page first loaded.
        <MantineProvider forceColorScheme={mode} theme={theme}>
            <HashRouter>
                <Shell />
            </HashRouter>
        </MantineProvider>
    );
};
