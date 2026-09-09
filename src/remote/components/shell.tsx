import { Flex, Grid, Image } from '@mantine/core';

import { ReconnectButton } from '/@/remote/components/buttons/reconnect-button';
import { ThemeButton } from '/@/remote/components/buttons/theme-button';
import { QueueReplaceConfirmSheet } from '/@/remote/components/menus/queue-replace-confirm-sheet';
import { MiniPlayerBar } from '/@/remote/components/mini-player-bar';
import { TabBar } from '/@/remote/components/tab-bar';
import { RemoteRoutes } from '/@/remote/router';
import { useAuthFailed, useConnected } from '/@/remote/store';
import { Center } from '/@/shared/components/center/center';
import { Group } from '/@/shared/components/group/group';
import { Spinner } from '/@/shared/components/spinner/spinner';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';

// A plain flex column instead of Mantine's <AppShell> — AppShell's header/
// footer are `position: fixed` with Main just carrying compensating padding,
// which assumes the *page* scrolls underneath them. The shared global.css
// sets `html, body { overflow: hidden }` for the desktop shell (which this
// app inherits too), so that assumption doesn't hold here: Main has to be
// its own bounded, scrollable flex child instead, which a plain three-row
// flex column (header/main/footer) gives for free — no manual offset
// bookkeeping against Mantine's internal CSS variables required.
export const Shell = () => {
    const connected = useConnected();
    const authFailed = useAuthFailed();

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', width: '100vw' }}>
            <div
                style={{
                    // Tinted, not solid — a full error-color header would
                    // fight with the logo/icons sitting on top of it for
                    // contrast. color-mix keeps it readably close to the
                    // normal surface color while still reading as "attention
                    // needed" at a glance.
                    background: connected
                        ? 'var(--theme-colors-surface)'
                        : 'color-mix(in srgb, var(--theme-colors-state-error) 25%, var(--theme-colors-surface))',
                    borderBottom: '1px solid var(--theme-colors-border)',
                    flexShrink: 0,
                    transition: 'background 200ms ease',
                }}
            >
                <Grid px="md" py="sm">
                    <Grid.Col span={4}>
                        <Flex
                            align="center"
                            direction="row"
                            h="100%"
                            justify="flex-start"
                            style={{
                                justifySelf: 'flex-start',
                            }}
                        >
                            <Image fit="contain" height={32} src="/favicon.ico" width={32} />
                        </Flex>
                    </Grid.Col>
                    <Grid.Col span={8}>
                        <Group gap="sm" justify="flex-end" wrap="nowrap">
                            {/* Only shown when there's actually something to
                                do — auto-retry (store/index.ts) already
                                covers a plain transient drop on its own. */}
                            {!connected && <ReconnectButton />}
                            <ThemeButton />
                        </Group>
                    </Grid.Col>
                </Grid>
            </div>
            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
                {connected ? (
                    <RemoteRoutes />
                ) : authFailed ? (
                    // Distinct from the generic spinner below — retrying
                    // automatically here would just fail again forever
                    // (store/index.ts skips scheduling a retry for this
                    // exact reason), so say so instead of spinning silently.
                    <Center h="100%" p="md" w="100%">
                        <Stack align="center" gap="xs">
                            <Text fw={600} ta="center">
                                Authentication failed
                            </Text>
                            <Text isMuted size="sm" ta="center">
                                Check the remote password and reconnect manually.
                            </Text>
                        </Stack>
                    </Center>
                ) : (
                    <Center h="100%" w="100%">
                        <Spinner />
                    </Center>
                )}
            </div>
            {connected && <MiniPlayerBar />}
            {connected && <QueueReplaceConfirmSheet />}
            {connected && (
                <div
                    style={{
                        background: 'var(--theme-colors-surface)',
                        flexShrink: 0,
                        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
                    }}
                >
                    <TabBar />
                </div>
            )}
        </div>
    );
};
