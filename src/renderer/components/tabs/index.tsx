import {
  Tabs as MantineTabs,
  TabsProps as MantineTabsProps,
} from '@mantine/core';
import styled from 'styled-components';

type TabsProps = MantineTabsProps;

const StyledTabs = styled(MantineTabs)`
  height: 100%;

  & .mantine-Tabs-tabsList {
    padding-right: 1rem;
    border-right: 1px solid var(--generic-border-color);
  }

  &.mantine-Tabs-tab {
    background-color: var(--main-bg);
  }

  & .mantine-Tabs-panel {
    padding: 0 1rem;
  }

  button {
    padding: 1rem;
    color: var(--btn-subtle-fg);

    &:hover {
      color: var(--btn-subtle-fg-hover);
      background: var(--btn-subtle-bg-hover);
    }

    transition: background 0.2s ease-in-out, color 0.2s ease-in-out;
  }

  button[data-active] {
    color: var(--btn-primary-fg);
    background: var(--primary-color);
    border-color: var(--primary-color);

    &:hover {
      background: var(--btn-primary-bg-hover);
      border-color: var(--primary-color);
    }
  }
`;

export const Tabs = ({ children, ...props }: TabsProps) => {
  return <StyledTabs {...props}>{children}</StyledTabs>;
};

Tabs.List = StyledTabs.List;
Tabs.Panel = StyledTabs.Panel;
Tabs.Tab = StyledTabs.Tab;
