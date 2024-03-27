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

export const Shell = () => {
    const connected = useConnected();

    return (
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
                                <Title ta="center">Modshin Remote</Title>
                            </Grid.Col>
                        </MediaQuery>

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
    );
};
