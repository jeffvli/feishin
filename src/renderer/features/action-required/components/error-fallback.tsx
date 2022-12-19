import { Box, Center, Divider, Group, Stack } from '@mantine/core';
import type { FallbackProps } from 'react-error-boundary';
import { RiErrorWarningLine, RiArrowLeftLine } from 'react-icons/ri';
import { useNavigate, useRouteError } from 'react-router';
import styled from 'styled-components';
import { Button, Text } from '/@/renderer/components';

const Container = styled(Box)`
  background: var(--main-bg);
`;

export const ErrorFallback = ({ error, resetErrorBoundary }: FallbackProps) => {
  return (
    <Container>
      <Center sx={{ height: '100vh' }}>
        <Stack sx={{ maxWidth: '50%' }}>
          <Group spacing="xs">
            <RiErrorWarningLine
              color="var(--danger-color)"
              size={30}
            />
            <Text size="lg">Something went wrong</Text>
          </Group>
          <Text>{error.message}</Text>
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

export const RouteErrorBoundary = () => {
  const navigate = useNavigate();
  const error = useRouteError() as any;
  console.log('error', error);

  const handleReload = () => {
    navigate(0);
  };

  const handleReturn = () => {
    navigate(-1);
  };

  return (
    <Container>
      <Center sx={{ height: '100vh' }}>
        <Stack sx={{ maxWidth: '50%' }}>
          <Group>
            <RiErrorWarningLine
              color="var(--danger-color)"
              size={30}
            />
            <Text size="lg">Something went wrong</Text>
          </Group>
          <Divider my={5} />
          <Text size="sm">{error?.message}</Text>
          <Group grow>
            <Button
              leftIcon={<RiArrowLeftLine />}
              sx={{ flex: 0.5 }}
              variant="default"
              onClick={handleReturn}
            >
              Go back
            </Button>
            <Button
              variant="filled"
              onClick={handleReload}
            >
              Reload
            </Button>
          </Group>
        </Stack>
      </Center>
    </Container>
  );
};
