import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { PageHeader } from '/@/renderer/components/page-header/page-header';
import { AnimatedPage } from '/@/renderer/features/shared/components/animated-page';
import { PageErrorBoundary } from '/@/renderer/features/shared/components/page-error-boundary';
import { AppRoute } from '/@/renderer/router/routes';
import { Button } from '/@/shared/components/button/button';
import { Center } from '/@/shared/components/center/center';
import { Icon } from '/@/shared/components/icon/icon';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';

const NoNetworkRoute = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const handleRetry = () => {
        // Navigate to home which will trigger authentication again
        navigate(AppRoute.HOME);
    };

    return (
        <AnimatedPage>
            <PageHeader />
            <Center style={{ height: '100%', width: '100vw' }}>
                <Stack gap="xl" style={{ maxWidth: '50%', textAlign: 'center' }}>
                    <Icon icon="wifiOff" size="4rem" />
                    <Stack gap="md">
                        <Text size="xl" weight={600}>
                            {t('error.noNetwork', { postProcess: 'sentenceCase' })}
                        </Text>
                        <Text c="dimmed" size="sm">
                            {t('error.noNetworkDescription', {
                                postProcess: 'sentenceCase',
                            })}
                        </Text>
                    </Stack>
                    <Button
                        leftSection={<Icon icon="refresh" />}
                        onClick={handleRetry}
                        variant="filled"
                    >
                        {t('common.retry', { postProcess: 'sentenceCase' })}
                    </Button>
                </Stack>
            </Center>
        </AnimatedPage>
    );
};

const NoNetworkRouteWithBoundary = () => {
    return (
        <PageErrorBoundary>
            <NoNetworkRoute />
        </PageErrorBoundary>
    );
};

export default NoNetworkRouteWithBoundary;
