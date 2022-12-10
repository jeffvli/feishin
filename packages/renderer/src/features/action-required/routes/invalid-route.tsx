import { Center, Group, Stack } from '@mantine/core';
import { RiQuestionLine } from 'react-icons/ri';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button, Text } from '/@/components';
import { AnimatedPage } from '/@/features/shared';

const InvalidRoute = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <AnimatedPage>
      <Center sx={{ height: '100%', width: '100%' }}>
        <Stack>
          <Group
            noWrap
            position="center"
          >
            <RiQuestionLine
              color="var(--warning-color)"
              size={30}
            />
            <Text size="xl">Page not found</Text>
          </Group>
          <Text>{location.pathname}</Text>
          <Button
            variant="filled"
            onClick={() => navigate(-1)}
          >
            Go back
          </Button>
        </Stack>
      </Center>
    </AnimatedPage>
  );
};

export default InvalidRoute;
