import { MantineProvider } from '@mantine/core';
import { useEffect } from 'react';

import './styles/global.css';

import { Shell } from '/@/remote/components/shell';
import { useIsDark, useReconnect } from '/@/remote/store';

export const App = () => {
    const isDark = useIsDark();
    const reconnect = useReconnect();

    useEffect(() => {
        reconnect();
    }, [reconnect]);

    return (
        <MantineProvider
            defaultColorScheme={isDark ? 'dark' : 'light'}
            theme={{
                components: {
                    AppShell: {
                        styles: {
                            body: {
                                height: '100vh',
                                overflow: 'scroll',
                            },
                        },
                    },
                    Modal: {
                        styles: {
                            body: {
                                background: 'var(--theme-modal-bg)',
                                height: '100vh',
                            },
                            close: { marginRight: '0.5rem' },
                            content: { borderRadius: '5px' },
                            header: {
                                background: 'var(--theme-modal-header-bg)',
                                paddingBottom: '1rem',
                            },
                            title: { fontSize: 'medium', fontWeight: 500 },
                        },
                    },
                },
                defaultRadius: 'xs',
                focusRing: 'auto',
                fontFamily: 'var(--theme-content-font-family)',
                fontSizes: {
                    lg: '1.1rem',
                    md: '1rem',
                    sm: '0.9rem',
                    xl: '1.5rem',
                    xs: '0.8rem',
                },
                headings: {
                    fontFamily: 'var(--theme-content-font-family)',
                    fontWeight: '700',
                },
                other: {},
                spacing: {
                    lg: '2rem',
                    md: '1rem',
                    sm: '0.5rem',
                    xl: '4rem',
                    xs: '0rem',
                },
            }}
        >
            <Shell />
        </MantineProvider>
    );
};
