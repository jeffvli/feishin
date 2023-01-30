import type { TabsProps as MantineTabsProps } from '@mantine/core';
import { Tabs as MantineTabs } from '@mantine/core';
import styled from 'styled-components';

type TabsProps = MantineTabsProps;

const StyledTabs = styled(MantineTabs)`
  height: 100%;

  & .mantine-Tabs-tabsList {
    padding-right: 1rem;
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
    border-radius: 0;

    &:hover {
      color: var(--btn-subtle-fg-hover);
      background: var(--btn-subtle-bg-hover);
    }

    transition: background 0.2s ease-in-out, color 0.2s ease-in-out;
  }

  button[data-active] {
    color: var(--btn-primary-fg);
    background: none;
    box-shadow: 2px 0 0 var(--primary-color) inset;

    &:hover {
      background: none;
    }
  }

  /* button[data-active]::before {
    content: '';
    border-left: 2px solid var(--primary-color);
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
  } */
`;

export const Tabs = ({ children, ...props }: TabsProps) => {
  return <StyledTabs {...props}>{children}</StyledTabs>;
};

Tabs.List = StyledTabs.List;
Tabs.Panel = StyledTabs.Panel;
Tabs.Tab = StyledTabs.Tab;
