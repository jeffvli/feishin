import {
  Tabs as MantineTabs,
  TabsProps as MantineTabsProps,
} from '@mantine/core';
import styled from 'styled-components';

type TabsProps = MantineTabsProps;

const StyledTabs = styled(MantineTabs)`
  button[data-active] {
    border-color: var(--primary-color);

    &:hover {
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
