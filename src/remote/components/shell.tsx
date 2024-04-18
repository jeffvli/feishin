import {
    AppShell,
    Container,
    Flex,
    Grid,
    Header,
    Image,
    MediaQuery,
    Skeleton,
    Title,
} from '@mantine/core';
import { ThemeButton } from '/@/remote/components/buttons/theme-button';
import { ImageButton } from '/@/remote/components/buttons/image-button';
import { RemoteContainer } from '/@/remote/components/remote-container';
import { ReconnectButton } from '/@/remote/components/buttons/reconnect-button';
import { useConnected } from '/@/remote/store';
import { NoSleepContext } from '/@/remote/context/nosleep-context';
import NoSleep from 'nosleep.js';
import { useMemo, useState } from 'react';
import { SleepButton } from '/@/remote/components/buttons/sleep-button';
import { ResponsiveMenu } from '/@/remote/components/menu';

export const Shell = () => {
    const connected = useConnected();
    const noSleep = useMemo(() => {
        return new NoSleep();
    }, []);

    const [blockSleep, setBlockSleep] = useState(false);

    const noSleepValue = useMemo(() => {
        return { enabled: blockSleep, noSleep, setEnabled: setBlockSleep };
    }, [blockSleep, noSleep]);

    return (
        <NoSleepContext.Provider value={noSleepValue}>
            <AppShell
                header={
                    <Header height={60}>
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
                            <MediaQuery
                                smallerThan="sm"
                                styles={{ display: 'none' }}
                            >
                                <Grid.Col
                                    sm={6}
                                    xs={0}
                                >
                                    <Title ta="center">Feishin Remote</Title>
                                </Grid.Col>
                            </MediaQuery>
                            <MediaQuery
                                largerThan="md"
                                styles={{ display: 'none' }}
                            >
                                <Grid.Col span="auto">
                                    <Flex
                                        direction="row"
                                        justify="right"
                                    >
                                        <ReconnectButton />
                                        <ResponsiveMenu />
                                    </Flex>
                                </Grid.Col>
                            </MediaQuery>
                            <MediaQuery
                                smallerThan="md"
                                styles={{ display: 'none' }}
                            >
                                <Grid.Col span="auto">
                                    <Flex
                                        direction="row"
                                        justify="right"
                                    >
                                        <ReconnectButton />
                                        <ImageButton />
                                        <ThemeButton />
                                        <SleepButton />
                                    </Flex>
                                </Grid.Col>
                            </MediaQuery>
                        </Grid>
                    </Header>
                }
                padding="md"
            >
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
        </NoSleepContext.Provider>
    );
};
