import { Suspense } from 'react';
import { TabsPanelProps, TabsProps as MantineTabsProps, Tabs as MantineTabs } from '@mantine/core';
import styled from 'styled-components';

type TabsProps = MantineTabsProps;

const StyledTabs = styled(MantineTabs)`
    height: 100%;

    & .mantine-Tabs-tabsList {
        padding-right: 1rem;
    }

    &.mantine-Tabs-tab {
        padding: 0.5rem 1rem;
        font-size: 1rem;
        font-weight: 600;
        background-color: var(--main-bg);
    }

    & .mantine-Tabs-panel {
        padding: 1.5rem 0.5rem;
    }

    & .mantine-Tabs-tab {
        padding: 1rem;
        color: var(--btn-subtle-fg);
        border-radius: 0;

        &:hover {
            color: var(--btn-subtle-fg-hover);
            background: var(--btn-subtle-bg-hover);
        }

        transition:
            background 0.2s ease-in-out,
            color 0.2s ease-in-out;
    }

    button[data-active] {
        color: var(--btn-subtle-fg);
        background: none;
        border-color: var(--primary-color);

        &:hover {
            background: none;
            border-color: var(--primary-color);
        }
    }
`;

export const Tabs = ({ children, ...props }: TabsProps) => {
    return <StyledTabs {...props}>{children}</StyledTabs>;
};

const Panel = ({ children, ...props }: TabsPanelProps) => {
    return (
        <StyledTabs.Panel {...props}>
            <Suspense fallback={<></>}>{children}</Suspense>
        </StyledTabs.Panel>
    );
};

Tabs.List = StyledTabs.List;
Tabs.Panel = Panel;
Tabs.Tab = StyledTabs.Tab;
