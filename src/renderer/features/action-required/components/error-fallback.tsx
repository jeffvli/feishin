import { Box, Center, Group, Stack } from '@mantine/core';
import { FallbackProps } from 'react-error-boundary';
import { RiErrorWarningLine } from 'react-icons/ri';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { Button, Text } from '@/renderer/components';
import { useAuthStore } from '@/renderer/store';

const Container = styled(Box)`
  background: var(--main-bg);
`;

export const ErrorFallback = ({ error, resetErrorBoundary }: FallbackProps) => {
  const logout = useAuthStore((state) => state.logout);

  return (
    <Container>
      <Center sx={{ height: '100vh' }}>
        <Stack sx={{ maxWidth: '50%' }}>
          <Group spacing="xs">
            <RiErrorWarningLine color="var(--danger-color)" size={30} />
            <Text size="lg">Something went wrong</Text>
          </Group>
          <Text>{error.message}</Text>
          <Button variant="filled" onClick={resetErrorBoundary}>
            Reload
          </Button>

          <Button
            component={Link}
            to="/"
            variant="filled"
            onClick={() => {
              logout();
            }}
          >
            Log out
          </Button>
        </Stack>
      </Center>
    </Container>
  );
};
