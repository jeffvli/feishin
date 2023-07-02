import { Center, Stack, Group, Divider, Box } from '@mantine/core';
import { RiArrowLeftSLine, RiErrorWarningLine, RiHome4Line, RiMenuFill } from 'react-icons/ri';
import { useNavigate, useRouteError } from 'react-router';
import { Button, DropdownMenu, Text } from '/@/renderer/components';
import { AppMenu } from '/@/renderer/features/titlebar/components/app-menu';
import { AppRoute } from '/@/renderer/router/routes';

const RouteErrorBoundary = () => {
    const navigate = useNavigate();
    const error = useRouteError() as any;
    console.log('error', error);

    const handleReload = () => {
        navigate(0);
    };

    const handleReturn = () => {
        navigate(-1);
    };

    const handleHome = () => {
        navigate(AppRoute.HOME);
    };

    return (
        <Box bg="var(--main-bg)">
            <Center sx={{ height: '100vh' }}>
                <Stack sx={{ maxWidth: '50%' }}>
                    <Group>
                        <Button
                            px={10}
                            variant="subtle"
                            onClick={handleReturn}
                        >
                            <RiArrowLeftSLine size={20} />
                        </Button>
                        <RiErrorWarningLine
                            color="var(--danger-color)"
                            size={30}
                        />
                        <Text size="lg">Something went wrong</Text>
                    </Group>
                    <Divider my={5} />
                    <Text size="sm">{error?.message}</Text>
                    <Group
                        grow
                        spacing="sm"
                    >
                        <Button
                            leftIcon={<RiHome4Line />}
                            size="md"
                            sx={{ flex: 0.5 }}
                            variant="default"
                            onClick={handleHome}
                        >
                            Go home
                        </Button>
                        <DropdownMenu position="bottom-start">
                            <DropdownMenu.Target>
                                <Button
                                    leftIcon={<RiMenuFill />}
                                    size="md"
                                    sx={{ flex: 0.5 }}
                                    variant="default"
                                >
                                    Menu
                                </Button>
                            </DropdownMenu.Target>
                            <DropdownMenu.Dropdown>
                                <AppMenu />
                            </DropdownMenu.Dropdown>
                        </DropdownMenu>
                    </Group>
                    <Group grow>
                        <Button
                            size="md"
                            variant="filled"
                            onClick={handleReload}
                        >
                            Reload
                        </Button>
                    </Group>
                </Stack>
            </Center>
        </Box>
    );
};

export default RouteErrorBoundary;
