import { Box, Center, Group, Stack } from '@mantine/core';
import { RiErrorWarningLine } from 'react-icons/ri';
import styled from 'styled-components';
import { Button, Text } from '@/renderer/components';

const Container = styled(Box)`
  background: var(--main-bg);
`;

export const ErrorFallback = ({ error, resetErrorBoundary }: any) => {
  return (
    <Container>
      <Center sx={{ height: '100vh' }}>
        <Stack>
          <Group spacing="xs">
            <RiErrorWarningLine color="var(--danger-color)" size={30} />
            <Text size="lg">Something went wrong</Text>
          </Group>
          <Text>{error.message}</Text>
          <Button variant="filled" onClick={resetErrorBoundary}>
            Reload
          </Button>
        </Stack>
      </Center>
    </Container>
  );
};
