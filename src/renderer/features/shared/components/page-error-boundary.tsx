import { ErrorBoundary } from 'react-error-boundary';
import { useTranslation } from 'react-i18next';

import { ServerSelector } from '/@/renderer/features/sidebar/components/server-selector';
import { Box } from '/@/shared/components/box/box';
import { Button } from '/@/shared/components/button/button';
import { Center } from '/@/shared/components/center/center';
import { Code } from '/@/shared/components/code/code';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { Stack } from '/@/shared/components/stack/stack';
import { TextTitle } from '/@/shared/components/text-title/text-title';
import { Text } from '/@/shared/components/text/text';

interface PageErrorFallbackProps {
    error: Error;
    resetErrorBoundary: () => void;
}

const PageErrorFallback = ({ error, resetErrorBoundary }: PageErrorFallbackProps) => {
    const { t } = useTranslation();

    const handleRefresh = () => {
        window.location.reload();
    };

    return (
        <Box h="100%" pos="relative" w="100%">
            <Box
                style={{
                    padding: 'var(--theme-spacing-md)',
                    position: 'absolute',
                    right: 0,
                    top: 0,
                    zIndex: 100,
                }}
            >
                <ServerSelector />
            </Box>
            <Center h="100%" p="md" w="100%">
                <Stack maw="800px">
                    <Group gap="xs">
                        <Icon fill="error" icon="error" size="lg" />
                        <TextTitle fw={700} order={3}>
                            {t('error.genericError', { postProcess: 'sentenceCase' })}
                        </TextTitle>
                    </Group>
                    <Text style={{ wordBreak: 'break-word' }}>
                        {error?.message || t('error.genericError', { postProcess: 'sentenceCase' })}
                    </Text>
                    {process.env.NODE_ENV === 'development' && error?.stack && (
                        <Code
                            p="md"
                            style={{
                                backgroundColor: 'var(--theme-colors-surface)',
                                fontFamily: 'monospace',
                                maxHeight: '300px',
                                overflow: 'auto',
                                wordBreak: 'break-word',
                            }}
                        >
                            {error.stack}
                        </Code>
                    )}
                    <Group grow>
                        <Button onClick={resetErrorBoundary} size="md" variant="default">
                            {t('common.reload', { postProcess: 'sentenceCase' })}
                        </Button>
                        <Button onClick={handleRefresh} size="md" variant="filled">
                            {t('common.refresh', { postProcess: 'sentenceCase' })}
                        </Button>
                    </Group>
                </Stack>
            </Center>
        </Box>
    );
};

interface PageErrorBoundaryProps {
    children: React.ReactNode;
}

export const PageErrorBoundary = ({ children }: PageErrorBoundaryProps) => {
    return (
        <ErrorBoundary
            FallbackComponent={PageErrorFallback}
            onError={(error, errorInfo) => {
                if (process.env.NODE_ENV === 'development') {
                    console.error('Page error boundary caught an error:', error, errorInfo);
                }
            }}
            onReset={() => {}}
        >
            {children}
        </ErrorBoundary>
    );
};
