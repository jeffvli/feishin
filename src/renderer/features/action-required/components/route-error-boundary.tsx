import { useTranslation } from 'react-i18next';
import { useNavigate, useRouteError } from 'react-router';

import { AppMenu } from '/@/renderer/features/titlebar/components/app-menu';
import { AppRoute } from '/@/renderer/router/routes';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Button } from '/@/shared/components/button/button';
import { Center } from '/@/shared/components/center/center';
import { Divider } from '/@/shared/components/divider/divider';
import { DropdownMenu } from '/@/shared/components/dropdown-menu/dropdown-menu';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';

const RouteErrorBoundary = () => {
    const { t } = useTranslation();
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
                        <ActionIcon
                            icon="arrowLeftS"
                            onClick={handleReturn}
                            px={10}
                            variant="subtle"
                        />
                        <Icon
                            fill="error"
                            icon="error"
                            size="lg"
                        />
                        <Text size="lg">{t('error.genericError')}</Text>
                    </Group>
                    <Divider my={5} />
                    <Text size="sm">{error?.message}</Text>
                    <Group
                        gap="sm"
                        grow
                    >
                        <Button
                            leftSection={<Icon icon="home" />}
                            onClick={handleHome}
                            size="md"
                            style={{ flex: 0.5 }}
                            variant="default"
                        >
                            {t('page.home.title')}
                        </Button>
                        <DropdownMenu position="bottom-start">
                            <DropdownMenu.Target>
                                <Button
                                    leftSection={<Icon icon="menu" />}
                                    size="md"
                                    style={{ flex: 0.5 }}
                                    variant="default"
                                >
                                    {t('common.menu')}
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
                            {t('common.reload')}
                        </Button>
                    </Group>
                </Stack>
            </Center>
        </div>
    );
};

export default RouteErrorBoundary;
