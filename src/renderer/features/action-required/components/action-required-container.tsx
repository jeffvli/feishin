import { ReactNode } from 'react';

import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';

interface ActionRequiredContainerProps {
    children: ReactNode;
    title: string;
}

export const ActionRequiredContainer = ({ children, title }: ActionRequiredContainerProps) => (
    <Stack style={{ cursor: 'default', maxWidth: '700px' }}>
        <Group>
            <Icon
                fill="warn"
                icon="warn"
                size="lg"
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
