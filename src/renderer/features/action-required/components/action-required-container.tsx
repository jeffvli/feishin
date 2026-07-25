import { ReactNode } from 'react';

import styles from '/@/renderer/features/action-required/components/action-required-container.module.css';
import { Group } from '/@/shared/components/group/group';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';

interface ActionRequiredContainerProps {
    children: ReactNode;
    title: string;
}

export const ActionRequiredContainer = ({ children, title }: ActionRequiredContainerProps) => (
    <Stack className={styles.container}>
        <Group>
            <Text className={styles.title} size="xl">
                {title}
            </Text>
        </Group>
        <Stack>{children}</Stack>
    </Stack>
);
