import type { FallbackProps } from 'react-error-boundary';

import { RiErrorWarningLine } from 'react-icons/ri';
import { useRouteError } from 'react-router';

import styles from './error-fallback.module.css';

import { Button } from '/@/shared/components/button/button';
import { Center } from '/@/shared/components/center/center';
import { Group } from '/@/shared/components/group/group';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';

export const ErrorFallback = ({ resetErrorBoundary }: FallbackProps) => {
    const error = useRouteError() as any;

    return (
        <div className={styles.container}>
            <Center style={{ height: '100vh' }}>
                <Stack style={{ maxWidth: '50%' }}>
                    <Group gap="xs">
                        <RiErrorWarningLine
                            color="var(--theme-colors-state-error)"
                            size={30}
                        />
                        <Text size="lg">Something went wrong</Text>
                    </Group>
                    <Text>{error?.message}</Text>
                    <Button
                        onClick={resetErrorBoundary}
                        variant="filled"
                    >
                        Reload
                    </Button>
                </Stack>
            </Center>
        </div>
    );
};
