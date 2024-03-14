import { Center, Group, Stack } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { RiCheckFill } from 'react-icons/ri';
import { Link } from 'react-router-dom';
import { Button, PageHeader, Text } from '/@/renderer/components';
import { ActionRequiredContainer } from '/@/renderer/features/action-required/components/action-required-container';
import { ServerCredentialRequired } from '/@/renderer/features/action-required/components/server-credential-required';
import { ServerRequired } from '/@/renderer/features/action-required/components/server-required';
import { AnimatedPage } from '/@/renderer/features/shared';
import { AppRoute } from '/@/renderer/router/routes';
import { useCurrentServer } from '/@/renderer/store';

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

    return (
        <AnimatedPage>
            <PageHeader />
            <Center sx={{ height: '100%', width: '100vw' }}>
                <Stack
                    spacing="xl"
                    sx={{ maxWidth: '50%' }}
                >
                    <Group noWrap>
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
                                    noWrap
                                    position="center"
                                >
                                    <RiCheckFill
                                        color="var(--success-color)"
                                        size={30}
                                    />
                                    <Text size="xl">No issues found</Text>
                                </Group>
                                <Button
                                    component={Link}
                                    disabled={!canReturnHome}
                                    to={AppRoute.HOME}
                                    variant="filled"
                                >
                                    Go back
                                </Button>
                            </>
                        )}
                    </Stack>
                </Stack>
            </Center>
        </AnimatedPage>
    );
};

export default ActionRequiredRoute;
