import { AppShell, Container, Flex, Grid, Image, Skeleton } from '@mantine/core';
import { ThemeButton } from '/@/remote/components/buttons/theme-button';
import { ImageButton } from '/@/remote/components/buttons/image-button';
import { RemoteContainer } from '/@/remote/components/remote-container';
import { ReconnectButton } from '/@/remote/components/buttons/reconnect-button';
import { useConnected } from '/@/remote/store';

// TODO: Fix media query

export const Shell = () => {
    const connected = useConnected();

    return (
        <AppShell
            header={{ height: 60 }}
            padding="md"
        >
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
                    {/* <MediaQuery
                        smallerThan="sm"
                        styles={{ display: 'none' }}
                    >
                        <Grid.Col
                            span={{
                                sm: 6,
                                xs: 0,
                            }}
                        >
                            <Title ta="center">Feishin Remote</Title>
                        </Grid.Col>
                    </MediaQuery> */}
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
