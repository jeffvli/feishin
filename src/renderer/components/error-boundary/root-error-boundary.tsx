import { ErrorBoundary } from 'react-error-boundary';
import { useTranslation } from 'react-i18next';

import { Box } from '/@/shared/components/box/box';
import { Button } from '/@/shared/components/button/button';
import { Center } from '/@/shared/components/center/center';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';

interface RootErrorFallbackProps {
    error: Error;
    resetErrorBoundary: () => void;
}

const RootErrorFallback = ({ error, resetErrorBoundary }: RootErrorFallbackProps) => {
    const { t } = useTranslation();

    const handleReload = () => {
        window.location.reload();
    };

    return (
        <Box
            style={{
                backgroundColor: 'var(--theme-colors-background)',
                height: '100vh',
                width: '100vw',
            }}
        >
            <Center style={{ height: '100vh' }}>
                <Stack style={{ maxWidth: '50%' }}>
                    <Group gap="xs">
                        <Icon fill="error" icon="error" size="lg" />
                        <Text size="lg">{t('error.genericError')}</Text>
                    </Group>
                    <Text size="sm" style={{ wordBreak: 'break-word' }}>
                        {error?.message || t('error.genericError')}
                    </Text>
                    {process.env.NODE_ENV === 'development' && error?.stack && (
                        <Text
                            size="xs"
                            style={{
                                backgroundColor: 'var(--theme-colors-error)',
                                color: 'var(--theme-colors-errorText)',
                                fontFamily: 'monospace',
                                maxHeight: '300px',
                                overflow: 'auto',
                                padding: '10px',
                                wordBreak: 'break-word',
                            }}
                        >
                            {error.stack}
                        </Text>
                    )}
                    <Group grow>
                        <Button onClick={resetErrorBoundary} size="md" variant="default">
                            {t('common.reload')}
                        </Button>
                        <Button onClick={handleReload} size="md" variant="filled">
                            {t('common.reload')}
                        </Button>
                    </Group>
                </Stack>
            </Center>
        </Box>
    );
};

interface RootErrorBoundaryProps {
    children: React.ReactNode;
}

export const RootErrorBoundary = ({ children }: RootErrorBoundaryProps) => {
    return (
        <ErrorBoundary
            FallbackComponent={RootErrorFallback}
            onError={(error, errorInfo) => {
                if (process.env.NODE_ENV === 'development') {
                    console.error('Root error boundary caught an error:', error, errorInfo);
                }
            }}
            onReset={() => {}}
        >
            {children}
        </ErrorBoundary>
    );
};
