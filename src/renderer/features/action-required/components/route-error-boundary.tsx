import { Container, Center, Stack, Group, Button, Divider } from '@mantine/core';
import { RiArrowLeftSLine, RiErrorWarningLine, RiHomeFill } from 'react-icons/ri';
import { useNavigate, useRouteError } from 'react-router';
import { Text } from '/@/renderer/components';
import { AppRoute } from '/@/renderer/router/routes';

const RouteErrorBoundary = () => {
  const navigate = useNavigate();
  const error = useRouteError() as any;
  console.log('error', error);

  const handleReload = () => {
    navigate(0);
  };

  const handleReturn = () => {
    navigate(-1);
  };

  const handleHome = () => {
    navigate(AppRoute.HOME);
  };

  return (
    <Container>
      <Center sx={{ height: '100vh' }}>
        <Stack sx={{ maxWidth: '50%' }}>
          <Group>
            <Button
              px={10}
              variant="subtle"
              onClick={handleReturn}
            >
              <RiArrowLeftSLine size={20} />
            </Button>
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
              leftIcon={<RiHomeFill />}
              sx={{ flex: 0.5 }}
              variant="default"
              onClick={handleHome}
            >
              Go home
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

export default RouteErrorBoundary;
