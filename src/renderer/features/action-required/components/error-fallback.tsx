import type { FallbackProps } from 'react-error-boundary';
import { RiErrorWarningLine } from 'react-icons/ri';
import { useRouteError } from 'react-router';
import styled from 'styled-components';
import { Button, Center, Group, Stack, Text } from '/@/renderer/components';

export const ErrorFallback = ({ resetErrorBoundary }: FallbackProps) => {
    const error = useRouteError() as any;

    return (
        <Container>
            <Center style={{ height: '100vh' }}>
                <Stack style={{ maxWidth: '50%' }}>
                    <Group gap="xs">
                        <RiErrorWarningLine
                            color="var(--danger-color)"
                            size={30}
                        />
                        <Text size="lg">Something went wrong</Text>
                    </Group>
                    <Text>{error?.message}</Text>
                    <Button
                        variant="filled"
                        onClick={resetErrorBoundary}
                    >
                        Reload
                    </Button>
                </Stack>
            </Center>
        </Container>
    );
};

const Container = styled.div`
    background: var(--main-bg);
`;
