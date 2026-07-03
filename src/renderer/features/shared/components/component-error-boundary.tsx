import { ErrorBoundary } from 'react-error-boundary';
import { useTranslation } from 'react-i18next';

import { Box } from '/@/shared/components/box/box';
import { Button } from '/@/shared/components/button/button';
import { Center } from '/@/shared/components/center/center';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { Stack } from '/@/shared/components/stack/stack';
import { TextTitle } from '/@/shared/components/text-title/text-title';

interface ComponentErrorFallbackProps {
    error: Error;
    resetErrorBoundary: () => void;
}

const ComponentErrorFallback = ({ resetErrorBoundary }: ComponentErrorFallbackProps) => {
    const { t } = useTranslation();

    return (
        <Box h="100%" pos="relative" w="100%">
            <Center h="100%" p="md" w="100%">
                <Stack maw="800px">
                    <Group gap="xs">
                        <Icon fill="error" icon="error" size="lg" />
                        <TextTitle fw={600} order={4}>
                            {t('error.genericError')}
                        </TextTitle>
                    </Group>
                    <Group grow>
                        <Button onClick={resetErrorBoundary} size="xs" variant="default">
                            {t('common.reload')}
                        </Button>
                    </Group>
                </Stack>
            </Center>
        </Box>
    );
};

interface ComponentErrorBoundaryProps {
    children: React.ReactNode;
}

export const ComponentErrorBoundary = ({ children }: ComponentErrorBoundaryProps) => {
    return <ErrorBoundary FallbackComponent={ComponentErrorFallback}>{children}</ErrorBoundary>;
};
