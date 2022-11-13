import {
  Tabs as MantineTabs,
  TabsProps as MantineTabsProps,
} from '@mantine/core';
import styled from 'styled-components';

type TabsProps = MantineTabsProps;

const StyledTabs = styled(MantineTabs)`
  button[data-active] {
    color: var(--main-fg);
    border-color: var(--primary-color);
    opacity: 1;

    &:hover {
      border-color: var(--primary-color);
    }
  }

  button {
    color: var(--main-fg);
    opacity: 0.6;

    &:hover {
      background-color: var(--btn-subtle-bg-hover);
    }
  }
`;

export const Tabs = ({ children, ...props }: TabsProps) => {
  return <StyledTabs {...props}>{children}</StyledTabs>;
};

Tabs.List = StyledTabs.List;
Tabs.Panel = StyledTabs.Panel;
Tabs.Tab = StyledTabs.Tab;
