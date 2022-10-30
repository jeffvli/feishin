import React from 'react';
import { Stack, Group } from '@mantine/core';
import { RiAlertFill } from 'react-icons/ri';
import { Text } from '@/renderer/components';

interface ActionRequiredContainerProps {
  children: React.ReactNode;
  title: string;
}

export const ActionRequiredContainer = ({
  title,
  children,
}: ActionRequiredContainerProps) => {
  return (
    <Stack sx={{ cursor: 'default' }}>
      <Group>
        <RiAlertFill color="var(--warning-color)" size={30} />
        <Text size="xl" sx={{ textTransform: 'uppercase' }}>
          {title}
        </Text>
      </Group>
      <Stack>{children}</Stack>
    </Stack>
  );
};
