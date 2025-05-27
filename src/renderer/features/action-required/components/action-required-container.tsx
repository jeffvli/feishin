import { ReactNode } from 'react';
import { RiAlertFill } from 'react-icons/ri';

import { Group } from '/@/shared/components/group/group';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';

interface ActionRequiredContainerProps {
    children: ReactNode;
    title: string;
}

export const ActionRequiredContainer = ({ children, title }: ActionRequiredContainerProps) => (
    <Stack style={{ cursor: 'default', maxWidth: '700px' }}>
        <Group>
            <RiAlertFill
                color="var(--theme-colors-state-warning)"
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
