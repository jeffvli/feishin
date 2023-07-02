import { useEffect } from 'react';
import { MantineProvider } from '@mantine/core';
import './styles/global.scss';
import '@ag-grid-community/styles/ag-grid.css';
import { useIsDark, useReconnect } from '/@/remote/store';
import { Shell } from '/@/remote/components/shell';

export const App = () => {
    const isDark = useIsDark();
    const reconnect = useReconnect();

    useEffect(() => {
        reconnect();
    }, [reconnect]);

    return (
        <MantineProvider
            withGlobalStyles
            withNormalizeCSS
            theme={{
                colorScheme: isDark ? 'dark' : 'light',
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
                                background: 'var(--modal-bg)',
                                height: '100vh',
                            },
                            close: { marginRight: '0.5rem' },
                            content: { borderRadius: '5px' },
                            header: {
                                background: 'var(--modal-header-bg)',
                                paddingBottom: '1rem',
                            },
                            title: { fontSize: 'medium', fontWeight: 500 },
                        },
                    },
                },
                defaultRadius: 'xs',
                dir: 'ltr',
                focusRing: 'auto',
                focusRingStyles: {
                    inputStyles: () => ({
                        border: '1px solid var(--primary-color)',
                    }),
                    resetStyles: () => ({ outline: 'none' }),
                    styles: () => ({
                        outline: '1px solid var(--primary-color)',
                        outlineOffset: '-1px',
                    }),
                },
                fontFamily: 'var(--content-font-family)',
                fontSizes: {
                    lg: '1.1rem',
                    md: '1rem',
                    sm: '0.9rem',
                    xl: '1.5rem',
                    xs: '0.8rem',
                },
                headings: {
                    fontFamily: 'var(--content-font-family)',
                    fontWeight: 700,
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
