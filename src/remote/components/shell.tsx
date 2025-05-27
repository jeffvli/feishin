import { AppShell, Container, Flex, Grid, Image, Skeleton, Title } from '@mantine/core';

import { ImageButton } from '/@/remote/components/buttons/image-button';
import { ReconnectButton } from '/@/remote/components/buttons/reconnect-button';
import { ThemeButton } from '/@/remote/components/buttons/theme-button';
import { RemoteContainer } from '/@/remote/components/remote-container';
import { useConnected } from '/@/remote/store';

export const Shell = () => {
    const connected = useConnected();

    return (
        <AppShell padding="md">
            <AppShell.Header>
                <Grid>
                    <Grid.Col span="auto">
                        <div>
                            <Image
                                fit="contain"
                                height={60}
                                src="/favicon.ico"
                                width={60}
                            />
                        </div>
                    </Grid.Col>
                    <Grid.Col hiddenFrom="md">
                        <Title ta="center">Feishin Remote</Title>
                    </Grid.Col>

                    <Grid.Col span="auto">
                        <Flex
                            direction="row"
                            justify="right"
                        >
                            <ReconnectButton />
                            <ImageButton />
                            <ThemeButton />
                        </Flex>
                    </Grid.Col>
                </Grid>
            </AppShell.Header>
            <Container>
                {connected ? (
                    <RemoteContainer />
                ) : (
                    <Skeleton
                        height={300}
                        width="100%"
                    />
                )}
            </Container>
        </AppShell>
    );
};
