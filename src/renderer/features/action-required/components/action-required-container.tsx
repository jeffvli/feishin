import { RiAlertFill } from 'react-icons/ri';
import { Group, Stack, Text } from '/@/renderer/components';
import { ReactNode } from 'react';

interface ActionRequiredContainerProps {
    children: ReactNode;
    title: string;
}

export const ActionRequiredContainer = ({ title, children }: ActionRequiredContainerProps) => (
    <Stack style={{ cursor: 'default', maxWidth: '700px' }}>
        <Group>
            <RiAlertFill
                color="var(--warning-color)"
                size={30}
            />
            <Text
                size="xl"
                style={{ textTransform: 'uppercase' }}
            >
                {title}
            </Text>
        </Group>
        <Stack>{children}</Stack>
    </Stack>
);
