import { Stack, Group } from '@mantine/core';
import { RiAlertFill } from 'react-icons/ri';
import { Text } from '/@/components';

interface ActionRequiredContainerProps {
  children: React.ReactNode;
  title: string;
}

export const ActionRequiredContainer = ({ title, children }: ActionRequiredContainerProps) => (
  <Stack sx={{ cursor: 'default', maxWidth: '700px' }}>
    <Group>
      <RiAlertFill
        color="var(--warning-color)"
        size={30}
      />
      <Text
        size="xl"
        sx={{ textTransform: 'uppercase' }}
      >
        {title}
      </Text>
    </Group>
    <Stack>{children}</Stack>
  </Stack>
);
