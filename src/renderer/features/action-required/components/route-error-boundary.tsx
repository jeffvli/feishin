import { RiArrowLeftSLine, RiErrorWarningLine, RiHome4Line, RiMenuFill } from 'react-icons/ri';
import { useNavigate, useRouteError } from 'react-router';

import { AppMenu } from '/@/renderer/features/titlebar/components/app-menu';
import { AppRoute } from '/@/renderer/router/routes';
import { Button } from '/@/shared/components/button/button';
import { Center } from '/@/shared/components/center/center';
import { Divider } from '/@/shared/components/divider/divider';
import { DropdownMenu } from '/@/shared/components/dropdown-menu/dropdown-menu';
import { Group } from '/@/shared/components/group/group';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';

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
        <div style={{ backgroundColor: 'var(--theme-colors-background)' }}>
            <Center style={{ height: '100vh' }}>
                <Stack style={{ maxWidth: '50%' }}>
                    <Group>
                        <Button
                            onClick={handleReturn}
                            px={10}
                            variant="subtle"
                        >
                            <RiArrowLeftSLine size={20} />
                        </Button>
                        <RiErrorWarningLine
                            color="var(--theme-colors-state-error)"
                            size={30}
                        />
                        <Text size="lg">Something went wrong</Text>
                    </Group>
                    <Divider my={5} />
                    <Text size="sm">{error?.message}</Text>
                    <Group
                        gap="sm"
                        grow
                    >
                        <Button
                            leftSection={<RiHome4Line />}
                            onClick={handleHome}
                            size="md"
                            style={{ flex: 0.5 }}
                            variant="default"
                        >
                            Go home
                        </Button>
                        <DropdownMenu position="bottom-start">
                            <DropdownMenu.Target>
                                <Button
                                    leftSection={<RiMenuFill />}
                                    size="md"
                                    style={{ flex: 0.5 }}
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
                            onClick={handleReload}
                            size="md"
                            variant="filled"
                        >
                            Reload
                        </Button>
                    </Group>
                </Stack>
            </Center>
        </div>
    );
};

export default RouteErrorBoundary;
