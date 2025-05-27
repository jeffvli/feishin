import { Tabs as MantineTabs, TabsProps as MantineTabsProps, TabsPanelProps } from '@mantine/core';
import { Suspense } from 'react';

import styles from './tabs.module.css';

type TabsProps = MantineTabsProps;

export const Tabs = ({ children, ...props }: TabsProps) => {
    return (
        <MantineTabs
            classNames={{
                list: styles.list,
                panel: styles.panel,
                root: styles.root,
                tab: styles.tab,
            }}
            {...props}
        >
            {children}
        </MantineTabs>
    );
};

const Panel = ({ children, ...props }: TabsPanelProps) => {
    return (
        <MantineTabs.Panel {...props}>
            <Suspense fallback={<></>}>{children}</Suspense>
        </MantineTabs.Panel>
    );
};

Tabs.List = MantineTabs.List;
Tabs.Panel = Panel;
Tabs.Tab = MantineTabs.Tab;
