import { openModal } from '@mantine/modals';
import { useTranslation } from 'react-i18next';
import { RiCheckFill, RiEdit2Line, RiHome4Line } from 'react-icons/ri';
import { Link } from 'react-router-dom';

import { PageHeader } from '/@/renderer/components/page-header/page-header';
import { ActionRequiredContainer } from '/@/renderer/features/action-required/components/action-required-container';
import { ServerCredentialRequired } from '/@/renderer/features/action-required/components/server-credential-required';
import { ServerRequired } from '/@/renderer/features/action-required/components/server-required';
import { ServerList } from '/@/renderer/features/servers';
import { AnimatedPage } from '/@/renderer/features/shared';
import { AppRoute } from '/@/renderer/router/routes';
import { useCurrentServer } from '/@/renderer/store';
import { Button } from '/@/shared/components/button/button';
import { Center } from '/@/shared/components/center/center';
import { Group } from '/@/shared/components/group/group';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';

const ActionRequiredRoute = () => {
    const { t } = useTranslation();
    const currentServer = useCurrentServer();
    const isServerRequired = !currentServer;
    const isCredentialRequired = currentServer && !currentServer.credential;

    const checks = [
        {
            component: <ServerCredentialRequired />,
            title: t('error.credentialsRequired', { postProcess: 'sentenceCase' }),
            valid: !isCredentialRequired,
        },
        {
            component: <ServerRequired />,
            title: t('error.serverRequired', { postProcess: 'serverRequired' }),
            valid: !isServerRequired,
        },
    ];

    const canReturnHome = checks.every((c) => c.valid);
    const displayedCheck = checks.find((c) => !c.valid);

    const handleManageServersModal = () => {
        openModal({
            children: <ServerList />,
            title: t('page.appMenu.manageServers', { postProcess: 'sentenceCase' }),
        });
    };

    return (
        <AnimatedPage>
            <PageHeader />
            <Center style={{ height: '100%', width: '100vw' }}>
                <Stack
                    gap="xl"
                    style={{ maxWidth: '50%' }}
                >
                    <Group wrap="nowrap">
                        {displayedCheck && (
                            <ActionRequiredContainer title={displayedCheck.title}>
                                {displayedCheck?.component}
                            </ActionRequiredContainer>
                        )}
                    </Group>
                    <Stack mt="2rem">
                        {canReturnHome && (
                            <>
                                <Group
                                    justify="center"
                                    wrap="nowrap"
                                >
                                    <RiCheckFill
                                        color="var(--theme-colors-state-success)"
                                        size={30}
                                    />
                                    <Text size="xl">No issues found</Text>
                                </Group>
                                <Button
                                    component={Link}
                                    disabled={!canReturnHome}
                                    leftSection={<RiHome4Line />}
                                    to={AppRoute.HOME}
                                    variant="filled"
                                >
                                    Go back
                                </Button>
                            </>
                        )}
                        {!displayedCheck && (
                            <Group
                                justify="center"
                                wrap="nowrap"
                            >
                                <Button
                                    fullWidth
                                    leftSection={<RiEdit2Line />}
                                    onClick={handleManageServersModal}
                                    variant="filled"
                                >
                                    {t('page.appMenu.manageServers', {
                                        postProcess: 'sentenceCase',
                                    })}
                                </Button>
                            </Group>
                        )}
                    </Stack>
                </Stack>
            </Center>
        </AnimatedPage>
    );
};

export default ActionRequiredRoute;
