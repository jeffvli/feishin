import { Center, Stack, Group, Divider, Box } from '@mantine/core';
import { RiArrowLeftSLine, RiErrorWarningLine, RiHome4Line } from 'react-icons/ri';
import { useNavigate, useRouteError } from 'react-router';
import { Button, Text } from '/@/renderer/components';
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
    <Box bg="var(--main-bg)">
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
          <Group
            grow
            spacing="sm"
          >
            <Button
              leftIcon={<RiHome4Line />}
              size="md"
              sx={{ flex: 0.5 }}
              variant="default"
              onClick={handleHome}
            >
              Go home
            </Button>
            <Button
              size="md"
              variant="filled"
              onClick={handleReload}
            >
              Reload
            </Button>
          </Group>
        </Stack>
      </Center>
    </Box>
  );
};

export default RouteErrorBoundary;
