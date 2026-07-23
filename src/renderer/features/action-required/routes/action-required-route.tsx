import { openModal } from '@mantine/modals';
import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router';

import { PageHeader } from '/@/renderer/components/page-header/page-header';
import { ActionRequiredContainer } from '/@/renderer/features/action-required/components/action-required-container';
import { ServerCredentialRequired } from '/@/renderer/features/action-required/components/server-credential-required';
import { ServerRequired } from '/@/renderer/features/action-required/components/server-required';
import styles from '/@/renderer/features/action-required/routes/action-required-route.module.css';
import { isServerLock } from '/@/renderer/features/action-required/utils/window-properties';
import LoginRoute from '/@/renderer/features/login/routes/login-route';
import { ServerList } from '/@/renderer/features/servers/components/server-list';
import { AnimatedPage } from '/@/renderer/features/shared/components/animated-page';
import { PageErrorBoundary } from '/@/renderer/features/shared/components/page-error-boundary';
import { AppRoute } from '/@/renderer/router/routes';
import { useCurrentServerWithCredential } from '/@/renderer/store';
import { Button } from '/@/shared/components/button/button';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { ScrollArea } from '/@/shared/components/scroll-area/scroll-area';
import { Stack } from '/@/shared/components/stack/stack';

const ActionRequiredRoute = () => {
    const { t } = useTranslation();
    const currentServer = useCurrentServerWithCredential();
    const isServerRequired = !currentServer;
    const isCredentialRequired = currentServer && !currentServer.credential;

    const isLoginRequired = isServerLock() && !currentServer;

    const checks = [
        {
            component: <ServerCredentialRequired />,
            title: t('error.credentialsRequired'),
            valid: !isCredentialRequired,
        },
        {
            component: <ServerRequired />,
            title: t('error.serverRequired'),
            valid: !isServerRequired,
        },
    ];

    const canReturnHome = checks.every((c) => c.valid);
    const displayedCheck = checks.find((c) => !c.valid);

    const handleManageServersModal = () => {
        openModal({
            children: <ServerList />,
            title: t('page.appMenu.manageServers'),
        });
    };

    if (isLoginRequired) {
        return <LoginRoute />;
    }

    return (
        <AnimatedPage>
            <PageHeader />
            <div className={styles.wrapper}>
                <Stack className={styles.content} gap="xl">
                    <ScrollArea className={styles.scrollArea}>
                        <Group className={styles.checkGroup} wrap="nowrap">
                            {displayedCheck && (
                                <ActionRequiredContainer title={displayedCheck.title}>
                                    {displayedCheck?.component}
                                </ActionRequiredContainer>
                            )}
                        </Group>
                        <Stack className={styles.actions}>
                            {canReturnHome && <Navigate to={AppRoute.HOME} />}
                            {/* This should be displayed if a credential is required */}
                            {isCredentialRequired && !isServerLock && (
                                <Group justify="center" wrap="nowrap">
                                    <Button
                                        fullWidth
                                        leftSection={<Icon icon="edit" />}
                                        onClick={handleManageServersModal}
                                        variant="filled"
                                    >
                                        {t('page.appMenu.manageServers')}
                                    </Button>
                                </Group>
                            )}
                        </Stack>
                    </ScrollArea>
                </Stack>
            </div>
        </AnimatedPage>
    );
};

const ActionRequiredRouteWithBoundary = () => {
    return (
        <PageErrorBoundary>
            <ActionRequiredRoute />
        </PageErrorBoundary>
    );
};

export default ActionRequiredRouteWithBoundary;
